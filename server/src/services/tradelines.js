// Tradeline tagging: bureau lines → enrollable / excluded (fixed reason vocabulary) / needs review.
import { EXCLUSION_REASONS } from "../../../shared/config/constants.js";

const EXCLUDE = { auto: "secured_vehicle", secured: "secured_property", mortgage: "secured_property", federal_student: "federal_student" };
export const ENROLLABLE_TYPES = ["credit_card", "personal_loan", "medical", "collection", "store_card", "other_unsecured"];

export function tagTradeline(raw, i) {
  const excludedReason = EXCLUDE[raw.type] || null;
  const needsReview = raw.type === "unknown";
  return {
    tlId: "tl" + i,
    creditor: raw.creditor,
    type: needsReview ? "OTHER" : raw.type,
    dpd: raw.dpd || 0,
    balanceBureau: raw.balance, // never overwritten
    balanceConfirmed: null, // the consumer's figure, used where given
    source: "bureau",
    excludedReason,
    enrollable: !excludedReason && !needsReview,
    selected: !excludedReason && !needsReview,
    needsReview,
    confirmed: null,
    status: null,
  };
}

export const balanceOf = (t) => t.balanceConfirmed ?? t.balanceBureau ?? 0;
export const enrolledLines = (tls) => (tls || []).filter((t) => t.selected && t.enrollable && !t.excludedReason);
export const exclusionText = (key) => EXCLUSION_REASONS[key] || key;
