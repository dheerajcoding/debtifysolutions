import { US_STATES } from "./providers.js";
const PARTNER_LIST_HASH = (typeof process !== "undefined" && process.env && process.env.PARTNER_LIST_HASH) || "unset-dev";
const IRS_1099C_URL = "https://www.irs.gov/taxtopics/tc431";
const VERIFICATION_SCRIPT_V4 = "VERIFICATION_SCRIPT_V4";
const ACCOUNT_TYPES = [
  { id: "credit_card", label: "Credit card" },
  { id: "personal_loan", label: "Personal loan" },
  { id: "medical", label: "Medical bill" },
  { id: "collection", label: "Collection account" },
  { id: "store_card", label: "Store card" },
  { id: "other_unsecured", label: "Other unsecured" }
];
const EXCLUSION_REASONS = {
  secured_vehicle: "Secured by your car. If you stop paying, the lender can repossess it. Keep paying this.",
  secured_property: "Secured by your property.",
  federal_student: "Federal student loans have their own government relief options that are usually better than settlement.",
  below_minimum: "Below the program minimum for this account type.",
  excluded_creditor: "This creditor is not accepted by your matched provider.",
  not_delinquent: "Not eligible at its current payment status."
};
function isAdult(dob) {
  const now = /* @__PURE__ */ new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || m === 0 && now.getDate() < dob.getDate()) age--;
  return age >= 18;
}
export {
  ACCOUNT_TYPES,
  EXCLUSION_REASONS,
  IRS_1099C_URL,
  PARTNER_LIST_HASH,
  US_STATES,
  VERIFICATION_SCRIPT_V4,
  isAdult
};
