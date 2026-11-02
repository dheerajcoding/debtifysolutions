// TCPA suppression. Append-only, never expiring, read by every outbound path —
// including every partner who bought a drop-off file.
import { STOP_KEYWORDS } from "../../../shared/config/flow.js";
import { db } from "../config/db.js";
import { newId } from "../lib/crypto.js";

/** Revocation may be made by any reasonable means: an exact keyword, or a message opening with one. */
export function isRevocation(body) {
  const n = String(body || "").trim().toUpperCase().replace(/[^A-Z ]/g, "").replace(/\s+/g, " ");
  return STOP_KEYWORDS.some((k) => n === k || n.startsWith(k + " "));
}

/** US-first E.164. Returns null rather than guessing. */
export function toE164(raw) {
  const d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return /^\+\d{8,15}$/.test(d) ? d : null;
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export const isSuppressed = async (e164) => !!(await db.suppressions.findOne({ phoneE164: e164 }));

export async function suppress(phone, source, raw = null, by = null) {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, reason: "unparseable" };
  if (await isSuppressed(e164)) return { ok: false, reason: "already", e164 };
  await db.suppressions.append({ recId: newId("sup"), phoneE164: e164, source, rawMessage: raw, by, at: new Date().toISOString() });
  // Production: fan out to every channel AND every partner who received this file.
  return { ok: true, e164 };
}

/** Every send path calls this. If you are unsure whether a message is marketing, it is. */
export async function canContact(phone) {
  const e164 = toE164(phone);
  return e164 ? !(await isSuppressed(e164)) : false;
}
