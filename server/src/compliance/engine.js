// The decision engine — R1 through R7, evaluated in order, every stage logged.
//   1. Every rule evaluated is recorded, pass or fail (FCRA adverse action needs the WHY).
//   2. The 10% exploration slice is permanent. Do not remove it to hit a target.
import { CLOSED_STATES, PROVIDERS, effectiveFeePct } from "../../../shared/config/providers.js";
import { DRAFT_CAP, SETTLEMENT_ASSUMPTION } from "../../../shared/config/flow.js";
import { sha256 } from "../lib/crypto.js";

export const RULESET_VERSIONS = {
  knockouts: "2026-10-22.1",
  licensing: "2026-10-22.1",
  eligibility: "2026-10-22.1",
  preference: "2026-10-22.1",
  capacity: "2026-10-22.1",
};
/** Permanent. Do not remove this to hit a monthly target. */
export const EXPLORATION_SLICE = 0.1;
/** Debtify's own fee: 8% of enrolled debt, invoiced when payment 1 clears. */
export const DEBTIFY_FEE_PCT = 0.08;
export const debtifyFee = (enrolledDebt) => Math.round(enrolledDebt * DEBTIFY_FEE_PCT);

const hashToUnit = (hash) => parseInt(hash.slice(0, 8), 16) / 0xffffffff;
export const draftCap = (disposable) => Math.max(DRAFT_CAP.absoluteFloor, disposable * DRAFT_CAP.shareOfDisposable);

/** Which of the consumer's enrollable lines a provider will actually take. */
export function linesFor(provider, lines) {
  const u = provider.underwriting;
  return lines.filter((t) => !u.excludedAccountTypes.includes(t.type) && !u.excludedCreditors.includes(t.creditor));
}
const balanceOf = (t) => t.balanceConfirmed ?? t.balanceBureau ?? 0;

/**
 * input: { stateCode, lines: [{creditor,type,dpd,balanceBureau,balanceConfirmed}], disposableIncome, incomeVerified, capacityUsed? }
 */
export function evaluate(input) {
  const rules = [];
  const log = (ruleId, stage, passed, detail) => rules.push({ ruleId, stage, passed, detail: detail || null });
  const lines = input.lines;
  const enrolledDebt = lines.reduce((s, t) => s + balanceOf(t), 0);
  const maxDpd = Math.max(0, ...lines.map((t) => t.dpd || 0));
  const anyCurrent = lines.some((t) => !t.dpd);
  const creditors = lines.map((t) => t.creditor);

  const fileSnapshotHash = sha256(JSON.stringify({ s: input.stateCode, d: enrolledDebt, i: input.disposableIncome, dpd: maxDpd, c: [...creditors].sort() }));
  const base = { rules, fileSnapshotHash, rulesetVersions: { ...RULESET_VERSIONS } };
  const fail = (reasonCode, declineReason) => ({ ...base, outcome: "declined", providerId: null, fallbackChain: [], quote: null, reasonCode, declineReason });

  // ---- R1 knockouts
  const anyMin = Math.min(...PROVIDERS.map((p) => p.underwriting.minEnrolledDebt));
  if (enrolledDebt < anyMin) {
    log("K-01", "R1_knockouts", false, `enrolled ${enrolledDebt} < panel minimum ${anyMin}`);
    return fail("DEBT_UNDER_MIN", "The total you told us about is below the minimum for every program on our panel.");
  }
  log("K-01", "R1_knockouts", true);
  const anyDisp = Math.min(...PROVIDERS.map((p) => p.underwriting.minDisposableIncome));
  if (input.disposableIncome < anyDisp) {
    log("K-04", "R1_knockouts", false, `disposable ${input.disposableIncome} < ${anyDisp}`);
    return fail("NOT_AFFORDABLE", "Based on the figures you gave us, a monthly payment that would work is below what any program on our panel accepts.");
  }
  log("K-04", "R1_knockouts", true);

  // ---- R2 licensing
  if (!input.stateCode || CLOSED_STATES.includes(input.stateCode)) {
    log("L-01", "R2_licensing", false, `no licensed provider in ${input.stateCode || "unknown"}`);
    return fail("STATE_NOT_SERVED", "We do not have a licensed partner program in your state.");
  }
  const pool = PROVIDERS.filter((p) => p.licensedStates.includes(input.stateCode));
  log("L-01", "R2_licensing", pool.length > 0, `${pool.length} licensed in ${input.stateCode}`);
  if (!pool.length) return fail("STATE_NOT_SERVED", "We do not have a licensed partner program in your state.");

  // ---- R3 eligibility (per provider, on the lines that provider accepts)
  const cap = draftCap(input.disposableIncome);
  const eligible = [];
  for (const p of pool) {
    const u = p.underwriting;
    const own = linesFor(p, lines);
    const debt = own.reduce((s, t) => s + balanceOf(t), 0);
    const reasons = [];
    if (!own.length) reasons.push("all accounts excluded");
    if (debt < u.minEnrolledDebt) reasons.push("below minimum");
    if (debt > u.maxEnrolledDebt) reasons.push("above maximum");
    if (input.disposableIncome < u.minDisposableIncome) reasons.push("disposable income");
    if (Math.max(0, ...own.map((t) => t.dpd || 0)) < u.minDaysPastDue) reasons.push("delinquency window");
    if (own.some((t) => !t.dpd) && !u.acceptsCurrentAccounts) reasons.push("current accounts");
    const quote = reasons.length ? null : buildQuote(p, input.stateCode, own, cap);
    if (!reasons.length && !quote) reasons.push("deposit not affordable within term");
    log(`E-${p.id}`, "R3_eligibility", reasons.length === 0, reasons.join("; ") || `enrolled ${debt}`);
    if (!reasons.length) eligible.push({ p, quote, own });
  }
  if (!eligible.length) {
    const affordOnly = rules.filter((r) => r.stage === "R3_eligibility").every((r) => r.passed || /affordable|disposable/.test(r.detail || ""));
    return fail(affordOnly ? "NOT_AFFORDABLE" : "NO_BACKEND_FIT", "Your accounts do not fit the rules of any program on our panel right now.");
  }

  // ---- R4 preference
  const scored = eligible.map((e) => {
    let score = e.p.baseScore;
    if (input.incomeVerified && e.p.rewardsIncomeVerification) score += 8;
    log(`P-${e.p.id}`, "R4_preference", true, `score ${score}`);
    return { ...e, score };
  });

  // ---- R5 capacity + permanent exploration slice
  const explore = hashToUnit(fileSnapshotHash) < EXPLORATION_SLICE;
  const used = input.capacityUsed || {};
  const withCapacity = scored.filter((s) => (used[s.p.id] || 0) < s.p.monthlyCapacity);
  log("C-01", "R5_capacity", withCapacity.length > 0, `${explore ? "exploration slice — routing off top score" : "normal routing"}; ${withCapacity.length}/${scored.length} with capacity`);
  if (!withCapacity.length) return fail("NO_BACKEND_FIT", "Our partner programs are full this month. Please check back soon.");
  withCapacity.sort((a, b) => b.score - a.score);
  const ordered = explore && withCapacity.length > 1 ? [withCapacity[1], withCapacity[0], ...withCapacity.slice(2)] : withCapacity;

  // ---- R6 expected value (proxy until cohort data exists)
  log("V-01", "R6_expected_value", true, "proxy: preference score (no cohort data yet)");

  // ---- R7 bind
  const win = ordered[0];
  const fallbackChain = ordered.slice(1).map((x) => x.p.id);
  log("B-01", "R7_bind", true, `bound ${win.p.id}, fallback [${fallbackChain.join(", ")}]`);
  return {
    ...base,
    outcome: "in_progress",
    providerId: win.p.id,
    fallbackChain,
    explore,
    quote: { ...win.quote, snapshotHash: sha256(fileSnapshotHash + JSON.stringify(win.quote)), includedTlIds: win.own.map((t) => t.tlId) },
    reasonCode: null,
    declineReason: null,
  };
}

/**
 * The quote. Snapshotted immutably at the plan screen and never recomputed.
 * Deposit is capped at 55% of disposable income (floor $150); the term is the
 * shortest within the provider's range that the deposit can fund.
 */
function buildQuote(p, stateCode, own, cap) {
  const enrolled = own.reduce((s, t) => s + balanceOf(t), 0);
  const feePct = effectiveFeePct(p, stateCode);
  const total = Math.round(enrolled * (SETTLEMENT_ASSUMPTION + feePct));
  const [lo, hi] = p.underwriting.estimatedTermMonths;
  for (let term = lo; term <= hi; term++) {
    const dep = Math.ceil(total / term / 5) * 5;
    if (dep <= cap) {
      return {
        providerId: p.id,
        providerName: p.displayName,
        providerLegalName: p.legalName,
        administrator: p.administrator,
        enrolledDebt: enrolled,
        monthlyDeposit: Math.max(dep, 150),
        termMonths: [term, Math.min(hi, term + 6)],
        feePct,
        rawFeePct: p.underwriting.feePctOfEnrolledDebt,
        totalFee: Math.round(enrolled * feePct),
        estTotalCost: [Math.round(total * 0.92), Math.round(total * 1.08)],
        estSavings: [Math.max(0, Math.round(enrolled - total * 1.08)), Math.max(0, Math.round(enrolled - total * 0.92))],
        firstSettlementMonths: [6, 9],
        debtifyFee: debtifyFee(enrolled),
        createdAt: new Date().toISOString(),
      };
    }
  }
  return null;
}
