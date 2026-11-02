// Values the application screens and the server both read. Ported from the
// Debtify specification (config/screens.ts + components/enroll/demo.ts) so the
// client and server cannot describe a step differently.

export const STEP_NAMES = ["", "Quick check", "Your estimate", "Verify identity", "Your debts", "Budget", "Your plan", "Risks and quick check", "Sign and set up", "Welcome call", "Enrolled"];
export const DONE_STEP = 10;

// Operational phases for the admin funnel (never consumer copy).
export const PHASES = [
  { id: 1, label: "Qualify", steps: [1, 2] },
  { id: 2, label: "Identify & consent", steps: [3] },
  { id: 3, label: "Accounts & budget", steps: [4, 5] },
  { id: 4, label: "Plan & disclose", steps: [6, 7] },
  { id: 5, label: "Execute", steps: [8, 9] },
];
export const phaseOfStep = (s) => (PHASES.find((p) => p.steps.includes(s)) || { id: s >= 10 ? 5 : 1 }).id;

// S01 debt bands (tap buttons). Midpoint is only used for the quick estimate.
export const DEBT_RANGES = {
  lt_7500: { label: "Under $7,500", mid: 5000 },
  "7500_15000": { label: "$7,500 – $15,000", mid: 11250 },
  "15000_25000": { label: "$15,000 – $25,000", mid: 20000 },
  "25000_50000": { label: "$25,000 – $50,000", mid: 37500 },
  gt_50000: { label: "Over $50,000", mid: 65000 },
};

// S03 payment status. "current" flags the heightened credit disclosure.
export const PAYMENT_STATUS = ["current", "behind", "not_paying", "collections"];

// S04 estimator: a RANGE of debt that could be resolved, never a point value (SUB-004).
export const ESTIMATE_RANGES = {
  lt_7500: [2600, 4500],
  "7500_15000": [4200, 9000],
  "15000_25000": [8500, 15000],
  "25000_50000": [14000, 30000],
  gt_50000: [28000, 60000],
};

// S06 one-time passcode.
export const OTP = { length: 6, maxAttempts: 5, maxResends: 3, resendSeconds: 30, ttlMinutes: 10 };
export const FRAUD_REVIEW_THRESHOLD = 0.75;

// S09 consent: a grant faster than this after render was not read.
export const MIN_RENDER_TO_GRANT_MS = 800;

// S10 bureau pull stages.
export const BUREAU_STAGES = {
  en: ["Matched your identity", "Located your credit file", "Reading your accounts", "Checking program fit"],
  es: ["Identidad confirmada", "Encontramos tu historial", "Leyendo tus cuentas", "Revisando qué programa encaja"],
};

// S12 add missing accounts.
export const MAX_ADDED_ACCOUNTS = 15;

// S14 affordability: the draft is capped at a share of disposable income, with a floor.
export const DRAFT_CAP = { shareOfDisposable: 0.55, absoluteFloor: 150 };

// Assumed average settlement as a share of enrolled balance, used only to
// estimate total cost. Substantiation: SUB-017. Replace with cohort data.
export const SETTLEMENT_ASSUMPTION = 0.5;

// S17c comprehension: attempts before the file diverts to alternatives. Never loops.
export const COMPREHENSION_MAX_ATTEMPTS = 2;

// S18 alternatives.
export const ALTERNATIVES = {
  en: {
    credit_counselling: "A non-profit credit counselling plan",
    consolidation_loan: "A debt consolidation loan",
    bankruptcy: "Talking to a bankruptcy attorney",
    do_nothing: "Doing nothing for now",
  },
  es: {
    credit_counselling: "Un plan de asesoría de crédito sin fines de lucro",
    consolidation_loan: "Un préstamo de consolidación de deudas",
    bankruptcy: "Hablar con un abogado de bancarrota",
    do_nothing: "No hacer nada por ahora",
  },
};
export const ALTERNATIVE_LINKS = {
  credit_counselling: "https://www.nfcc.org/",
  consolidation_loan: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-consolidation-loan-en-1791/",
  bankruptcy: "https://www.justice.gov/ust/credit-counseling-debtor-education-information",
  do_nothing: null,
};
export const COMPENSATION_DISCLOSURE = {
  en: "We are paid a referral fee by some of the organisations below. We are not paid for a referral to a non-profit credit counselling agency or to a bankruptcy attorney.",
  es: "Algunas de las organizaciones de abajo nos pagan una comisión por referirte. No recibimos pago por referirte a una agencia de asesoría sin fines de lucro ni a un abogado de bancarrota.",
};

// S19 signing pack (resolved per provider and state in production).
export const DOCUMENT_PACK = {
  en: ["Debt settlement services agreement", "Dedicated account agreement", "Limited power of attorney", "State disclosure addendum"],
  es: ["Contrato de servicios de liquidación de deudas", "Contrato de la cuenta dedicada", "Poder notarial limitado", "Anexo de divulgaciones del estado"],
};

// S20 account rights.
export const ACCOUNT_RIGHTS = {
  en: ["Change your deposit date or amount", "Pause deposits", "Close the account any time", "Get your balance refunded, less any account fees"],
  es: ["Cambiar la fecha o el monto del depósito", "Pausar los depósitos", "Cerrar la cuenta cuando quieras", "Recibir tu saldo de vuelta, menos cargos de la cuenta"],
};

// S21 / S22 verification call.
export const CALL_SLOTS = {
  en: { now: "Call me now", today_pm: "Later today, afternoon", tomorrow_am: "Tomorrow morning" },
  es: { now: "Llámame ahora", today_pm: "Hoy más tarde, en la tarde", tomorrow_am: "Mañana en la mañana" },
};
export const RECORDING_NOTICE = {
  en: "This call is recorded so we can confirm what you agreed to.",
  es: "Esta llamada se graba para confirmar lo que aceptaste.",
};
export const CALL_CONFIRM_POINTS = ["identity", "accounts_and_amount", "payment_and_date", "credit_impact_understood"];
export const VERIFICATION_SCRIPT = "VERIFICATION_SCRIPT_V4";

// S23 push notification types.
export const PUSH_TYPES = ["deposit_reminder_t_minus_3", "draft_failed", "settlement_reached"];

// S13 referral destinations.
export const REFERRAL_HREFS = { federal_student_loan_options: "https://studentaid.gov/manage-loans/repayment/plans" };

// TCPA suppression keywords.
export const STOP_KEYWORDS = ["STOP", "UNSUBSCRIBE", "REVOKE", "OPT OUT", "CANCEL", "QUIT", "END"];
export const HONOUR_TARGET_HOURS = 24;
export const HONOUR_LEGAL_LIMIT_BUSINESS_DAYS = 10;
