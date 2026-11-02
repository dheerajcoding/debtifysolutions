import { PROVIDERS, CLOSED_STATES, US_STATES } from "../../../shared/config/providers.js";
import { debtifyFee } from "../compliance/engine.js";

// 180 deterministic example applications so the admin dashboard has something to show.
// Tagged source "sample" — never shown to customers, excluded from real-data views.
export function buildSamples() {
  let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const open = US_STATES.map((x) => x.code).filter((c) => !CLOSED_STATES.includes(c));
  const exits = [
    ["abandoned", 2, "LEFT_AT_STEP_02"], ["abandoned", 3, "LEFT_AT_STEP_03"], ["abandoned", 4, "LEFT_AT_STEP_04"], ["abandoned", 5, "LEFT_AT_STEP_05"],
    ["abandoned", 6, "LEFT_AT_STEP_06"], ["abandoned", 8, "LEFT_AT_STEP_08"], ["declined", 1, "STATE_NOT_SERVED"], ["declined", 1, "DEBT_UNDER_MIN"],
    ["declined", 5, "NOT_AFFORDABLE"], ["declined", 3, "KYC_FAILED"], ["declined", 5, "NO_BACKEND_FIT"], ["diverted", 7, "COMPREHENSION_DIVERTED"],
    ["referred_out", 7, "REFERRED_OUT"], ["in_progress", 4, null], ["in_progress", 6, null],
  ];
  const pts = ["fee", "timing", "estimate", "account", "credit", "collections", "tax", "cancel"];
  const out = [];
  const base = Date.now();
  for (let i = 0; i < 180; i++) {
    const r = rnd();
    const p = PROVIDERS[Math.floor(rnd() * PROVIDERS.length)];
    const debt = 11000 + Math.round((rnd() * 32000) / 500) * 500;
    const lang = rnd() < 0.3 ? "es" : "en";
    let outcome, maxStep, drop, fee = "NOT_EARNED";
    if (r < 0.12) {
      outcome = "enrolled"; maxStep = 10; drop = null;
      const f = rnd();
      fee = f < 0.25 ? "NOT_EARNED" : f < 0.55 ? "EARNED" : f < 0.88 ? "FINAL" : "CLAWED_BACK";
    } else {
      const e = exits[Math.floor(rnd() * exits.length)];
      [outcome, maxStep, drop] = e;
    }
    const state = drop === "STATE_NOT_SERVED" ? CLOSED_STATES[i % CLOSED_STATES.length] : open[i % open.length];
    const consents = maxStep >= 4 || (maxStep === 3 && drop !== "LEFT_AT_STEP_03")
      ? [{ key: "fcra", granted: true }, { key: "esign", granted: true }, { key: "contact_partners", granted: rnd() < 0.64 }] : [];
    const clarity = {};
    pts.forEach((pt, k) => { if (maxStep >= (k < 4 ? 7 : 8) && rnd() < 0.7) clarity[pt] = rnd() < (pt === "fee" || pt === "tax" ? 0.35 : 0.15) ? "simpler" : "clear"; });
    const att = maxStep >= 8 ? (rnd() < 0.82 ? 1 : 2) : drop === "COMPREHENSION_DIVERTED" ? 2 : 0;
    const quote = maxStep >= 6 ? { providerId: p.id, providerName: p.displayName, enrolledDebt: debt, monthlyDeposit: Math.round(debt * 0.72 / 40 / 5) * 5, termMonths: p.underwriting.estimatedTermMonths, feePct: p.underwriting.feePctOfEnrolledDebt, debtifyFee: debtifyFee(debt) } : null;
    const created = new Date(base - Math.floor(rnd() * 30 * 864e5)).toISOString();
    const firstNames = ["Ana", "Ben", "Cara", "Dev", "Eli", "Faye", "Gus", "Hana", "Ivan", "Jess"];
    const lastNames = ["Smith", "Jones", "Garcia", "Brown", "Davis", "Martinez", "Wilson", "Taylor", "Anderson", "Lee"];
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const email = maxStep >= 3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com` : null;
    const phone = maxStep >= 3 ? `+1555${String(1000 + i).padStart(7, "0")}` : null;
    const debts = maxStep >= 3 ? [
      { creditor: ["Chase", "Citi", "Capital One", "Bank of America", "Wells Fargo"][i % 5], type: "credit_card", balance: Math.round(debt * 0.6 / 100) * 100, status: "charged_off" },
      ...(rnd() > 0.5 ? [{ creditor: ["Discover", "Synchrony", "USAA"][Math.floor(rnd() * 3)], type: "credit_card", balance: Math.round(debt * 0.4 / 100) * 100, status: "delinquent" }] : []),
    ] : [];
    out.push({
      leadId: "sample_" + i, userId: i % 3 ? "sample_user" : null, source: "sample", outcome, maxStep, step: outcome === "in_progress" ? maxStep : outcome === "enrolled" ? 10 : 0,
      exitStep: outcome === "in_progress" || outcome === "enrolled" ? null : maxStep, status: outcome === "enrolled" ? (fee === "NOT_EARNED" ? "ENROLLED" : "PAYMENT1_CLEARED") : outcome === "declined" ? "DECLINED" : "STARTED",
      dropReason: drop, quote, backend: quote ? p.id : null, program: quote ? { debtifyFee: debtifyFee(debt), enrolledDebt: debt } : null, feeStatus: fee,
      consents, share: consents[2]?.granted || false, comprehensionAttempts: att, comprehensionPassed: maxStep >= 8, costsAcknowledged: maxStep >= 7,
      first: firstName, last: lastName, email, phone, debts, state, lang, clarity, debt, enrolledAt: outcome === "enrolled" ? created : null, createdAt: created, updatedAt: created,
    });
  }
  out.push({ leadId: "sample_x1", userId: "sample_user", source: "sample", outcome: "in_progress", maxStep: 9, step: 9, status: "SIGNED", dropReason: "CALL_NEEDS_HUMAN", callResult: "FAILED", backend: "meridian", quote: { providerId: "meridian", providerName: "Meridian", enrolledDebt: 22500, monthlyDeposit: 405, termMonths: [36, 48], feePct: 0.22, debtifyFee: 1800 }, program: { debtifyFee: 1800, enrolledDebt: 22500 }, feeStatus: "NOT_EARNED", consents: [{ key: "fcra", granted: true }, { key: "esign", granted: true }, { key: "contact_partners", granted: true }], share: true, first: "Rae", last: "Torres", email: "rae.torres.x1@example.com", phone: "+15559990001", debts: [{ creditor: "Chase", type: "credit_card", balance: 14000, status: "charged_off" }, { creditor: "Citi", type: "credit_card", balance: 8500, status: "delinquent" }], state: "GA", lang: "es", clarity: {}, comprehensionAttempts: 1, comprehensionPassed: true });
  return out;
}
