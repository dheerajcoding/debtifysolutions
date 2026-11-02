import { decrypt } from "../lib/crypto.js";
import { PUSH_TYPES } from "../../../shared/config/flow.js";
import { balanceOf } from "./tradelines.js";

const addMonths = (iso, n) => {
  const d = new Date(iso + "T12:00:00Z");
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + n, 1);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
};

/** Monthly deposit schedule created at enrollment (by the account administrator in production). */
export function buildDeposits(program, draftDate) {
  return Array.from({ length: program.termMonths }, (_, i) => ({ n: i + 1, date: addMonths(draftDate, i), amount: program.monthlyDeposit, status: "SCHEDULED" }));
}

/** The customer dashboard / portal view of an application. */
export function dashboardView(lead) {
  if (!lead) return null;
  const deposits = lead.deposits || [];
  const cleared = deposits.filter((d) => d.status === "CLEARED");
  const saved = cleared.reduce((s, d) => s + d.amount, 0);
  const next = deposits.find((d) => d.status === "SCHEDULED");
  const debts = (lead.tradelines || []).filter((t) => t.selected && t.enrollable && !t.excludedReason).map((t) => ({ tlId: t.tlId, creditor: t.creditor, type: t.type, balance: balanceOf(t), status: t.status || "ENROLLED" }));
  const excluded = (lead.tradelines || []).filter((t) => t.excludedReason).map((t) => ({ creditor: t.creditor, balance: balanceOf(t), reason: t.excludedReason }));
  const addr = decrypt(lead.addressEnc);
  const q = lead.quote;
  return {
    leadId: lead.leadId,
    first: lead.first || null,
    last: lead.last || null,
    email: lead.email || null,
    phoneMasked: lead.phone ? `(•••) ••• ‑ ${String(lead.phone).slice(-4)}` : null,
    status: lead.status,
    outcome: lead.outcome,
    step: lead.step,
    maxStep: lead.maxStep,
    dropReason: lead.dropReason,
    referral: lead.referral || null,
    lang: lead.lang,
    state: lead.state,
    debtRange: lead.debtRange,
    estimate: lead.estimate,
    quote: q || null,
    program: lead.program,
    administrator: q?.administrator || null,
    counterparty: q?.providerLegalName || null,
    draftDate: lead.draftDate,
    enrolledAt: lead.enrolledAt,
    signedAt: lead.signedAt,
    signature: lead.signature || null,
    cancelledAt: lead.cancelledAt,
    callResult: lead.callResult,
    callBooking: lead.callBooking || null,
    feeStatus: lead.feeStatus,
    person: lead.person,
    consents: lead.consents || [],
    address: addr ? JSON.parse(addr) : null,
    ssnLast4: lead.ssnLast4,
    debts,
    excluded,
    deposits,
    // Both of the first two deposits are always named, never just the next one.
    firstTwoDeposits: deposits.slice(0, 2),
    pushTypes: PUSH_TYPES,
    summary: {
      saved,
      depositsMade: cleared.length,
      depositsTotal: deposits.length,
      nextDeposit: next || null,
      progressPct: deposits.length ? Math.round((cleared.length / deposits.length) * 100) : 0,
      settled: debts.filter((d) => d.status === "SETTLED").length,
    },
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}
