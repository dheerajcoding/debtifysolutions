// Admin metrics — pure functions over the applications list. Nothing here writes,
// so every figure on the admin panel can be re-derived from the records it came from.
// Conventions: a file's position is its FURTHEST step; division by zero returns 0.
import { PHASES, STEP_NAMES, phaseOfStep } from "../../../shared/config/flow.js";
import { PROVIDERS } from "../../../shared/config/providers.js";
import { CONSENTS } from "../../../shared/config/consents.js";
import { DEBTIFY_FEE_PCT, debtifyFee } from "./engine.js";

export const RESALE_BANDS = { A: [60, 120], B: [35, 70], C: [12, 40] };
export const RESALE_CONSENT_KEY = "contact_partners";
export const DEFAULT_CLEARANCE_RATE = 0.75;
export const CLEARANCE_SCENARIOS = [0.75, 0.85, 0.92];
export const PLANNING = { filesPerMonth: 200, monthlyFixedCost: 11400, assumedEnrolledDebt: 24000 };
export const OUTCOMES = ["in_progress", "enrolled", "declined", "referred_out", "diverted", "abandoned", "cancelled"];
const EXITED = ["declined", "referred_out", "diverted", "abandoned", "cancelled"];
const POINTS = [["fee", "What it costs"], ["timing", "How long it takes"], ["estimate", "Savings are an estimate"], ["account", "Your money, your account"], ["credit", "Credit score will drop"], ["collections", "Collections and lawsuits"], ["tax", "Forgiven debt may be taxed"], ["cancel", "Cancel any time"]];
const REASON_LABEL = {
  STATE_NOT_SERVED: "State not served", DEBT_UNDER_MIN: "Debt under minimum", NOT_AFFORDABLE: "Deposit not affordable", NO_BACKEND_FIT: "No provider fit",
  KYC_FAILED: "Failed ID check", NO_CREDIT_FILE: "No credit file", CALL_NEEDS_HUMAN: "Verification call failed", ESIGN_DECLINED: "Declined to sign",
  COMPREHENSION_DIVERTED: "Diverted at comprehension check", REFERRED_OUT: "Chose an alternative", UNDER_18: "Under 18", CANCELLED_BY_CLIENT: "Cancelled by client",
};
export const reasonLabel = (c) => (c?.startsWith("LEFT_AT_STEP") ? "Left at: " + STEP_NAMES[Number(c.slice(-2))] : REASON_LABEL[c] || c);

const safeDiv = (a, b) => (b === 0 ? 0 : a / b);
export const outcomeOf = (l) => l.outcome || (l.status === "DECLINED" ? "declined" : l.maxStep >= 10 ? "enrolled" : l.dropReason ? "abandoned" : "in_progress");
export const furthestOf = (l) => (outcomeOf(l) === "enrolled" || l.enrolledAt ? 10 : Math.max(l.maxStep || 1, l.exitStep || 0, l.step || 0));
const enrolledDebtOf = (l) => l.quote?.enrolledDebt ?? l.program?.enrolledDebt ?? l.debt ?? 0;

/** Drop-off tier for resale pricing. Later exits carry more value. */
export function tierOf(l) {
  const f = furthestOf(l);
  const o = outcomeOf(l);
  if (f <= 1 || (f === 2 && !l.userId && !l.first)) return "none"; // no personal data yet
  if (o === "diverted" || (o === "declined" && f === 5)) return "B";
  if (f >= 6) return "A";
  return "C";
}
const contactGranted = (l) => (l.consents || []).find((c) => c.key === RESALE_CONSENT_KEY || c.type === "SHARING")?.granted === true || l.share === true;

export function funnelByStep(apps) {
  return STEP_NAMES.slice(1).map((name, i) => {
    const step = i + 1;
    let reached = 0, advanced = 0, open = 0, dropped = 0;
    for (const a of apps) {
      const f = furthestOf(a);
      if (f < step) continue;
      reached++;
      if (f > step || (step === 10 && outcomeOf(a) === "enrolled")) { advanced++; continue; }
      if (outcomeOf(a) === "in_progress") open++;
      else dropped++;
    }
    return { step, name, phase: phaseOfStep(step), reached, advanced, open, dropped, advanceRate: safeDiv(advanced, reached), dropRate: safeDiv(dropped, reached) };
  });
}

export function phaseFunnel(apps) {
  return PHASES.map((p) => {
    const start = Math.min(...p.steps), end = Math.max(...p.steps);
    let reached = 0, advanced = 0, open = 0, dropped = 0;
    for (const a of apps) {
      const f = furthestOf(a);
      if (f < start) continue;
      reached++;
      if (f > end) { advanced++; continue; }
      if (outcomeOf(a) === "in_progress") open++;
      else dropped++;
    }
    return { phase: p.id, label: p.label, firstStep: STEP_NAMES[start], lastStep: STEP_NAMES[end], stepCount: p.steps.length, reached, advanced, open, dropped, advanceRate: safeDiv(advanced, reached), dropRate: safeDiv(dropped, reached) };
  });
}

export function dropoffInventory(apps) {
  const items = apps.filter((a) => EXITED.includes(outcomeOf(a))).map((a) => {
    const tier = tierOf(a);
    const band = tier === "none" ? [0, 0] : RESALE_BANDS[tier];
    const granted = contactGranted(a);
    // Failed ID checks and failed verification calls are never resold.
    const blockedReason = ["KYC_FAILED", "NO_CREDIT_FILE", "CALL_NEEDS_HUMAN", "UNDER_18"].includes(a.dropReason);
    return {
      leadId: a.leadId, source: a.source, name: [a.first, a.last].filter(Boolean).join(" ") || null, email: a.email || null, phone: a.phone || null,
      state: a.state, outcome: outcomeOf(a), exitStep: furthestOf(a), exitStepName: STEP_NAMES[furthestOf(a)], phase: phaseOfStep(furthestOf(a)),
      reason: reasonLabel(a.dropReason), tier, priceLow: band[0], priceHigh: band[1], contactConsentGranted: granted,
      resalable: tier !== "none" && granted && !blockedReason, enrolledDebt: enrolledDebtOf(a), createdAt: a.createdAt, exitedAt: a.updatedAt,
    };
  }).sort((x, y) => y.exitStep - x.exitStep);
  const tiers = ["A", "B", "C"].map((tier) => {
    const g = items.filter((i) => i.tier === tier), r = g.filter((i) => i.resalable), band = RESALE_BANDS[tier];
    return { tier, band, count: g.length, resalableCount: r.length, valueLow: g.length * band[0], valueHigh: g.length * band[1], resalableValueLow: r.length * band[0], resalableValueHigh: r.length * band[1] };
  });
  const sum = (f) => tiers.reduce((n, t) => n + f(t), 0);
  const lo = sum((t) => t.resalableValueLow), hi = sum((t) => t.resalableValueHigh);
  return {
    items, tiers, untiered: items.filter((i) => i.tier === "none").length, totalExits: items.length, resalableCount: sum((t) => t.resalableCount),
    valueLow: sum((t) => t.valueLow), valueHigh: sum((t) => t.valueHigh), resalableValueLow: lo, resalableValueHigh: hi, resalableValueMid: Math.round((lo + hi) / 2),
    consentBlockedCount: items.filter((i) => i.tier !== "none" && !i.contactConsentGranted).length,
  };
}

export function unitEconomics(apps, clearanceRate = DEFAULT_CLEARANCE_RATE) {
  const funded = apps.filter((a) => outcomeOf(a) === "enrolled" || a.enrolledAt);
  const enrolledDebtTotal = funded.reduce((s, a) => s + enrolledDebtOf(a), 0);
  const grossFee = funded.reduce((s, a) => s + debtifyFee(enrolledDebtOf(a)), 0);
  const clawbackReserve = Math.round(grossFee * (1 - clearanceRate));
  const drops = dropoffInventory(apps);
  const netFee = grossFee - clawbackReserve;
  const netRevenue = netFee + drops.resalableValueMid;
  return {
    clearanceRate, feePct: DEBTIFY_FEE_PCT, totalFiles: apps.length, fundedFiles: funded.length, enrolledDebtTotal,
    avgEnrolledDebt: Math.round(safeDiv(enrolledDebtTotal, funded.length)), grossFee, clawbackReserve, netFee,
    dropoffRevenueLow: drops.resalableValueLow, dropoffRevenueHigh: drops.resalableValueHigh, dropoffRevenue: drops.resalableValueMid, netRevenue,
    contributionPerFundedFile: Math.round(safeDiv(netRevenue, funded.length)), contributionPerFile: Math.round(safeDiv(netRevenue, apps.length)), empty: funded.length === 0,
  };
}

export function clearanceSensitivity(apps, rates = CLEARANCE_SCENARIOS) {
  const obs = unitEconomics(apps);
  const basis = obs.fundedFiles > 0 ? "observed" : "assumption";
  const avgEnrolledDebt = obs.fundedFiles > 0 ? obs.avgEnrolledDebt : PLANNING.assumedEnrolledDebt;
  const dropoffRevenuePerFile = obs.fundedFiles > 0 ? Math.round(safeDiv(obs.dropoffRevenue, obs.fundedFiles)) : 0;
  const gross = debtifyFee(avgEnrolledDebt);
  const rows = rates.map((clearanceRate) => {
    const clawback = Math.round(gross * (1 - clearanceRate));
    const retained = gross - clawback;
    const contribution = retained + dropoffRevenuePerFile;
    const monthly = contribution * PLANNING.filesPerMonth;
    const profit = monthly - PLANNING.monthlyFixedCost;
    return { clearanceRate, grossFeePerFile: gross, clawbackPerFile: clawback, retainedFeePerFile: retained, dropoffRevenuePerFile, contributionPerFile: contribution, monthlyContribution: monthly, monthlyOperatingProfit: profit, annualOperatingProfit: profit * 12, breakEvenFilesPerMonth: contribution > 0 ? Math.ceil(PLANNING.monthlyFixedCost / contribution) : 0 };
  });
  return { basis, avgEnrolledDebt, filesPerMonth: PLANNING.filesPerMonth, monthlyFixedCost: PLANNING.monthlyFixedCost, rows };
}

export function consentHealth(apps, recordCount = 0) {
  const keys = CONSENTS.map((spec) => {
    let decided = 0, granted = 0;
    for (const a of apps) {
      const rec = (a.consents || []).find((c) => c.key === spec.key);
      if (!rec) continue;
      decided++;
      if (rec.granted) granted++;
    }
    return { key: spec.key, required: spec.required, plain: spec.plain, decided, granted, declined: decided - granted, grantRate: safeDiv(granted, decided), declineRate: safeDiv(decided - granted, decided) };
  });
  const optional = keys.find((k) => k.key === RESALE_CONSENT_KEY);
  const floor = 20;
  return {
    keys, optional, contactDecided: optional.decided, contactDeclined: optional.declined, contactDeclineShare: safeDiv(optional.declined, optional.decided),
    // A genuinely optional consent gets declined by somebody. Zero declines means pressure in the UI.
    coercionWarning: optional.decided >= floor && optional.declined === 0, coercionSampleFloor: floor, totalRecords: recordCount,
  };
}

export function comprehensionStats(apps) {
  let attempted = 0, passed = 0, first = 0, retry = 0, diverted = 0, pending = 0;
  for (const a of apps) {
    const att = a.comprehensionAttempts || 0;
    if (furthestOf(a) < 7 && !att) continue;
    if (!a.costsAcknowledged && !att && furthestOf(a) < 8) continue;
    attempted++;
    if (a.comprehensionPassed || furthestOf(a) >= 8) { passed++; att <= 1 ? first++ : retry++; }
    else if (outcomeOf(a) === "diverted" || att >= 2) diverted++;
    else pending++;
  }
  return { gate: "comprehension_credit", maxAttempts: 2, attempted, passed, firstAttemptPasses: first, retryPasses: retry, firstAttemptPassRate: safeDiv(first, attempted), overallPassRate: safeDiv(passed, attempted), diverted, divertRate: safeDiv(diverted, attempted), pending };
}

export function outcomeMix(apps) {
  return OUTCOMES.map((o) => {
    const count = apps.filter((a) => outcomeOf(a) === o).length;
    return { outcome: o, count, share: safeDiv(count, apps.length) };
  });
}

/** Everything the admin dashboard shows, in one call. */
export function dashboard(apps, realApps, recordCount) {
  const earned = apps.filter((s) => ["EARNED", "FINAL"].includes(s.feeStatus)), clawed = apps.filter((s) => s.feeStatus === "CLAWED_BACK");
  const reasons = {};
  apps.forEach((s) => s.dropReason && (reasons[s.dropReason] = (reasons[s.dropReason] || 0) + 1));
  const byP = {};
  apps.filter((a) => outcomeOf(a) === "enrolled" || a.enrolledAt).forEach((s) => {
    const id = s.quote?.providerId || s.backend;
    const b = (byP[id] ??= { e: 0, p1: 0, cb: 0, debt: 0 });
    b.e++; b.debt += enrolledDebtOf(s);
    if (s.feeStatus && s.feeStatus !== "NOT_EARNED") b.p1++;
    if (s.feeStatus === "CLAWED_BACK") b.cb++;
  });
  const esN = apps.filter((s) => s.lang === "es").length;
  return {
    totals: { files: apps.length, real: realApps.length },
    outcomes: outcomeMix(apps),
    phases: phaseFunnel(apps),
    funnel: funnelByStep(apps),
    economics: unitEconomics(apps),
    sensitivity: clearanceSensitivity(apps),
    consents: consentHealth(apps, recordCount),
    comprehension: comprehensionStats(apps),
    drops: (({ items, ...rest }) => rest)(dropoffInventory(apps)),
    fees: { earnedCount: earned.length, clawbackRate: Math.round(safeDiv(clawed.length, earned.length + clawed.length) * 100), feesEarned: earned.reduce((s, z) => s + debtifyFee(enrolledDebtOf(z)), 0) },
    spanishShare: Math.round(safeDiv(esN, apps.length) * 100),
    clarity: POINTS.map(([id, name]) => {
      let c = 0, sm = 0;
      apps.forEach((s) => { const v = s.clarity?.[id]; if (v === "clear") c++; else if (v === "simpler") sm++; });
      return { id, name, clear: c, simpler: sm, n: c + sm };
    }),
    dropReasons: Object.entries(reasons).sort((a, z) => z[1] - a[1]).map(([code, count]) => ({ code, label: reasonLabel(code), count })),
    byProvider: Object.entries(byP).map(([id, v]) => ({ id, name: PROVIDERS.find((p) => p.id === id)?.displayName || id, enrolled: v.e, p1: v.p1, clawbacks: v.cb, debt: v.debt })),
    exceptions: apps.filter((s) => (s.dropReason === "CALL_NEEDS_HUMAN" || s.person || s.manualReview || s.callResult === "BOOKED") && !s.resolved && s.source !== "sample" || (s.source === "sample" && s.dropReason === "CALL_NEEDS_HUMAN" && !s.resolved)).map((s) => ({
      leadId: s.leadId, first: s.first, state: s.state, lang: s.lang, status: s.status,
      why: s.dropReason === "CALL_NEEDS_HUMAN" ? "Verification call failed" : s.manualReview ? "Fraud score over threshold" : s.callResult === "BOOKED" ? `Call booked: ${s.callBooking?.slot}` : "Asked for a person",
    })),
  };
}
