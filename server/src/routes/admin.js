import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { CLOSED_STATES, PROVIDERS, STATE_FEE_CAPS, US_STATES, effectiveFeePct } from "../../../shared/config/providers.js";
import { DISCLOSURES } from "../../../shared/config/disclosures.js";
import { STEP_NAMES, phaseOfStep } from "../../../shared/config/flow.js";
import { disclosureText, consentText } from "../../../shared/config/es.js";
import { ah, HttpError, validate } from "../lib/http.js";
import { decrypt, newId } from "../lib/crypto.js";
import { publicUser, requireRole } from "../middleware/auth.js";
import { buildSamples } from "../services/samples.js";
import { CONSENTS, GATES_BEFORE, consentHash, disclosureHash } from "../compliance/registry.js";
import { dashboard, dropoffInventory, furthestOf, outcomeOf, reasonLabel, tierOf } from "../compliance/metrics.js";
import { EXPLORATION_SLICE, RULESET_VERSIONS } from "../compliance/engine.js";
import { isRevocation, suppress } from "../compliance/suppression.js";
import { QUIZ_ANSWERS } from "../data/quiz.js";
import { finishEnrollment, publicLead } from "./leads.js";
import { currentPanel, savePanel } from "../services/panel.js";

const router = Router();
router.use(requireRole("staff", "admin"));
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");

// Immutable record of who looked at what. This panel renders consumer PII.
const logAccess = (req, action, leadId = null, detail = null) =>
  db.accessLog.append({ recId: newId("acc"), userId: req.user.userId, email: req.user.email, role: req.user.role, action, leadId, detail, ip: req.ip, at: new Date().toISOString() });

const realLeads = () => db.leads.list({ source: { $in: ["demo", "web"] } }, { omit: ["events"] });

// ---------- dashboard ----------
router.get(
  "/stats",
  ah(async (req, res) => {
    const real = await realLeads();
    const samples = req.query.samples !== "0" ? await db.leads.list({ source: "sample" }, { omit: ["events"] }) : [];
    const all = [...samples, ...real];
    const d = dashboard(all, real, await db.consents.count({}));
    res.json({
      ...d, store: db.kind, sampleCount: samples.length, demoCount: real.length,
      recent: real.slice(0, 20).map((s) => ({ leadId: s.leadId, source: s.source, first: s.first, lang: s.lang, state: s.state, maxStep: s.maxStep, stepName: STEP_NAMES[furthestOf(s)], outcome: outcomeOf(s), status: s.status, label: s.dropReason ? reasonLabel(s.dropReason) : outcomeOf(s), feeStatus: s.feeStatus, createdAt: s.createdAt })),
      rulesetVersions: RULESET_VERSIONS, explorationSlice: EXPLORATION_SLICE,
    });
  })
);

// ---------- applications ----------
router.get(
  "/leads",
  ah(async (req, res) => {
    const q = String(req.query.q || "").trim().slice(0, 60);
    const outcome = String(req.query.outcome || "");
    const step = Number(req.query.step) || 0;
    const tier = String(req.query.tier || "");
    let rows = await realLeads();
    if (outcome) rows = rows.filter((l) => outcomeOf(l) === outcome);
    if (step) rows = rows.filter((l) => furthestOf(l) === step);
    if (tier) rows = rows.filter((l) => tierOf(l) === tier);
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      // Searchable across everything staff actually look a file up by. Digits-only
      // input also matches the phone with its formatting stripped.
      const digits = q.replace(/\D/g, "");
      rows = rows.filter((l) => {
        const hay = `${l.leadId} ${l.first || ""} ${l.last || ""} ${l.email || ""} ${l.phone || ""} ${l.state || ""} ${l.status} ${l.quote?.providerName || ""} ${l.dropReason || ""}`;
        return re.test(hay) || (digits.length >= 3 && String(l.phone || "").replace(/\D/g, "").includes(digits));
      });
    }
    res.json({
      leads: rows.slice(0, 300).map((l) => ({
        leadId: l.leadId, source: l.source, first: l.first, last: l.last, email: l.email || null, phone: l.phone || null, state: l.state, lang: l.lang, status: l.status, outcome: outcomeOf(l),
        step: l.step, furthest: furthestOf(l), stepName: STEP_NAMES[furthestOf(l)], phase: phaseOfStep(furthestOf(l)), tier: tierOf(l),
        reason: l.dropReason ? reasonLabel(l.dropReason) : null, feeStatus: l.feeStatus, enrolledDebt: l.quote?.enrolledDebt || null,
        deposit: l.quote?.monthlyDeposit || null, provider: l.quote?.providerName || null, flagged: !!(l.person || l.manualReview || l.callResult === "FAILED" || l.callResult === "BOOKED") && !l.resolved, createdAt: l.createdAt,
      })),
    });
  })
);

// Per-file audit trail: summary, step timeline with gates, consent records, artifacts, decision log, tradelines.
router.get(
  "/leads/:id",
  ah(async (req, res) => {
    const l = await db.leads.get(req.params.id);
    if (!l || l.source === "sample") throw new HttpError(404, "Not found");
    await logAccess(req, "view_file", l.leadId);
    const [consents, artifacts, decisions] = await Promise.all([
      db.consents.list({ leadId: l.leadId }, { limit: 100 }), db.artifacts.list({ leadId: l.leadId }, { limit: 200 }), db.decisions.list({ leadId: l.leadId }, { limit: 20 }),
    ]);
    const gates = new Set(artifacts.map((a) => a.gate));
    const timeline = STEP_NAMES.slice(1).map((name, i) => {
      const step = i + 1;
      const need = (GATES_BEFORE[step + 1] || []).filter((g) => !(GATES_BEFORE[step] || []).includes(g));
      const f = furthestOf(l);
      return { step, name, phase: phaseOfStep(step), status: f > step || (step === 10 && outcomeOf(l) === "enrolled") ? "passed" : f === step ? (outcomeOf(l) === "in_progress" ? "current" : "exited") : "not reached", gates: need.map((g) => ({ gate: g, satisfied: gates.has(g) })) };
    });
    const owner = l.userId ? publicUser(await db.users.get(l.userId)) : null;
    const addr = decrypt(l.addressEnc);
    res.json({
      lead: publicLead(l), owner, events: l.events || [], consents, artifacts, decisions, timeline, staffNotes: l.staffNotes || [],
      pii: { dob: decrypt(l.dobEnc), address: addr ? JSON.parse(addr) : null, ssnLast4: l.ssnLast4, phone: l.phone },
      summary: { outcome: outcomeOf(l), furthest: furthestOf(l), furthestName: STEP_NAMES[furthestOf(l)], tier: tierOf(l), reason: l.dropReason ? reasonLabel(l.dropReason) : null },
    });
  })
);

router.post(
  "/leads/:id/backend-event",
  validate(z.object({ type: z.enum(["PAYMENT1_CLEARED", "PAYMENT2_CLEARED", "PAYMENT2_FAILED", "DEBT_SETTLED"]) })),
  ah(async (req, res) => {
    const l = await db.leads.get(req.params.id);
    if (!l || !l.quote || !l.deposits?.length) throw new HttpError(404, "No enrolled program");
    const type = req.body.type;
    const deposits = [...l.deposits];
    const setDep = (n, status) => { const d = deposits.find((x) => x.n === n); if (d) d.status = status; };
    const patch = { deposits };
    let text;
    if (type === "PAYMENT1_CLEARED" && l.feeStatus === "NOT_EARNED") {
      setDep(1, "CLEARED");
      Object.assign(patch, { feeStatus: "EARNED", status: "PAYMENT1_CLEARED" });
      text = `PAYMENT1_CLEARED → Debtify fee ${usd(l.quote.debtifyFee)} invoiced (EARNED)`;
    } else if (type === "PAYMENT2_CLEARED" && l.feeStatus === "EARNED") {
      setDep(2, "CLEARED");
      Object.assign(patch, { feeStatus: "FINAL", status: "PAYMENT2_CLEARED" });
      text = "PAYMENT2_CLEARED → fee released (FINAL)";
    } else if (type === "PAYMENT2_FAILED" && l.feeStatus === "EARNED") {
      setDep(2, "FAILED");
      Object.assign(patch, { feeStatus: "CLAWED_BACK", status: "CLAWBACK" });
      text = "PAYMENT2_FAILED → fee CLAWED BACK";
    } else if (type === "DEBT_SETTLED") {
      const t = (l.tradelines || []).find((x) => x.status === "ENROLLED");
      if (!t) throw new HttpError(409, "All enrolled debts are already settled");
      patch.tradelines = l.tradelines.map((x) => (x.tlId === t.tlId ? { ...x, status: "SETTLED" } : x));
      text = `DEBT_SETTLED → ${t.creditor}`;
    } else throw new HttpError(409, `Event ${type} isn't valid when the fee is ${l.feeStatus}`);
    const ev = { tag: "BACKEND", text, at: new Date().toISOString() };
    const saved = await db.leads.update(l.leadId, patch);
    await db.leads.pushEvents(l.leadId, [ev]);
    await logAccess(req, "backend_event", l.leadId, type);
    res.json({ lead: publicLead(saved), events: [ev] });
  })
);

// Verification call outcome for a booked or failed call, scored by QA. A fail never auto-cancels.
router.post(
  "/leads/:id/call-result",
  validate(z.object({ passed: z.boolean(), note: z.string().max(500).optional() })),
  ah(async (req, res) => {
    const l = await db.leads.get(req.params.id);
    if (!l || l.step !== 9 || l.status !== "SIGNED") throw new HttpError(409, "This file isn't waiting for a verification call");
    const events = [];
    const log = (tag, text) => events.push({ tag, text, at: new Date().toISOString() });
    const patch = { callResult: req.body.passed ? "PASSED" : "FAILED", resolved: req.body.passed, callNote: req.body.note || null };
    if (req.body.passed) {
      await db.artifacts.append({ recId: newId("art"), leadId: l.leadId, gate: "verification_call_passed", detail: { by: req.user.email, note: req.body.note || null, script: "VERIFICATION_SCRIPT_V4" }, at: new Date().toISOString() });
      log("VENDOR", `call.passed (scored by ${req.user.email})`);
      await finishEnrollment(l, log, patch);
    } else log("GUARD", `call.failed (scored by ${req.user.email}) → stays in review`);
    const saved = await db.leads.update(l.leadId, patch);
    await db.leads.pushEvents(l.leadId, events);
    await logAccess(req, "call_result", l.leadId, req.body.passed ? "passed" : "failed");
    res.json({ lead: publicLead(saved), events });
  })
);

router.post(
  "/leads/:id/resolve",
  ah(async (req, res) => {
    const l = await db.leads.get(req.params.id);
    if (!l) throw new HttpError(404, "Not found");
    await db.leads.update(l.leadId, { resolved: true });
    await db.leads.pushEvents(l.leadId, [{ tag: "EVENT", text: `exception resolved by ${req.user.email}`, at: new Date().toISOString() }]);
    await logAccess(req, "resolve_exception", l.leadId);
    res.json({ ok: true });
  })
);

// ---------- consent records (append-only) ----------
router.get(
  "/consents",
  ah(async (req, res) => {
    const q = {};
    if (req.query.key) q.key = String(req.query.key);
    if (req.query.granted === "true" || req.query.granted === "false") q.granted = req.query.granted === "true";
    if (req.query.leadId) q.leadId = String(req.query.leadId);
    const rows = await db.consents.list(q, { limit: 500 });
    await logAccess(req, "view_consents");
    res.json({ records: rows, total: await db.consents.count({}) });
  })
);

// ---------- disclosure registry ----------
router.get(
  "/disclosures",
  ah(async (req, res) => {
    const out = [];
    for (const key of Object.keys(DISCLOSURES)) {
      const d = DISCLOSURES[key];
      out.push({
        key, version: d.version, gate: d.gate, tsr: d.tsr || null, acknowledged: await db.artifacts.count({ gate: d.gate }),
        en: { ...disclosureText(key, "en"), hash: disclosureHash(key, "en") }, es: { ...disclosureText(key, "es"), hash: disclosureHash(key, "es") },
      });
    }
    const consents = CONSENTS.map((c) => ({ key: c.key, required: c.required, en: { ...consentText(c.key, "en"), hash: consentHash(c.key, "en") }, es: { ...consentText(c.key, "es"), hash: consentHash(c.key, "es") } }));
    res.json({ disclosures: out, consents, quizAnswers: QUIZ_ANSWERS });
  })
);

// ---------- TCPA suppression ----------
router.get(
  "/suppressions",
  ah(async (req, res) => {
    const rows = await db.suppressions.list({}, { limit: 1000 });
    res.json({ suppressions: rows, total: rows.length });
  })
);
router.post(
  "/suppressions",
  validate(z.object({ phone: z.string().min(7).max(30), note: z.string().max(300).optional() })),
  ah(async (req, res) => {
    const r = await suppress(req.body.phone, "manual_admin", req.body.note || null, req.user.email);
    await logAccess(req, "suppression_add", null, r.e164 || req.body.phone);
    res.status(r.ok ? 201 : 200).json(r);
  })
);
router.post(
  "/suppressions/test-message",
  validate(z.object({ body: z.string().max(500) })),
  (req, res) => res.json({ revocation: isRevocation(req.body.body) })
);

// ---------- provider panel ----------
router.get(
  "/providers",
  ah(async (req, res) => {
    const since = new Date(); since.setDate(1); since.setHours(0, 0, 0, 0);
    const enrolled = (await realLeads()).filter((l) => l.enrolledAt && new Date(l.enrolledAt) >= since);
    const providers = PROVIDERS.map((p) => ({
      ...p,
      capacityUsed: enrolled.filter((l) => l.quote?.providerId === p.id).length,
      states: p.licensedStates.map((st) => {
        const cap = STATE_FEE_CAPS[st] ?? null;
        const eff = effectiveFeePct(p, st);
        return { state: st, rawRate: p.underwriting.feePctOfEnrolledDebt, cap, effective: eff, onMin: Math.round(p.underwriting.minEnrolledDebt * eff), flag: cap == null ? "no_cap" : p.underwriting.feePctOfEnrolledDebt > cap ? "over_cap" : null, closedConflict: CLOSED_STATES.includes(st) };
      }),
    }));
    const caps = Object.entries(STATE_FEE_CAPS).map(([st, cap]) => {
      const lic = PROVIDERS.filter((p) => p.licensedStates.includes(st));
      return { state: st, cap, providers: lic.map((p) => p.displayName), overCap: lic.filter((p) => p.underwriting.feePctOfEnrolledDebt > cap).map((p) => p.displayName) };
    });
    res.json({
      providers, caps, closedStates: CLOSED_STATES.map((c) => ({ code: c, name: US_STATES.find((s) => s.code === c)?.name })),
      flags: providers.reduce((n, p) => n + p.states.filter((s) => s.flag === "over_cap").length, 0),
      noCap: providers.reduce((n, p) => n + p.states.filter((s) => s.flag === "no_cap").length, 0),
      conflicts: providers.flatMap((p) => p.states.filter((s) => s.closedConflict).map((s) => `${p.displayName} licensed in closed state ${s.state}`)),
    });
  })
);

// ---------- drop-offs ----------
router.get(
  "/dropoffs",
  ah(async (req, res) => {
    const real = await realLeads();
    const samples = req.query.samples === "1" ? await db.leads.list({ source: "sample" }, { omit: ["events"] }) : [];
    res.json(dropoffInventory([...samples, ...real]));
  })
);

// ---------- served states / provider panel (admin only) ----------
// The compliance stores stay append-only; operational configuration like which states
// we serve is deliberately editable, and every change is written to the access log.
router.get("/panel", requireRole("admin"), ah(async (req, res) => res.json(currentPanel())));

router.patch(
  "/panel",
  requireRole("admin"),
  validate(
    z.object({
      closedStates: z.array(z.string()).nullable().optional(),
      feeCaps: z.record(z.string(), z.number().min(0).max(1).nullable()).optional(),
      licensedStates: z.record(z.string(), z.array(z.string()).nullable()).optional(),
      reset: z.boolean().optional(),
    })
  ),
  ah(async (req, res) => {
    const panel = await savePanel(req.body, req.user.email);
    await logAccess(req, "panel_update", null, JSON.stringify(req.body).slice(0, 300));
    res.json(panel);
  })
);

// ---------- correct a file's contact details / add a staff note ----------
// Consents, gate artifacts and decisions are append-only and are NOT editable here:
// they are the evidence trail. Only the contact details a consumer can change
// themselves, plus an internal note, can be corrected by staff.
router.patch(
  "/leads/:id",
  validate(
    z.object({
      first: z.string().trim().max(60).optional(),
      last: z.string().trim().max(60).optional(),
      email: z.string().trim().toLowerCase().email().max(160).optional(),
      phone: z.string().trim().max(20).optional(),
      note: z.string().trim().max(1000).optional(),
    })
  ),
  ah(async (req, res) => {
    const l = await db.leads.get(req.params.id);
    if (!l || l.source === "sample") throw new HttpError(404, "Not found");
    const patch = {};
    for (const f of ["first", "last", "email"]) if (req.body[f] !== undefined) patch[f] = req.body[f];
    if (req.body.phone !== undefined) {
      const digits = req.body.phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
      if (digits && digits.length !== 10) throw new HttpError(400, "Enter a 10-digit US mobile number", "BAD_PHONE");
      patch.phone = digits;
      if (digits !== l.phone) patch.phoneVerified = false;
    }
    if (req.body.note !== undefined) {
      patch.staffNotes = [...(l.staffNotes || []), { at: new Date().toISOString(), by: req.user.email, text: req.body.note }].slice(-50);
    }
    if (!Object.keys(patch).length) throw new HttpError(400, "Nothing to update", "NO_CHANGES");
    const changed = Object.keys(patch).filter((k) => k !== "staffNotes");
    const updated = await db.leads.update(l.leadId, patch);
    await logAccess(req, "edit_file", l.leadId, changed.length ? `changed ${changed.join(", ")}` : "added note");
    res.json({ lead: publicLead(updated) });
  })
);

// ---------- access log + users (admin only) ----------
router.get("/access-log", requireRole("admin"), ah(async (req, res) => res.json({ entries: await db.accessLog.list({}, { limit: 500 }) })));

router.get("/users", requireRole("admin"), ah(async (req, res) => res.json({ users: (await db.users.list({}, { limit: 500 })).map(publicUser) })));

router.patch(
  "/users/:id",
  requireRole("admin"),
  validate(z.object({ role: z.enum(["user", "staff", "admin"]) })),
  ah(async (req, res) => {
    if (req.params.id === req.user.userId) throw new HttpError(400, "You can't change your own role");
    const before = await db.users.get(req.params.id);
    if (!before) throw new HttpError(404, "Not found");
    const u = await db.users.update(req.params.id, { role: req.body.role, tokenVersion: (before.tokenVersion || 0) + 1 });
    await logAccess(req, "role_change", null, `${u.email}: ${before.role} → ${req.body.role}`);
    res.json({ user: publicUser(u) });
  })
);

router.post(
  "/seed",
  requireRole("admin"),
  ah(async (req, res) => {
    if ((await db.leads.count({ source: "sample" })) === 0) await db.leads.insertMany(buildSamples());
    res.json({ ok: true, samples: await db.leads.count({ source: "sample" }) });
  })
);

// Remove the seeded demo data from a real database. Only ever touches source: "sample"
// records, so real and demo consumer files can't be deleted through this route.
router.delete(
  "/seed",
  requireRole("admin"),
  ah(async (req, res) => {
    const before = await db.leads.count({ source: "sample" });
    await db.leads.removeMany({ source: "sample" });
    await logAccess(req, "purge_samples", null, `removed ${before} sample files`);
    res.json({ ok: true, removed: before, samples: await db.leads.count({ source: "sample" }) });
  })
);

export default router;
