// Disclosure + consent registry: version hashes are the evidence that a specific
// consumer was shown specific words (in a specific language) on a specific date.
import { DISCLOSURES } from "../../../shared/config/disclosures.js";
import { CONSENTS } from "../../../shared/config/consents.js";
import { PARTNER_LIST_HASH } from "../../../shared/config/constants.js";
import { consentText, disclosureText } from "../../../shared/config/es.js";
import { db } from "../config/db.js";
import { newId, sha256 } from "../lib/crypto.js";

export { DISCLOSURES, CONSENTS, PARTNER_LIST_HASH };

export const disclosureHash = (key, lang = "en") => {
  const d = disclosureText(key, lang);
  return sha256([d.version, lang, d.title, ...d.body, d.acknowledgement].join("\n"));
};
export const consentHash = (key, lang = "en") => {
  const c = consentText(key, lang);
  return sha256(`${c.plain}\n${c.legal}`);
};

/** The registry as the client renders it, with hashes. */
export function registry(lang = "en") {
  return {
    disclosures: Object.keys(DISCLOSURES).map((k) => ({ ...disclosureText(k, lang), hash: disclosureHash(k, lang) })),
    consents: CONSENTS.map((c) => ({ ...consentText(c.key, lang), hash: consentHash(c.key, lang) })),
    partnerListHash: PARTNER_LIST_HASH,
  };
}

// ---------- gate artifacts (append-only) ----------
export const writeArtifact = (leadId, gate, detail = null) => db.artifacts.append({ recId: newId("art"), leadId, gate, detail, at: new Date().toISOString() });
export const hasArtifact = async (leadId, gate) => !!(await db.artifacts.findOne({ leadId, gate }));
export async function missingGates(leadId, gates) {
  const out = [];
  for (const g of gates) if (!(await hasArtifact(leadId, g))) out.push(g);
  return out;
}

// Gates that must exist before a step's endpoint will accept a submission.
// Checked against the database, never against what the request says.
export const GATES_BEFORE = {
  4: ["phone_verified", "consent_records"],
  5: ["phone_verified", "consent_records", "debts_confirmed", "exclusions_acknowledged"],
  6: ["phone_verified", "consent_records", "debts_confirmed", "decision_bound"],
  7: ["quote_acknowledged", "ack_advance_fee", "ack_dedicated_account"],
  8: ["quote_acknowledged", "ack_advance_fee", "ack_dedicated_account", "comprehension_credit", "ack_creditor_contact", "ack_tax", "alternatives_reviewed"],
  9: ["executed_pack_id", "ach_authorization_id"],
  10: ["verification_call_passed"],
};
