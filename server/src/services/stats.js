import { BACKENDS, STEP_NAMES } from "../data/backends.js";

const POINTS = [["fee", "What it costs"], ["timing", "How long it takes"], ["estimate", "Savings are an estimate"], ["account", "Your money, your account"], ["credit", "Credit score will drop"], ["collections", "Collections and lawsuits"], ["tax", "Forgiven debt may be taxed"], ["cancel", "Cancel any time"]];
const REASON_LABEL = { STATE_NOT_SERVED: "State not served", DEBT_UNDER_MIN: "Debt under minimum", NOT_AFFORDABLE: "Deposit not affordable", NO_BACKEND_FIT: "No backend fit", KYC_FAILED: "Failed ID check", NO_CREDIT_FILE: "No credit file", CALL_NEEDS_HUMAN: "Call needs a person", ESIGN_DECLINED: "Declined to sign" };
export const reasonLabel = (c) => (c?.startsWith("LEFT_AT_STEP") ? "Left at: " + STEP_NAMES[Number(c.slice(-2))] : REASON_LABEL[c] || c);
const resaleOk = (c, share) => share && c && !["KYC_FAILED", "NO_CREDIT_FILE", "CALL_NEEDS_HUMAN"].includes(c);
const ENROLLED = ["ENROLLED", "PAYMENT1_CLEARED", "PAYMENT2_CLEARED", "CLAWBACK"];

// Aggregates the admin dashboard numbers from a list of leads.
export function computeStats(L, demoRows) {
  const earned = L.filter((s) => s.feeStatus === "EARNED" || s.feeStatus === "FINAL");
  const clawed = L.filter((s) => s.feeStatus === "CLAWED_BACK");
  const enrolled = L.filter((s) => s.maxStep >= 10 || ENROLLED.includes(s.status));
  const esN = L.filter((s) => s.lang === "es").length;

  const reasons = {};
  L.forEach((s) => s.dropReason && (reasons[s.dropReason] = (reasons[s.dropReason] || 0) + 1));

  const byB = {};
  enrolled.forEach((s) => {
    const b = (byB[s.backend] ??= { e: 0, p1: 0, cb: 0 });
    b.e++;
    if (s.feeStatus !== "NOT_EARNED") b.p1++;
    if (s.feeStatus === "CLAWED_BACK") b.cb++;
  });

  const clarity = POINTS.map(([id, name]) => {
    let c = 0, sm = 0;
    L.forEach((s) => {
      const v = s.clarity?.[id];
      if (v === "clear") c++;
      else if (v === "simpler") sm++;
    });
    return { id, name, clear: c, simpler: sm, n: c + sm };
  });

  return {
    kpis: {
      leads: L.length,
      enrolled: enrolled.length,
      conversion: L.length ? +((enrolled.length / L.length) * 100).toFixed(1) : 0,
      feesEarned: earned.reduce((s, z) => s + (z.program?.debtifyFee || 0), 0),
      clawbackRate: earned.length + clawed.length ? Math.round((clawed.length / (earned.length + clawed.length)) * 100) : 0,
      spanishShare: L.length ? Math.round((esN / L.length) * 100) : 0,
    },
    clarity,
    funnel: STEP_NAMES.slice(1).map((name, i) => ({ step: i + 1, name, count: L.filter((s) => s.maxStep >= i + 1).length })),
    dropReasons: Object.entries(reasons).sort((a, z) => z[1] - a[1]).map(([code, count]) => ({ code, label: reasonLabel(code), count })),
    resaleEligible: L.filter((s) => resaleOk(s.dropReason, s.share)).length,
    byBackend: Object.entries(byB).sort().map(([id, v]) => ({ id, name: BACKENDS.find((z) => z.id === id)?.name || id, enrolled: v.e, p1: v.p1, clawbacks: v.cb })),
    exceptions: L.filter((s) => (s.dropReason === "CALL_NEEDS_HUMAN" || s.person) && !s.resolved).map((s) => ({ leadId: s.leadId, first: s.first, state: s.state, lang: s.lang, status: s.status, why: s.dropReason === "CALL_NEEDS_HUMAN" ? "Call needs a person" : "Asked for a person" })),
    recent: demoRows.slice(0, 20).map((s) => ({
      leadId: s.leadId, source: s.source, first: s.first, lang: s.lang, state: s.state, maxStep: s.maxStep, stepName: STEP_NAMES[s.maxStep], status: s.status,
      label: s.dropReason ? reasonLabel(s.dropReason) : s.status, feeStatus: s.feeStatus, createdAt: s.createdAt,
    })),
    demoCount: demoRows.length,
  };
}
