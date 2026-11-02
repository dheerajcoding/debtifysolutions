import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { CLOSED_STATES, PROVIDERS, US_STATES, effectiveFeePct } from "../../../shared/config/providers.js";
import { isAdult } from "../../../shared/config/constants.js";
import {
  COMPREHENSION_MAX_ATTEMPTS, DEBT_RANGES, DOCUMENT_PACK, DONE_STEP, ESTIMATE_RANGES, FRAUD_REVIEW_THRESHOLD,
  MAX_ADDED_ACCOUNTS, MIN_RENDER_TO_GRANT_MS, OTP, PAYMENT_STATUS, SETTLEMENT_ASSUMPTION, STEP_NAMES, ALTERNATIVES,
} from "../../../shared/config/flow.js";
import { ah, HttpError, validate } from "../lib/http.js";
import { encrypt, newId, randomToken, sha256 } from "../lib/crypto.js";
import { sendMail } from "../lib/mailer.js";
import { sendSms } from "../lib/sms.js";
import { ensureGuest, guestHash } from "../middleware/auth.js";
import { CONSENTS, GATES_BEFORE, PARTNER_LIST_HASH, consentHash, disclosureHash, missingGates, writeArtifact } from "../compliance/registry.js";
import { consentText } from "../../../shared/config/es.js";
import { evaluate } from "../compliance/engine.js";
import { canContact } from "../compliance/suppression.js";
import { idCheck, softPull, verificationCall } from "../services/vendors.js";
import { balanceOf, enrolledLines, ENROLLABLE_TYPES, tagTradeline } from "../services/tradelines.js";
import { buildDeposits } from "../services/program.js";
import { QUIZ_ANSWERS } from "../data/quiz.js";

const router = Router();
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");
const pad = (n) => String(n).padStart(2, "0");
const STATE_CODES = US_STATES.map((s) => s.code);
const ACTIVE = ["STARTED", "QUALIFIED", "MATCHED", "SIGNED"];

/** What the browser may see of an application. Secrets and hashes stay server-side. */
export function publicLead(l) {
  if (!l) return null;
  // staffNotes are internal-only and must never reach the consumer; the staff console
  // reads them straight off the record instead.
  const { events, guestTokenHash, dobEnc, addressEnc, otp, staffNotes, ...rest } = l;
  return { ...rest, otp: otp ? { sentAt: otp.sentAt, resends: otp.resends, attempts: otp.attempts, masked: otp.masked } : null };
}

function canAccess(req, lead) {
  if (!lead || lead.source === "sample") return false;
  if (lead.userId) return !!req.user && (req.user.userId === lead.userId || (["staff", "admin"].includes(req.user.role) && lead.source === "demo"));
  const gh = guestHash(req);
  return !!gh && gh === lead.guestTokenHash;
}

const reqMeta = (req) => ({ ip: req.ip || null, ua: req.get("user-agent") || null });

// Loads the lead, runs the handler, saves patch + events, responds { lead, events, ...extra }.
const withLead = (fn) =>
  ah(async (req, res) => {
    const lead = await db.leads.get(req.params.id);
    if (!canAccess(req, lead)) throw new HttpError(404, "Application not found", "NOT_FOUND");
    const events = [];
    const log = (tag, text) => events.push({ tag, text, at: new Date().toISOString() });
    const ctx = { lead, log, patch: {}, extra: {}, user: req.user, meta: reqMeta(req) };
    await fn(req, ctx);
    let saved = lead;
    if (Object.keys(ctx.patch).length) saved = await db.leads.update(lead.leadId, ctx.patch);
    if (events.length) await db.leads.pushEvents(lead.leadId, events);
    res.json({ lead: publicLead(saved), events, ...ctx.extra });
  });

function goStep(ctx, n) {
  ctx.patch.step = n;
  ctx.patch.maxStep = Math.max(ctx.lead.maxStep || 1, n);
  ctx.log("EVENT", `step_view ${pad(n)} ${STEP_NAMES[n]} · ${(ctx.patch.lang || ctx.lead.lang || "en").toUpperCase()}`);
}
function exitFile(ctx, outcome, code) {
  Object.assign(ctx.patch, { status: outcome === "declined" ? "DECLINED" : outcome.toUpperCase(), outcome, dropReason: code, exitStep: ctx.lead.step, step: 0 });
  ctx.log("DB", `application ${ctx.lead.leadId} → ${outcome.toUpperCase()} (${code})`);
}
const atStep = (lead, ...steps) => {
  if (!steps.includes(lead.step)) throw new HttpError(409, "This step isn't available right now. Refresh to continue where you left off.", "WRONG_STEP");
};
// Server-side gate enforcement: the artifacts must already exist in the database.
async function requireGates(ctx, step) {
  const missing = await missingGates(ctx.lead.leadId, GATES_BEFORE[step] || []);
  if (missing.length) {
    ctx.log("GUARD", `gate_unmet: ${missing.join(", ")}`);
    throw new HttpError(403, "A previous step isn't complete yet", "GATE_UNMET", { gates: missing });
  }
}
const artifact = (ctx, gate, detail) => {
  ctx.log("DB", `artifact ${gate} written`);
  return writeArtifact(ctx.lead.leadId, gate, detail);
};

// ---------- S04 quick estimate: ranges only, never a point value ----------
export function quickEstimate(state, band) {
  const debt = DEBT_RANGES[band].mid;
  const pool = PROVIDERS.filter((p) => p.licensedStates.includes(state));
  if (!pool.length) return null;
  const totals = pool.map((p) => ({ total: debt * (SETTLEMENT_ASSUMPTION + effectiveFeePct(p, state)), t: p.underwriting.estimatedTermMonths }));
  const [resLo, resHi] = ESTIMATE_RANGES[band];
  return {
    band,
    resolveLow: resLo,
    resolveHigh: resHi,
    depositLow: Math.round(Math.min(...totals.map((x) => x.total / x.t[1])) / 5) * 5,
    depositHigh: Math.round(Math.max(...totals.map((x) => x.total / x.t[0])) / 5) * 5,
    monthsLow: Math.min(...totals.map((x) => x.t[0])),
    monthsHigh: Math.max(...totals.map((x) => x.t[1])),
    feeLow: Math.min(...pool.map((p) => effectiveFeePct(p, state))),
    feeHigh: Math.max(...pool.map((p) => effectiveFeePct(p, state))),
    providers: pool.length,
    substantiation: "SUB-004-range-methodology",
  };
}

// =====================================================================  STEP 1
router.post(
  "/",
  validate(z.object({
    debtRange: z.enum(Object.keys(DEBT_RANGES), { errorMap: () => ({ message: "Choose how much you owe" }) }),
    state: z.enum(STATE_CODES, { errorMap: () => ({ message: "Choose your state" }) }),
    paymentStatus: z.enum(PAYMENT_STATUS, { errorMap: () => ({ message: "Choose where you are with payments" }) }),
    lang: z.enum(["en", "es"]).default("en"),
    source: z.enum(["web", "demo"]).default("web"),
    persona: z.string().max(40).optional(),
  })),
  ah(async (req, res) => {
    const b = req.body;
    const isStaff = req.user && ["staff", "admin"].includes(req.user.role);
    const source = b.source === "demo" && isStaff && env.demoMode ? "demo" : "web";
    const events = [];
    const log = (tag, text) => events.push({ tag, text, at: new Date().toISOString() });
    const owner = req.user ? { userId: req.user.userId, guestTokenHash: null } : { userId: null, guestTokenHash: ensureGuest(req, res) };
    if (source === "web") {
      const q = req.user ? { userId: req.user.userId } : { guestTokenHash: owner.guestTokenHash, userId: null };
      const open = await db.leads.list({ ...q, outcome: "in_progress", source: "web" }, { omit: ["events"] });
      for (const o of open) if (o.status !== "SIGNED") await db.leads.update(o.leadId, { outcome: "abandoned", exitStep: o.step, dropReason: o.dropReason || "LEFT_AT_STEP_" + pad(o.step) });
    }
    const lead = {
      leadId: newId("app"), ...owner, source, persona: b.persona || null, lang: b.lang, state: b.state, debtRange: b.debtRange,
      debt: DEBT_RANGES[b.debtRange].mid, paymentStatus: b.paymentStatus, heightenedCredit: b.paymentStatus === "current",
      step: 1, maxStep: 1, status: "STARTED", outcome: "in_progress", dropReason: null, exitStep: null,
      tradelines: [], quote: null, program: null, feeStatus: "NOT_EARNED", clarity: {}, consents: [], deposits: [], events: [],
      comprehensionAttempts: 0, incomeVerified: false, skippedBankLink: false, phoneVerified: false,
    };
    log("DB", `application ${lead.leadId} created · ${b.state} · ${DEBT_RANGES[b.debtRange].label} · ${b.paymentStatus} · ${b.lang.toUpperCase()}`);
    const ctx = { lead, log, patch: {} };
    // R2 runs before any personal data is collected.
    if (CLOSED_STATES.includes(b.state)) exitFile(ctx, "declined", "STATE_NOT_SERVED");
    else if (b.debtRange === "lt_7500") exitFile(ctx, "declined", "DEBT_UNDER_MIN");
    else {
      const est = quickEstimate(b.state, b.debtRange);
      if (!est) exitFile(ctx, "declined", "STATE_NOT_SERVED");
      else {
        ctx.patch.estimate = est;
        if (lead.heightenedCredit) log("AI", "payment status current → heightened credit disclosure flagged");
        log("ROUTING", `S04 range: resolve ${usd(est.resolveLow)}–${usd(est.resolveHigh)}; deposit ${usd(est.depositLow)}–${usd(est.depositHigh)}/mo`);
        goStep(ctx, 2);
      }
    }
    Object.assign(lead, ctx.patch, { events });
    const saved = await db.leads.create(lead);
    res.status(201).json({ lead: publicLead(saved), events });
  })
);

router.get(
  "/current",
  ah(async (req, res) => {
    let lead = null;
    if (req.user) lead = (await db.leads.list({ userId: req.user.userId, source: "web" }, { limit: 1, omit: ["events"] }))[0];
    if (!lead) {
      const gh = guestHash(req);
      if (gh) lead = (await db.leads.list({ guestTokenHash: gh, userId: null }, { limit: 1, omit: ["events"] }))[0];
    }
    res.json({ lead: publicLead(lead || null) });
  })
);

router.get("/:id", withLead(async () => {}));

// =====================================================================  STEP 2: contact details (no account needed)
router.post(
  "/:id/contact",
  validate(z.object({
    first: z.string().trim().min(1, "Enter your first name").max(60),
    last: z.string().trim().min(1, "Enter your last name").max(60),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
    phone: z.string().transform((s) => s.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1")).refine((s) => s.length === 10, "Enter a 10-digit US mobile number"),
    terms: z.literal(true, { errorMap: () => ({ message: "Please agree to the Terms and Privacy Policy" }) }),
  })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 2);
    const b = req.body;

    // ── Duplicate detection ──────────────────────────────────────────────────
    // Check if another non-sample lead already has this email or phone.
    // We skip leads that belong to the same guest/user, or that are already
    // done (declined/diverted/abandoned) since those are historical, not active conflicts.
    const ACTIVE_OUTCOMES = ["in_progress", "enrolled"];
    const [byEmail, byPhone] = await Promise.all([
      db.leads.list({ email: b.email.toLowerCase() }, { limit: 5, omit: ["events"] }),
      db.leads.list({ phone: b.phone }, { limit: 5, omit: ["events"] }),
    ]);
    const isDuplicate = (rows) => rows.some(
      (r) =>
        r.source !== "sample" &&
        r.leadId !== ctx.lead.leadId &&
        ACTIVE_OUTCOMES.includes(r.outcome || "in_progress")
    );
    if (isDuplicate(byEmail)) {
      throw new HttpError(409, "An application with this email address already exists. If this is you, use your existing application link.", "DUPLICATE_EMAIL");
    }
    if (isDuplicate(byPhone)) {
      throw new HttpError(409, "An application with this phone number already exists. If this is you, use your existing application link.", "DUPLICATE_PHONE");
    }
    // ────────────────────────────────────────────────────────────────────────

    const changedPhone = ctx.lead.phone && ctx.lead.phone !== b.phone;
    Object.assign(ctx.patch, { first: b.first, last: b.last, email: b.email, phone: b.phone, termsAcceptedAt: new Date().toISOString() });
    if (changedPhone) Object.assign(ctx.patch, { phoneVerified: false, otp: null });
    ctx.log("DB", `contact details saved · ${b.email.replace(/^(.).*@/, "$1•••@")} · ${mask(b.phone)}`);
    goStep(ctx, 3);
  })
);

router.patch(
  "/:id",
  validate(z.object({ step: z.number().int().min(1).max(9).optional(), lang: z.enum(["en", "es"]).optional(), clarity: z.record(z.enum(["clear", "simpler"])).optional() })),
  withLead(async (req, ctx) => {
    const { step, lang, clarity } = req.body;
    if (lang && lang !== ctx.lead.lang) {
      ctx.patch.lang = lang;
      ctx.log("UX", `language → ${lang === "es" ? "Español" : "English"}`);
    }
    if (clarity) {
      const next = { ...ctx.lead.clarity };
      for (const [id, v] of Object.entries(clarity).slice(0, 10)) {
        next[id.slice(0, 24)] = v;
        ctx.log("UX", `clarity · ${id}: ${v === "simpler" ? "asked to explain simpler" : "marked clear"}`);
      }
      ctx.patch.clarity = next;
    }
    if (step !== undefined) {
      const l = ctx.lead;
      // A bound quote is frozen; once past the plan you can't go back and re-run underwriting.
      const floor = l.quote ? 6 : l.phoneVerified ? 3 : 1;
      if (l.outcome !== "in_progress" || l.step >= 8 || step > l.maxStep || step < floor) throw new HttpError(409, "You can't go back to that step", "STEP_LOCKED");
      goStep(ctx, step);
    }
  })
);

// =====================================================================  STEP 3: OTP
const mask = (p) => `(•••) ••• ‑ ${String(p).slice(-4)}`;
function fraudScore(contact, lead) {
  // DEMO: a real score comes from the OTP vendor and device signals.
  let s = 0.05;
  if (/@(mailinator|guerrillamail|10minutemail)\./i.test(contact?.email || "")) s += 0.5;
  if (String(lead.phone || "").endsWith("0666")) s += 0.8;
  return Math.min(1, s);
}

router.post(
  "/:id/otp/send",
  validate(z.object({ phone: z.string().max(20).optional() })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 3);
    if (ctx.lead.phoneVerified) return;
    const demo = ctx.lead.source === "demo";
    const phone = String((demo && req.body.phone) || ctx.lead.phone || "").replace(/\D/g, "");
    if (phone.length < 10) throw new HttpError(400, "Add your mobile number on the previous step first", "NO_PHONE");
    const o = ctx.lead.otp || { resends: -1, attempts: 0 };
    if (o.resends >= OTP.maxResends) throw new HttpError(429, "Too many codes sent. Contact us and a person will help.", "OTP_RESENDS");
    if (o.sentAt && Date.now() - new Date(o.sentAt).getTime() < OTP.resendSeconds * 1000) throw new HttpError(429, `Please wait ${OTP.resendSeconds} seconds before asking for another code`, "OTP_WAIT");
    if (!(await canContact(phone))) throw new HttpError(409, "This number opted out of texts. Reply START to that message, or contact us.", "SUPPRESSED");
    const code = String(Math.floor(Math.random() * 1e6)).padStart(OTP.length, "0");
    ctx.patch.phone = phone;
    ctx.patch.otp = { hash: sha256(ctx.lead.leadId + code), sentAt: new Date().toISOString(), expires: new Date(Date.now() + OTP.ttlMinutes * 6e4).toISOString(), resends: o.resends + 1, attempts: 0, masked: mask(phone) };
    const msg = ctx.lead.lang === "es" ? `Tu código de Debtify es ${code}. Vence en ${OTP.ttlMinutes} minutos.` : `Your Debtify code is ${code}. It expires in ${OTP.ttlMinutes} minutes.`;
    await sendSms(phone, msg, { kind: "otp" });
    ctx.log("VENDOR", `OTP sent to ${mask(phone)} (resend ${o.resends + 1}/${OTP.maxResends})`);
    // Development only: show the code so you can test without a phone.
    if (!env.isProd && !process.env.TWILIO_ACCOUNT_SID) ctx.extra.devCode = code;
  })
);

router.post(
  "/:id/otp/verify",
  validate(z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 3);
    const o = ctx.lead.otp;
    if (!o) throw new HttpError(400, "Send a code first", "OTP_NONE");
    if (o.attempts >= OTP.maxAttempts) throw new HttpError(429, "Too many wrong codes. Ask for a new one.", "OTP_LOCKED");
    if (new Date(o.expires) < new Date()) throw new HttpError(400, "That code expired. Ask for a new one.", "OTP_EXPIRED");
    if (sha256(ctx.lead.leadId + req.body.code) !== o.hash) {
      ctx.patch.otp = { ...o, attempts: o.attempts + 1 };
      throw new HttpError(400, `That code isn't right. ${OTP.maxAttempts - o.attempts - 1} tries left.`, "OTP_WRONG", { field: "code" });
    }
    const score = fraudScore(ctx.lead, ctx.lead);
    ctx.patch.otp = null;
    ctx.patch.phoneVerified = true;
    ctx.patch.fraudScore = score;
    await artifact(ctx, "phone_verified", { masked: o.masked, fraudScore: score });
    ctx.log("VENDOR", `OTP verified · fraud score ${score.toFixed(2)}`);
    if (score >= FRAUD_REVIEW_THRESHOLD) {
      ctx.patch.manualReview = true;
      ctx.patch.resolved = false;
      ctx.log("GUARD", "fraud score over threshold → manual review queue");
    }
  })
);

// =====================================================================  STEP 3: identity + consent + bureau
router.post(
  "/:id/identity",
  validate(z.object({
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth"),
    ssn: z.string().transform((s) => s.replace(/\D/g, "")).refine((s) => s.length === 9, "Enter all 9 digits of your Social Security number"),
    address: z.string().trim().min(3, "Enter your street address").max(120),
    city: z.string().trim().min(2, "Enter your city").max(60),
    zip: z.string().trim().regex(/^\d{5}$/, "Enter a 5-digit ZIP code"),
    consents: z.record(z.boolean()),
    renderedAt: z.number().int().positive(),
    first: z.string().trim().max(60).optional(),
    last: z.string().trim().max(60).optional(),
  })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 3);
    if (!ctx.lead.phoneVerified) throw new HttpError(403, "Verify your mobile number first", "GATE_UNMET", { gates: ["phone_verified"] });
    const b = req.body;
    // K-09: under 18 is a hard knockout, no data retained.
    if (!isAdult(new Date(b.dob + "T12:00:00Z"))) {
      ctx.log("GUARD", "K-09 under 18 → knockout, nothing retained");
      return exitFile(ctx, "declined", "UNDER_18");
    }
    if (Date.now() - b.renderedAt < MIN_RENDER_TO_GRANT_MS) {
      ctx.log("GUARD", "implausible consent grant (< 800ms after render)");
      throw new HttpError(422, "Please take a moment to read the permissions", "IMPLAUSIBLE_GRANT");
    }
    const missing = CONSENTS.filter((c) => c.required && b.consents[c.key] !== true);
    if (missing.length) {
      ctx.log("GUARD", `blocked: required consent missing (${missing.map((m) => m.key).join(", ")})`);
      throw new HttpError(400, "Please agree to the required permissions to continue", "CONSENT_REQUIRED", { field: missing[0].key });
    }
    // Three records, always — a declined consent is recorded as declined. Append-only.
    const lang = ctx.lead.lang || "en";
    const at = new Date().toISOString();
    ctx.patch.consents = [];
    for (const c of CONSENTS) {
      const t = consentText(c.key, lang);
      const granted = b.consents[c.key] === true;
      await db.consents.append({
        recId: newId("con"), leadId: ctx.lead.leadId, key: c.key, granted, lang, textShown: `${t.plain}\n${t.legal}`, versionHash: consentHash(c.key, lang),
        partnerListHash: c.required ? null : PARTNER_LIST_HASH, ip: ctx.meta.ip, userAgent: ctx.meta.ua, renderToGrantMs: Date.now() - b.renderedAt, source: "application", at,
      });
      ctx.patch.consents.push({ key: c.key, granted, versionHash: consentHash(c.key, lang), at });
      ctx.log("CONSENT", `${c.key} ${granted ? "granted" : "declined"} · ${lang.toUpperCase()} · hash ${consentHash(c.key, lang).slice(0, 10)}…`);
    }
    await artifact(ctx, "consent_records", { granted: CONSENTS.filter((c) => b.consents[c.key]).map((c) => c.key) });
    const demo = ctx.lead.source === "demo";
    Object.assign(ctx.patch, {
      first: (demo && b.first) || ctx.lead.first, last: (demo && b.last) || ctx.lead.last,
      ssnLast4: b.ssn.slice(-4), dobEnc: encrypt(b.dob), addressEnc: encrypt(JSON.stringify({ address: b.address, city: b.city, zip: b.zip, state: ctx.lead.state })),
      share: b.consents.contact_partners === true,
    });
    const kyc = await idCheck(b.ssn);
    ctx.patch.kyc = kyc;
    ctx.log("VENDOR", `ID check (mock) → ${kyc}`);
    if (kyc === "FAIL") return exitFile(ctx, "declined", "KYC_FAILED");
    ctx.log("VENDOR", "bureau.pull.start");
    const raw = await softPull(b.ssn, ctx.lead.paymentStatus);
    if (!raw) {
      ctx.log("VENDOR", "bureau.pull.nohit → manual entry");
      Object.assign(ctx.patch, { tradelines: [], bureauNoHit: true, status: "QUALIFIED" });
      return goStep(ctx, 4);
    }
    const tradelines = raw.map(tagTradeline);
    ctx.log("VENDOR", `bureau.pull.ok → ${raw.length} accounts`);
    tradelines.forEach((t) => ctx.log(t.needsReview ? "AI" : "ROUTING", `${t.creditor}: ${t.type}${t.excludedReason ? ` → excluded (${t.excludedReason})` : t.needsReview ? " (unclear → ask consumer)" : " → enrollable"} · ${t.dpd} DPD`));
    ctx.log("DB", "full SSN discarded after vendor calls; DOB and address encrypted (AES-256-GCM)");
    Object.assign(ctx.patch, { tradelines, status: "QUALIFIED" });
    goStep(ctx, 4);
  })
);

// =====================================================================  STEP 4: debts
router.put(
  "/:id/debts",
  validate(z.object({
    tradelines: z.array(z.object({ tlId: z.string(), selected: z.boolean().optional(), confirmed: z.string().nullable().optional(), balanceConfirmed: z.number().min(0).max(1e7).nullable().optional() })).max(80),
    added: z.array(z.object({ creditor: z.string().trim().min(1).max(80), amount: z.number().min(1).max(1e7), type: z.enum(ENROLLABLE_TYPES) })).max(MAX_ADDED_ACCOUNTS).optional(),
    exclusionsAck: z.boolean().optional(),
    advance: z.boolean().optional(),
  })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 4);
    await requireGates(ctx, 4);
    let corrections = 0;
    const tls = ctx.lead.tradelines.filter((t) => t.source !== "consumer").map((tl) => {
      const p = req.body.tradelines.find((z) => z.tlId === tl.tlId);
      if (!p) return tl;
      const next = { ...tl };
      if (tl.needsReview) {
        if (["MEDICAL", "CREDIT_CARD", "COLLECTION", "medical", "credit_card", "collection"].includes(p.confirmed)) Object.assign(next, { confirmed: p.confirmed.toLowerCase(), type: p.confirmed.toLowerCase(), enrollable: true });
        else Object.assign(next, { confirmed: null, type: "OTHER", enrollable: false });
      }
      if (p.balanceConfirmed !== undefined && !tl.excludedReason) {
        const v = p.balanceConfirmed == null ? null : Math.round(p.balanceConfirmed);
        if (v !== null && v !== tl.balanceBureau) corrections++;
        next.balanceConfirmed = v; // the bureau figure is never touched
      }
      next.selected = next.enrollable ? !!p.selected : false;
      return next;
    });
    const added = (req.body.added || []).map((a, i) => ({
      tlId: "add" + i, creditor: a.creditor, type: a.type, dpd: 0, balanceBureau: null, balanceConfirmed: Math.round(a.amount),
      source: "consumer", excludedReason: null, enrollable: true, selected: true, needsReview: false, confirmed: null, status: null,
    }));
    const all = [...tls, ...added];
    const total = enrolledLines(all).reduce((s, t) => s + balanceOf(t), 0);
    ctx.patch.tradelines = all;
    ctx.extra.total = total;
    if (!req.body.advance) return;
    if (!total) throw new HttpError(400, "Choose at least one debt to include", "NO_DEBTS");
    const excluded = all.filter((t) => t.excludedReason);
    if (excluded.length && !req.body.exclusionsAck) throw new HttpError(400, "Please confirm you understand which accounts can't go in the program", "EXCLUSIONS_ACK", { field: "exclusionsAck" });
    const declared = all.reduce((s, t) => s + balanceOf(t), 0);
    await artifact(ctx, "debts_confirmed", { enrolled: total, declared, corrections, added: added.length });
    await artifact(ctx, "exclusions_acknowledged", { excluded: excluded.map((t) => ({ creditor: t.creditor, reason: t.excludedReason })) });
    if (corrections) ctx.log("DB", `tradelines.corrected × ${corrections} (bureau balances retained)`);
    if (added.length) ctx.log("DB", `tradelines.added × ${added.length} (source: consumer)`);
    ctx.log("DB", `enrolling ${usd(total)} of ${usd(declared)} declared`);
    goStep(ctx, 5);
  })
);

// =====================================================================  STEP 5: affordability + bank link + underwriting
router.post(
  "/:id/budget",
  validate(z.object({
    netMonthly: z.coerce.number().min(0).max(1e6),
    housing: z.coerce.number().min(0).max(1e6),
    obligations: z.coerce.number().min(0).max(1e6),
    bankLinked: z.boolean().optional(),
    linkOnly: z.boolean().optional(),
  })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 5);
    await requireGates(ctx, 5);
    const { netMonthly, housing, obligations } = req.body;
    const disposable = Math.round(netMonthly - housing - obligations);
    if (req.body.bankLinked && !ctx.lead.bankLinked) ctx.log("VENDOR", "banklink.ok (Plaid read-only, mock) → income verified");
    Object.assign(ctx.patch, { budget: { netMonthly, housing, obligations, disposable }, bankLinked: !!req.body.bankLinked || !!ctx.lead.bankLinked, incomeVerified: !!req.body.bankLinked || !!ctx.lead.bankLinked });
    if (req.body.linkOnly) return;
    if (!netMonthly) throw new HttpError(400, "Enter your monthly take-home pay", "VALIDATION", { field: "netMonthly" });
    if (!ctx.patch.bankLinked) {
      ctx.patch.skippedBankLink = true;
      ctx.log("EVENT", "banklink.skip");
    }
    // capacity used this month per provider
    const since = new Date(); since.setDate(1);
    const enrolledThisMonth = await db.leads.list({ outcome: "enrolled" }, { omit: ["events"] });
    const capacityUsed = {};
    enrolledThisMonth.filter((l) => l.enrolledAt && new Date(l.enrolledAt) >= since).forEach((l) => (capacityUsed[l.quote?.providerId] = (capacityUsed[l.quote?.providerId] || 0) + 1));
    const lines = enrolledLines(ctx.lead.tradelines);
    const r = evaluate({ stateCode: ctx.lead.state, lines, disposableIncome: disposable, incomeVerified: ctx.patch.incomeVerified, capacityUsed });
    await db.decisions.append({
      recId: newId("dec"), leadId: ctx.lead.leadId, fileSnapshotHash: r.fileSnapshotHash, rulesetVersions: r.rulesetVersions, rules: r.rules,
      providerId: r.providerId, fallbackChain: r.fallbackChain, outcome: r.outcome, explore: !!r.explore, at: new Date().toISOString(),
    });
    r.rules.forEach((x) => ctx.log("ROUTING", `${x.stage} ${x.ruleId}: ${x.passed ? "pass" : "FAIL"}${x.detail ? " · " + x.detail : ""}`));
    ctx.log("DB", "decision_log appended (immutable)");
    if (r.outcome === "declined") {
      ctx.extra.declineReason = r.declineReason;
      return exitFile(ctx, "declined", r.reasonCode);
    }
    const q = r.quote;
    // Debts the bound provider won't take are excluded with the fixed reason.
    ctx.patch.tradelines = ctx.lead.tradelines.map((t) => (t.selected && t.enrollable && !q.includedTlIds.includes(t.tlId) ? { ...t, excludedReason: "excluded_creditor", selected: false } : t));
    Object.assign(ctx.patch, {
      quote: q, backend: q.providerId, status: "MATCHED",
      // legacy fields the dashboard/statistics read
      program: { backendId: q.providerId, backendName: q.providerName, enrolledDebt: q.enrolledDebt, monthlyDeposit: q.monthlyDeposit, termMonths: q.termMonths[0], estTotalCost: q.estTotalCost[1], estSavings: q.estSavings[0], clientFeePct: q.feePct, debtifyFee: q.debtifyFee, includedTlIds: q.includedTlIds },
    });
    await artifact(ctx, "decision_bound", { providerId: q.providerId, snapshotHash: q.snapshotHash });
    ctx.log("ROUTING", `bound ${q.providerName}: ${usd(q.monthlyDeposit)}/mo × ${q.termMonths[0]}–${q.termMonths[1]} · fee ${Math.round(q.feePct * 100)}%${q.feePct < q.rawFeePct ? " (state cap applied)" : ""}`);
    goStep(ctx, 6);
  })
);

// =====================================================================  STEP 6: plan + fee + account disclosures
const ackSchema = z.object({ hash: z.string().length(64), dwellMs: z.number().int().min(0).max(36e5).optional() });
async function recordAck(ctx, key, ack) {
  const lang = ctx.lead.lang || "en";
  const expected = disclosureHash(key, lang);
  if (!ack || ack.hash !== expected) throw new HttpError(409, "The wording on this page was updated. Please review it again.", "DISCLOSURE_STALE", { field: key });
  const { DISCLOSURES } = await import("../../../shared/config/disclosures.js");
  const d = DISCLOSURES[key];
  await artifact(ctx, d.gate, { disclosureKey: key, version: d.version, hash: expected, lang, dwellMs: ack.dwellMs ?? null, tsr: d.tsr || null });
}

router.post(
  "/:id/acknowledge",
  validate(z.object({ quote: z.literal(true, { errorMap: () => ({ message: "Please confirm you've reviewed your plan" }) }), advance_fee: ackSchema, dedicated_account: ackSchema })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 6);
    await requireGates(ctx, 6);
    if (!ctx.lead.quote) throw new HttpError(409, "No plan yet", "NO_PROGRAM");
    await artifact(ctx, "quote_acknowledged", { snapshotHash: ctx.lead.quote.snapshotHash });
    await recordAck(ctx, "advance_fee", req.body.advance_fee);
    await recordAck(ctx, "dedicated_account", req.body.dedicated_account);
    ctx.patch.costsAcknowledged = true;
    ctx.log("CONSENT", "plan, advance-fee and dedicated-account disclosures acknowledged (hashes verified)");
    goStep(ctx, 7);
  })
);

// =====================================================================  STEP 7: comprehension (divert, never loop)
router.post(
  "/:id/comprehension",
  validate(z.object({ answers: z.record(z.number().int()) })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 7);
    await requireGates(ctx, 7);
    if (ctx.lead.comprehensionPassed) return (ctx.extra.correct = true);
    const wrong = Object.entries(QUIZ_ANSWERS).filter(([id, c]) => req.body.answers[id] !== c).map(([id]) => id);
    const attempts = (ctx.lead.comprehensionAttempts || 0) + 1;
    ctx.patch.comprehensionAttempts = attempts;
    ctx.patch.quizAttempts = attempts;
    ctx.extra.wrong = wrong;
    ctx.extra.attempts = attempts;
    if (!wrong.length) {
      ctx.patch.comprehensionPassed = true;
      ctx.extra.correct = true;
      await artifact(ctx, "comprehension_credit", { attempts, firstAttempt: attempts === 1 });
      return ctx.log("EVENT", `comprehension passed on attempt ${attempts}`);
    }
    ctx.log("AI", `comprehension attempt ${attempts}: ${wrong.length} wrong — retry allowed`);
  })
);

// =====================================================================  STEP 7: creditor + tax disclosures, alternatives
router.post(
  "/:id/risks",
  validate(z.object({ creditor_contact: ackSchema, tax: ackSchema, choice: z.enum(["settlement", ...Object.keys(ALTERNATIVES.en)]) })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 7);
    await requireGates(ctx, 7);
    if (!ctx.lead.comprehensionPassed) throw new HttpError(403, "Answer the quick check first", "GATE_UNMET", { gates: ["comprehension_credit"] });
    await recordAck(ctx, "creditor_contact", req.body.creditor_contact);
    await recordAck(ctx, "tax", req.body.tax);
    if (req.body.choice !== "settlement") {
      ctx.patch.referral = { destination: req.body.choice, at: new Date().toISOString() };
      ctx.log("EVENT", `alternatives.referred_out → ${req.body.choice}`);
      return exitFile(ctx, "referred_out", "REFERRED_OUT");
    }
    await artifact(ctx, "alternatives_reviewed", { choice: "settlement" });
    goStep(ctx, 8);
  })
);

// =====================================================================  STEP 8: sign + dedicated account
router.post(
  "/:id/deposits",
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 8);
    ctx.patch.depositAccountLinked = true;
    ctx.log("VENDOR", "account administrator (mock) → funding account verified");
  })
);

router.post(
  "/:id/enroll",
  validate(z.object({
    accept: z.boolean(),
    signatureName: z.string().trim().max(120).optional(),
    draftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    achAuthorized: z.boolean().optional(),
  })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 8);
    await requireGates(ctx, 8);
    const l = ctx.lead, b = req.body;
    if (!b.accept) {
      ctx.log("EVENT", "sign.declined");
      return exitFile(ctx, "abandoned", "ESIGN_DECLINED");
    }
    const legal = `${l.first || ""} ${l.last || ""}`.trim().toLowerCase();
    if (!b.signatureName || b.signatureName.toLowerCase().replace(/\s+/g, " ") !== legal) throw new HttpError(400, `Type your full name exactly: ${l.first} ${l.last}`, "VALIDATION", { field: "signatureName" });
    if (!l.depositAccountLinked) throw new HttpError(400, "Link the bank account your deposits come from", "BANK_REQUIRED");
    const d = new Date(b.draftDate + "T12:00:00Z").getTime();
    if (!d || d < Date.now() + 3 * 864e5 - 432e5 || d > Date.now() + 45 * 864e5) throw new HttpError(400, "Choose a first deposit date between 3 and 45 days from today", "BAD_DATE", { field: "draftDate" });
    if (!b.achAuthorized) throw new HttpError(400, "Please authorise the monthly deposits", "VALIDATION", { field: "achAuthorized" });
    const lang = l.lang || "en";
    const docs = DOCUMENT_PACK[lang];
    const at = new Date().toISOString();
    const auditHash = sha256(JSON.stringify({ lead: l.leadId, docs, signer: b.signatureName, quote: l.quote.snapshotHash, at, ip: ctx.meta.ip }));
    await artifact(ctx, "executed_pack_id", { packId: newId("pack"), counterparty: l.quote.providerLegalName, documents: docs, signer: b.signatureName, ip: ctx.meta.ip, userAgent: ctx.meta.ua, at, auditHash, demo: true });
    await artifact(ctx, "ach_authorization_id", { authId: newId("ach"), administrator: l.quote.administrator, draftDate: b.draftDate, amount: l.quote.monthlyDeposit, at });
    Object.assign(ctx.patch, { draftDate: b.draftDate, status: "SIGNED", signedAt: at, signature: { name: b.signatureName, auditHash, at } });
    ctx.log("VENDOR", `sign.completed · ${docs.length} documents · counterparty ${l.quote.providerLegalName}`);
    ctx.log("VENDOR", `ach.authorised with ${l.quote.administrator} · first draft ${b.draftDate}`);
    goStep(ctx, 9);
  })
);

// =====================================================================  STEP 9: book + verification call
export async function finishEnrollment(lead, log, patch) {
  const deposits = buildDeposits({ termMonths: lead.quote.termMonths[0], monthlyDeposit: lead.quote.monthlyDeposit }, lead.draftDate);
  Object.assign(patch, {
    status: "ENROLLED", outcome: "enrolled", enrolledAt: new Date().toISOString(), step: DONE_STEP, maxStep: DONE_STEP, deposits,
    tradelines: lead.tradelines.map((t) => (t.selected && t.enrollable && !t.excludedReason ? { ...t, status: "ENROLLED" } : t)),
  });
  log("BACKEND", `enrollment handed off to ${lead.quote.providerName} (${PROVIDERS.find((p) => p.id === lead.quote.providerId)?.handoff || "forth_api"}, HMAC-signed)`);
  const date = new Date(lead.draftDate + "T12:00:00Z").toLocaleDateString(lead.lang === "es" ? "es-US" : "en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  if (lead.email && lead.source !== "demo") await sendMail(lead.email, "enrolled", { first: lead.first, deposit: usd(lead.quote.monthlyDeposit), date, company: lead.quote.providerName, lang: lead.lang });
  const contactOk = (lead.consents || []).find((c) => c.key === "contact_partners")?.granted;
  if (contactOk && lead.phone) await sendSms(lead.phone, lead.lang === "es" ? `Debtify: tu primer depósito de ${usd(lead.quote.monthlyDeposit)} es el ${date}. Responde STOP para dejar de recibir mensajes.` : `Debtify: your first deposit of ${usd(lead.quote.monthlyDeposit)} is on ${date}. Reply STOP to opt out.`, { kind: "reminder" });
}

router.post(
  "/:id/call",
  validate(z.object({ slot: z.enum(["now", "today_pm", "tomorrow_am"]).default("now") })),
  withLead(async (req, ctx) => {
    atStep(ctx.lead, 9);
    await requireGates(ctx, 9);
    const l = ctx.lead;
    if (l.callResult === "FAILED") throw new HttpError(409, "A member of our team will call you to finish up", "NEEDS_HUMAN");
    if (req.body.slot !== "now") {
      Object.assign(ctx.patch, { callBooking: { slot: req.body.slot, at: new Date().toISOString() }, callResult: "BOOKED" });
      ctx.log("EVENT", `call.booked → ${req.body.slot} (assist queue, file context attached)`);
      return;
    }
    ctx.log("VENDOR", `call.started (${l.lang === "es" ? "Spanish" : "English"}, VERIFICATION_SCRIPT_V4, recorded) → ***${String(l.phone).slice(-4)}`);
    const call = verificationCall({ first: l.first, phone: l.phone, quote: l.quote, lang: l.lang });
    ctx.extra.call = call;
    ctx.patch.callResult = call.result;
    ctx.patch.callPoints = call.points;
    if (call.result === "FAILED") {
      Object.assign(ctx.patch, { dropReason: "CALL_NEEDS_HUMAN", resolved: false });
      ctx.log("GUARD", "call.failed → review queue (never auto-cancel)");
      return;
    }
    await artifact(ctx, "verification_call_passed", { script: "VERIFICATION_SCRIPT_V4", points: call.points });
    ctx.log("VENDOR", "call.passed");
    await finishEnrollment(l, ctx.log, ctx.patch);
    ctx.log("EVENT", `step_view 10 ${STEP_NAMES[10]}`);
  })
);

router.post(
  "/:id/person",
  withLead(async (req, ctx) => {
    Object.assign(ctx.patch, { person: true, resolved: false });
    ctx.log("EVENT", "talk_to_person → exception desk");
  })
);

router.post(
  "/:id/abandon",
  withLead(async (req, ctx) => {
    const l = ctx.lead;
    if (l.outcome === "in_progress" && l.step > 0 && l.step < DONE_STEP && l.status !== "SIGNED") {
      Object.assign(ctx.patch, { outcome: "abandoned", exitStep: l.step, dropReason: "LEFT_AT_STEP_" + pad(l.step) });
      ctx.log("EVENT", `exit at step ${l.step} → abandoned`);
    }
  })
);

export default router;
