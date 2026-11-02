// Partner debt-settlement companies ("backends") and their eligibility rules.
// Names and numbers are placeholders for staging.
export const BACKENDS = [
  { id: "backend-a", name: "Backend A", states: "AL AZ CA FL IN KY MD MI MO MS NC NE NM NY OK PA SD TN TX VA WA WI".split(" "), min: 10000, max: 100000, types: ["CREDIT_CARD", "PERSONAL_LOAN", "MEDICAL", "COLLECTION"], minDep: 250, terms: [24, 30, 36, 42, 48], settle: 0.5, fee: 0.25, cb: 0.12 },
  { id: "backend-b", name: "Backend B", states: "AZ CA FL GA IN MI MO NC NV NY OH PA TX VA".split(" "), min: 7500, max: 80000, types: ["CREDIT_CARD", "PERSONAL_LOAN", "MEDICAL", "COLLECTION", "PRIVATE_STUDENT"], minDep: 200, terms: [24, 36, 48], settle: 0.48, fee: 0.23, cb: 0.14 },
  { id: "backend-c", name: "Backend C", states: "AL AR CA FL IA LA MO MT NC NM OK SD TN TX UT WY".split(" "), min: 15000, max: 150000, types: ["CREDIT_CARD", "PERSONAL_LOAN"], minDep: 300, terms: [30, 36, 42, 48, 60], settle: 0.52, fee: 0.2, cb: 0.1 },
  { id: "backend-d", name: "Backend D", states: "CA FL IL MA MI NY OH PA TX VA WA".split(" "), min: 10000, max: 120000, types: ["CREDIT_CARD", "PERSONAL_LOAN", "MEDICAL", "COLLECTION"], minDep: 250, terms: [24, 36, 48], settle: 0.5, fee: 0.25, cb: 0.13 },
];

export const DEBTIFY_FEE = 0.07;
export const SERVED = [...new Set(BACKENDS.flatMap((b) => b.states))].sort();
export const MIN_DEBT = Math.min(...BACKENDS.map((b) => b.min));
export const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

// The simplified 9-screen application (10 = enrolled), grouped into 4 stages.
export const STEP_NAMES = ["", "Quick check", "Your estimate", "Verify identity", "Your debts", "Budget", "Your plan", "Risks and quick check", "Deposits and signing", "Welcome call", "Enrolled"];
export const LAST_STEP = 9;
export const DONE_STEP = 10;

// Debt ranges offered as tap buttons on the first screen (midpoint used for the estimate).
export const DEBT_RANGES = {
  "lt7500": { label: "Under $7,500", mid: 5000 },
  "7500-10000": { label: "$7,500 – $10,000", mid: 8750 },
  "10000-15000": { label: "$10,000 – $15,000", mid: 12500 },
  "15000-25000": { label: "$15,000 – $25,000", mid: 20000 },
  "25000-50000": { label: "$25,000 – $50,000", mid: 37500 },
  "50000-75000": { label: "$50,000 – $75,000", mid: 62500 },
  "75000-100000": { label: "$75,000 – $100,000", mid: 87500 },
  "gt100000": { label: "Over $100,000", mid: 110000 },
};

export const CONSENT_TYPES = [
  { type: "CREDIT_PULL", required: true },
  { type: "ESIGN", required: true },
  { type: "CALLS_TEXTS", required: false },
  { type: "SHARING", required: false },
];
export const CONSENT_VERSION = "draft-2026-09-30";

// Correct answers to the comprehension quiz (index of the right option).
export const QUIZ_ANSWERS = { fee: 2, credit: 0, sue: 1 };
