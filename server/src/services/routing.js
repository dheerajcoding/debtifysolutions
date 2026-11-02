import { BACKENDS, DEBTIFY_FEE } from "../data/backends.js";

const EXCLUDED = ["MORTGAGE", "AUTO", "SECURED"];

// Classify a raw credit-report tradeline into a debt type.
// Returns [type, certain]; uncertain ones are confirmed by the consumer.
export function classify(t) {
  const a = `${t.acct} ${t.ind} ${t.creditor}`.toLowerCase();
  if (t.secured) return ["SECURED", true];
  if (/mortgage/.test(a)) return ["MORTGAGE", true];
  if (/\bauto\b/.test(a)) return ["AUTO", true];
  if (/collection/.test(a)) return ["COLLECTION", true];
  if (/medical/.test(a)) return ["MEDICAL", true];
  if (/revolving|bank card/.test(a)) return ["CREDIT_CARD", true];
  if (/installment|personal loan/.test(a)) return ["PERSONAL_LOAN", true];
  return ["OTHER", false];
}

export function tagTradeline(t, i) {
  const [type, certain] = classify(t);
  const excluded = EXCLUDED.includes(type);
  return {
    tlId: "tl" + i,
    creditor: t.creditor,
    type,
    balance: t.balance,
    enrollable: !excluded && type !== "OTHER",
    selected: !excluded && type !== "OTHER",
    needsReview: !certain && !excluded,
    confirmed: null,
  };
}

function buildProgram(b, debt, budget) {
  const total = Math.round(debt * (b.settle + b.fee));
  for (const term of [...b.terms].sort((x, y) => x - y)) {
    const dep = Math.ceil(total / term);
    if (dep <= budget && dep >= b.minDep) {
      return {
        backendId: b.id,
        backendName: b.name,
        enrolledDebt: debt,
        monthlyDeposit: dep,
        termMonths: term,
        estTotalCost: total,
        estSavings: debt - total,
        clientFeePct: b.fee,
        debtifyFee: Math.round(debt * DEBTIFY_FEE),
      };
    }
  }
  return null;
}

// Match a consumer to the best-fitting backend, or return a decline reason code.
export function route({ state, debts, income, expenses }) {
  const budget = Math.max(0, income - expenses);
  const matches = [];
  const rejected = [];
  for (const b of BACKENDS) {
    const r = [];
    if (!b.states.includes(state)) r.push("STATE_NOT_SERVED");
    const debt = debts.filter((d) => d.selected && d.enrollable && b.types.includes(d.type)).reduce((s, d) => s + d.balance, 0);
    if (debt < b.min) r.push("DEBT_UNDER_MIN");
    if (debt > b.max) r.push("DEBT_OVER_MAX");
    let p = null;
    if (!r.length) {
      p = buildProgram(b, debt, budget);
      if (!p) r.push("NOT_AFFORDABLE");
    }
    if (p) {
      const headroom = Math.max(0, (budget - p.monthlyDeposit) / Math.max(1, budget));
      matches.push({ p, s: 0.5 * headroom + 0.3 * (1 - b.cb) + 0.2 });
    } else rejected.push({ id: b.id, r });
  }
  if (matches.length) {
    matches.sort((a, z) => z.s - a.s);
    // Record exactly which debts the matched company will take.
    const b = BACKENDS.find((x) => x.id === matches[0].p.backendId);
    matches[0].p.includedTlIds = debts.filter((d) => d.selected && d.enrollable && b.types.includes(d.type)).map((d) => d.tlId);
    return { decision: "MATCH", program: matches[0].p, scores: matches.map((m) => [m.p.backendName, m.s.toFixed(2)]), rejected };
  }
  const all = (c) => rejected.every((x) => x.r.includes(c));
  const reasonCode = all("STATE_NOT_SERVED")
    ? "STATE_NOT_SERVED"
    : all("DEBT_UNDER_MIN")
      ? "DEBT_UNDER_MIN"
      : rejected.some((x) => x.r.length === 1 && x.r[0] === "NOT_AFFORDABLE")
        ? "NOT_AFFORDABLE"
        : "NO_BACKEND_FIT";
  return { decision: "DECLINE", reasonCode, rejected };
}
