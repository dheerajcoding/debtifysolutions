import { env } from "../config/env.js";
import { canContact, toE164 } from "../compliance/suppression.js";
import { devOutbox } from "./mailer.js";

// Text messages. Twilio when TWILIO_* is configured; otherwise the dev outbox.
// Every send checks the suppression list first, including "transactional" ones.
export async function sendSms(phone, body, { kind = "transactional" } = {}) {
  const to = toE164(phone);
  if (!to) return { ok: false, reason: "bad_number" };
  if (!(await canContact(to))) return { ok: false, reason: "suppressed" };
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
  if (sid && token && from) {
    try {
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      });
      return { ok: r.ok };
    } catch (e) {
      console.error("[sms] send failed:", e.message);
      return { ok: false, reason: "vendor_error" };
    }
  }
  const box = devOutbox();
  box.unshift({ id: box.length + 1, to, subject: `SMS (${kind})`, html: body, text: body, link: null, at: new Date().toISOString(), sms: true });
  box.splice(50);
  if (!env.isTest) console.log(`[sms:dev] to=${to} "${body}"`);
  return { ok: true, dev: true };
}
