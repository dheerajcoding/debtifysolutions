// End-to-end API + compliance tests against the in-memory store: npm test
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "";
process.env.ADMIN_EMAIL = "";

import test from "node:test";
import assert from "node:assert/strict";

const { createApp } = await import("../app.js");
const { db } = await import("../config/db.js");
const { devOutbox } = await import("../lib/mailer.js");
const { EXPLORATION_SLICE, evaluate } = await import("../compliance/engine.js");
const { PROVIDERS, STATE_FEE_CAPS, effectiveFeePct } = await import("../../../shared/config/providers.js");
const { CONSENTS } = await import("../../../shared/config/consents.js");

const server = createApp().listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());

function client() {
  const jar = new Map();
  const call = async (method, path, body, { header = true, form = false } = {}) => {
    const res = await fetch(base + (path.startsWith("/api") || path.startsWith("/sitemap") || path.startsWith("/robots") ? path : "/api" + path), {
      method,
      headers: { ...(body ? { "content-type": form ? "application/x-www-form-urlencoded" : "application/json" } : {}), ...(header ? { "X-Requested-With": "debtify" } : {}), cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") },
      body: body ? (form ? new URLSearchParams(body) : JSON.stringify(body)) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const [k, ...v] = kv.split("=");
      if (/Expires=Thu, 01 Jan 1970/.test(c)) jar.delete(k);
      else jar.set(k, v.join("="));
    }
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { json = { text }; }
    return { status: res.status, body: json };
  };
  return { call };
}

const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
let n = 0;
// No customer accounts: step 2 just collects contact details on the guest-owned file.
async function contact(c, id, extra = {}) {
  n++;
  const email = `u${n}@example.com`;
  const r = await c.call("POST", `/leads/${id}/contact`, { first: "Maria", last: "Lopez", email, phone: extra.phone || "5125550142", terms: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.lead.step, 3);
  return email;
}
async function staffUser(email, password, role = "staff") {
  const bcrypt = (await import("bcryptjs")).default;
  return db.users.create({ userId: "usr_" + email, email, passwordHash: await bcrypt.hash(password, 4), first: "Staff", last: "User", phone: "", lang: "en", role, emailVerified: true, tokenVersion: 0, failedLogins: 0 });
}
// Walks a file to the given step. Returns { id, reg }.
async function walk(c, until, { state = "TX", paymentStatus = "behind", consents = { fcra: true, esign: true, contact_partners: false }, netMonthly = 4200 } = {}) {
  const r1 = await c.call("POST", "/leads", { debtRange: "25000_50000", state, paymentStatus });
  const id = r1.body.lead.leadId;
  const email = await contact(c, id);
  if (until === 3) return { id, email };
  const sent = await c.call("POST", `/leads/${id}/otp/send`);
  assert.ok(sent.body.devCode, JSON.stringify(sent.body));
  assert.equal((await c.call("POST", `/leads/${id}/otp/verify`, { code: sent.body.devCode })).body.lead.phoneVerified, true);
  const idr = await c.call("POST", `/leads/${id}/identity`, { dob: "1984-06-02", ssn: "123-45-6789", address: "100 Main St", city: "Austin", zip: "73301", consents, renderedAt: Date.now() - 5000 });
  assert.equal(idr.status, 200, JSON.stringify(idr.body));
  if (until === 4) return { id, email, lead: idr.body.lead };
  const tls = idr.body.lead.tradelines.map((t) => ({ tlId: t.tlId, selected: t.enrollable || t.needsReview, confirmed: t.needsReview ? "medical" : null }));
  assert.equal((await c.call("PUT", `/leads/${id}/debts`, { tradelines: tls, exclusionsAck: true, advance: true })).body.lead.step, 5);
  const b = await c.call("POST", `/leads/${id}/budget`, { netMonthly, housing: 1500, obligations: 900 });
  if (until === 5) return { id, email, budget: b };
  assert.equal(b.body.lead.step, 6, JSON.stringify(b.body));
  if (until === 6) return { id, email };
  const reg = (await c.call("GET", "/public/registry")).body;
  const h = (k) => ({ hash: reg.disclosures.find((d) => d.key === k).hash, dwellMs: 4000 });
  assert.equal((await c.call("POST", `/leads/${id}/acknowledge`, { quote: true, advance_fee: h("advance_fee"), dedicated_account: h("dedicated_account") })).body.lead.step, 7);
  if (until === 7) return { id, email, h };
  assert.equal((await c.call("POST", `/leads/${id}/comprehension`, { answers: { fee: 2, credit: 0, sue: 1 } })).body.correct, true);
  assert.equal((await c.call("POST", `/leads/${id}/risks`, { creditor_contact: h("creditor_contact"), tax: h("tax"), choice: "settlement" })).body.lead.step, 8);
  return { id, email, h };
}

test("CSRF: state-changing calls need the app header", async () => {
  const r = await client().call("POST", "/auth/login", { email: "a@b.co", password: "x" }, { header: false });
  assert.equal(r.status, 403);
});

test("full journey: quick check → OTP → consents → debts → engine → disclosures → sign → call → enrolled", async () => {
  const c = client();
  const { id, email } = await walk(c, 8);
  await c.call("POST", `/leads/${id}/deposits`);
  assert.equal((await c.call("POST", `/leads/${id}/enroll`, { accept: true, signatureName: "Someone Else", draftDate: inDays(10), achAuthorized: true })).body.details.field, "signatureName");
  assert.equal((await c.call("POST", `/leads/${id}/enroll`, { accept: true, signatureName: "maria  lopez", draftDate: inDays(10), achAuthorized: true })).body.lead.step, 9);
  const call = await c.call("POST", `/leads/${id}/call`, { slot: "now" });
  assert.equal(call.body.call.result, "PASSED");
  assert.equal(call.body.lead.outcome, "enrolled");
  const dash = (await c.call("GET", "/me/application")).body.application;
  assert.equal(dash.firstTwoDeposits.length, 2);
  assert.ok(dash.administrator);
  // Records exist and are append-only
  assert.equal(await db.consents.count({ leadId: id }), 3);
  for (const g of ["phone_verified", "consent_records", "debts_confirmed", "exclusions_acknowledged", "decision_bound", "quote_acknowledged", "ack_advance_fee", "ack_dedicated_account", "comprehension_credit", "ack_creditor_contact", "ack_tax", "alternatives_reviewed", "executed_pack_id", "ach_authorization_id", "verification_call_passed"])
    assert.ok(await db.artifacts.findOne({ leadId: id, gate: g }), `missing artifact ${g}`);
  assert.equal(typeof db.consents.update, "undefined", "consent records cannot be updated");
  assert.equal(typeof db.artifacts.remove, "undefined", "artifacts cannot be deleted");
  assert.equal(await db.decisions.count({ leadId: id }), 1);
});

test("every gate refuses an empty POST", async () => {
  const c = client();
  const { id } = await walk(c, 4);
  // step 4: no exclusions ack
  const tl = (await c.call("GET", `/leads/${id}`)).body.lead.tradelines;
  assert.equal((await c.call("PUT", `/leads/${id}/debts`, { tradelines: tl.map((t) => ({ tlId: t.tlId, selected: t.enrollable })), advance: true })).body.code, "EXCLUSIONS_ACK");
  // out of order: posting a later step is refused
  for (const [path, body] of [[`/leads/${id}/budget`, { netMonthly: 4000, housing: 0, obligations: 0 }], [`/leads/${id}/acknowledge`, {}], [`/leads/${id}/comprehension`, { answers: {} }], [`/leads/${id}/enroll`, { accept: true }], [`/leads/${id}/call`, {}]]) {
    const r = await c.call("POST", path, body);
    assert.ok([400, 403, 409].includes(r.status), `${path} → ${r.status}`);
  }
  // step 6: disclosure ack with a wrong hash is refused
  const c2 = client();
  const w = await walk(c2, 6);
  const r = await c2.call("POST", `/leads/${w.id}/acknowledge`, { quote: true, advance_fee: { hash: "0".repeat(64) }, dedicated_account: { hash: "0".repeat(64) } });
  assert.equal(r.body.code, "DISCLOSURE_STALE");
});

test("consents: none pre-checked, implausibly fast grants refused, contact consent never gates", async () => {
  for (const c of CONSENTS) assert.notEqual(c.defaultChecked, true);
  const c = client();
  const { id } = await walk(c, 3);
  const sent = await c.call("POST", `/leads/${id}/otp/send`);
  await c.call("POST", `/leads/${id}/otp/verify`, { code: sent.body.devCode });
  const fast = await c.call("POST", `/leads/${id}/identity`, { dob: "1984-06-02", ssn: "123456789", address: "1 A St", city: "Austin", zip: "73301", consents: { fcra: true, esign: true }, renderedAt: Date.now() });
  assert.equal(fast.body.code, "IMPLAUSIBLE_GRANT");
  const missing = await c.call("POST", `/leads/${id}/identity`, { dob: "1984-06-02", ssn: "123456789", address: "1 A St", city: "Austin", zip: "73301", consents: { fcra: true }, renderedAt: Date.now() - 3000 });
  assert.equal(missing.body.code, "CONSENT_REQUIRED");
  // declining the optional consent still reaches the plan
  const c2 = client();
  await walk(c2, 7, { consents: { fcra: true, esign: true, contact_partners: false } });
});

test("comprehension: two wrong answers divert to alternatives, never loops", async () => {
  const c = client();
  const { id } = await walk(c, 7);
  const a1 = await c.call("POST", `/leads/${id}/comprehension`, { answers: { fee: 0, credit: 1, sue: 0 } });
  assert.equal(a1.body.diverted, undefined);
  const a2 = await c.call("POST", `/leads/${id}/comprehension`, { answers: { fee: 0, credit: 1, sue: 0 } });
  assert.equal(a2.body.diverted, true);
  assert.equal(a2.body.lead.outcome, "diverted");
  assert.equal((await c.call("POST", `/leads/${id}/comprehension`, { answers: { fee: 2, credit: 0, sue: 1 } })).status, 409);
});

test("alternatives: choosing another option refers out and records the destination", async () => {
  const c = client();
  const { id, h } = await walk(c, 7);
  await c.call("POST", `/leads/${id}/comprehension`, { answers: { fee: 2, credit: 0, sue: 1 } });
  const r = await c.call("POST", `/leads/${id}/risks`, { creditor_contact: h("creditor_contact"), tax: h("tax"), choice: "credit_counselling" });
  assert.equal(r.body.lead.outcome, "referred_out");
  assert.equal(r.body.lead.referral.destination, "credit_counselling");
});

test("knockouts: closed state before any PII; tight budget declined with a logged decision", async () => {
  const c = client();
  const r = await c.call("POST", "/leads", { debtRange: "25000_50000", state: "CA", paymentStatus: "behind" });
  assert.equal(r.body.lead.dropReason, "STATE_NOT_SERVED");
  const c2 = client();
  const { id, budget } = await walk(c2, 5, { netMonthly: 2500 });
  assert.equal(budget.body.lead.outcome, "declined");
  const dec = await db.decisions.findOne({ leadId: id });
  assert.ok(dec.rules.some((x) => x.ruleId === "K-04" && !x.passed));
});

test("decision engine: exploration slice stays, fees never exceed state caps", () => {
  assert.equal(EXPLORATION_SLICE, 0.1);
  for (const p of PROVIDERS) for (const st of p.licensedStates) if (STATE_FEE_CAPS[st] != null) assert.ok(effectiveFeePct(p, st) <= STATE_FEE_CAPS[st]);
  const lines = [{ tlId: "a", creditor: "Chase", type: "credit_card", dpd: 60, balanceBureau: 22000 }];
  const r = evaluate({ stateCode: "TX", lines, disposableIncome: 900, incomeVerified: true });
  assert.equal(r.outcome, "in_progress");
  assert.ok(r.quote.feePct <= STATE_FEE_CAPS.TX);
  assert.ok(r.rules.every((x) => x.stage && x.ruleId));
});

test("TCPA: STOP reply suppresses the number and OTP refuses to text it", async () => {
  const c = client();
  const r = await c.call("POST", "/api/webhooks/sms", { From: "+15125550188", Body: "stop please" }, { header: false, form: true });
  assert.equal(r.status, 200);
  assert.ok(await db.suppressions.findOne({ phoneE164: "+15125550188" }));
  const r1 = await c.call("POST", "/leads", { debtRange: "25000_50000", state: "TX", paymentStatus: "behind" });
  const id = r1.body.lead.leadId;
  await c.call("POST", `/leads/${id}/contact`, { first: "Sam", last: "Reed", email: "stop@example.com", phone: "5125550188", terms: true });
  assert.equal((await c.call("POST", `/leads/${id}/otp/send`)).body.code, "SUPPRESSED");
});

test("access control + SEO files", async () => {
  const c = client();
  const { id } = await walk(c, 3);
  const other = client();
  assert.equal((await other.call("GET", `/leads/${id}`)).status, 404, "another browser can't open the file");
  assert.equal((await other.call("GET", "/admin/stats")).status, 401);
  assert.equal((await c.call("GET", "/me/application")).body.application.leadId, id, "same browser sees its application");
  assert.equal((await c.call("POST", "/auth/register", { email: "x@y.co" })).status, 404, "no customer sign-up");
  const sm = await c.call("GET", "/sitemap.xml");
  assert.match(sm.body.text, /guides\/does-debt-settlement-hurt-your-credit/);
  assert.match((await c.call("GET", "/robots.txt")).body.text, /Disallow: \/staff/);
});

test("staff-only login: lockout, password reset, customers can't sign in", async () => {
  const c = client();
  await staffUser("lee@example.com", "Sunrise2026");
  const ok = await c.call("POST", "/auth/login", { email: "lee@example.com", password: "Sunrise2026" });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.role, "staff");
  await c.call("POST", "/auth/logout");
  await db.users.create({ userId: "usr_cust", email: "cust@example.com", passwordHash: (await import("bcryptjs")).default.hashSync("Sunrise2026", 4), role: "user", tokenVersion: 0 });
  assert.equal((await c.call("POST", "/auth/login", { email: "cust@example.com", password: "Sunrise2026" })).status, 401);
  for (let i = 0; i < 5; i++) await c.call("POST", "/auth/login", { email: "lee@example.com", password: "wrong-pass1" });
  assert.equal((await c.call("POST", "/auth/login", { email: "lee@example.com", password: "Sunrise2026" })).status, 423);
  await c.call("POST", "/auth/forgot-password", { email: "lee@example.com" });
  const link = devOutbox().find((m) => m.to === "lee@example.com" && m.link?.includes("reset-password")).link;
  const token = new URL(link).searchParams.get("token");
  assert.equal((await c.call("POST", "/auth/reset-password", { token, password: "Moonlight2027" })).status, 200);
  assert.equal((await c.call("POST", "/auth/reset-password", { token, password: "Moonlight2028" })).status, 400);
});
