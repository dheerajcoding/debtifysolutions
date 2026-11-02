import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { ah, HttpError, validate } from "../lib/http.js";
import { decrypt } from "../lib/crypto.js";
import { GUEST_COOKIE, guestHash } from "../middleware/auth.js";
import { dashboardView } from "../services/program.js";
import { consentHash } from "../compliance/registry.js";
import { consentText } from "../../../shared/config/es.js";
import { PARTNER_LIST_HASH } from "../../../shared/config/constants.js";
import { newId } from "../lib/crypto.js";

// "My application": there are no customer accounts. A visitor's application is tied to
// this browser by the httpOnly guest cookie (set at step 1, kept for a year).
const router = Router();

const ownerQuery = (req) => {
  const gh = guestHash(req);
  if (gh) return { guestTokenHash: gh };
  if (req.user) return { userId: req.user.userId };
  return null;
};
const latestLead = async (req) => {
  const q = ownerQuery(req);
  if (!q) return null;
  return (await db.leads.list({ ...q, source: "web" }, { limit: 1, omit: ["events"] }))[0] || null;
};

// Customer dashboard: the latest application, its program, deposits and debts.
router.get(
  "/application",
  ah(async (req, res) => {
    res.json({ application: dashboardView(await latestLead(req)) });
  })
);

// Right to cancel at any time.
router.post(
  "/application/cancel",
  validate(z.object({ reason: z.string().max(300).optional() })),
  ah(async (req, res) => {
    const lead = await latestLead(req);
    if (!lead || ["CANCELLED", "DECLINED"].includes(lead.status)) throw new HttpError(409, "There's no active program to cancel", "NOTHING_TO_CANCEL");
    const deposits = (lead.deposits || []).map((d) => (d.status === "SCHEDULED" ? { ...d, status: "CANCELLED" } : d));
    const updated = await db.leads.update(lead.leadId, { status: "CANCELLED", outcome: "cancelled", exitStep: lead.step, cancelledAt: new Date().toISOString(), deposits, dropReason: lead.dropReason || "CANCELLED_BY_CLIENT" });
    await db.leads.pushEvents(lead.leadId, [{ tag: "EVENT", text: `cancelled by client${req.body.reason ? ": " + req.body.reason : ""}`, at: new Date().toISOString() }]);
    res.json({ application: dashboardView(updated) });
  })
);

// Optional contact consent can be changed any time. A change is a NEW consent record (append-only).
router.patch(
  "/preferences",
  validate(z.object({ contact_partners: z.boolean() })),
  ah(async (req, res) => {
    const lead = await latestLead(req);
    if (!lead) throw new HttpError(404, "No application yet", "NOT_FOUND");
    const lang = lead.lang || "en";
    const t = consentText("contact_partners", lang);
    const granted = req.body.contact_partners;
    const at = new Date().toISOString();
    await db.consents.append({ recId: newId("con"), leadId: lead.leadId, key: "contact_partners", granted, lang, textShown: `${t.plain}\n${t.legal}`, versionHash: consentHash("contact_partners", lang), partnerListHash: PARTNER_LIST_HASH, ip: req.ip, userAgent: req.get("user-agent") || null, source: "dashboard", at });
    const consents = (lead.consents || []).filter((c) => c.key !== "contact_partners").concat({ key: "contact_partners", granted, versionHash: consentHash("contact_partners", lang), at });
    const updated = await db.leads.update(lead.leadId, { consents, share: granted });
    await db.leads.pushEvents(lead.leadId, [{ tag: "CONSENT", text: `contact_partners ${granted ? "granted" : "withdrawn"} from dashboard (new record)`, at }]);
    res.json({ application: dashboardView(updated) });
  })
);

// Download a copy of your data (privacy).
router.get(
  "/export",
  ah(async (req, res) => {
    const q = ownerQuery(req);
    const leads = q ? await db.leads.list(q, { omit: ["guestTokenHash"] }) : [];
    const data = {
      exportedAt: new Date().toISOString(),
      applications: leads.map(({ dobEnc, addressEnc, events, otp, ...l }) => ({ ...l, dateOfBirth: decrypt(dobEnc), address: decrypt(addressEnc) ? JSON.parse(decrypt(addressEnc)) : null, activity: events })),
    };
    res.setHeader("Content-Disposition", 'attachment; filename="debtify-my-data.json"');
    res.json(data);
  })
);

// Delete my details: removes personal details from this browser's applications and forgets
// the browser. De-identified records needed for compliance reporting are kept.
router.delete(
  "/",
  validate(z.object({ confirm: z.literal("DELETE", { errorMap: () => ({ message: "Type DELETE to confirm" }) }) })),
  ah(async (req, res) => {
    const q = ownerQuery(req);
    if (!q) throw new HttpError(404, "There's no application on this device", "NOT_FOUND");
    const leads = await db.leads.list(q, { omit: ["events"] });
    for (const l of leads)
      await db.leads.update(l.leadId, { guestTokenHash: null, first: null, last: null, email: null, phone: null, dobEnc: null, addressEnc: null, ssnLast4: null, status: ["ENROLLED", "SIGNED"].includes(l.status) ? "CANCELLED" : l.status, outcome: l.outcome === "in_progress" || l.outcome === "enrolled" ? "cancelled" : l.outcome });
    res.clearCookie(GUEST_COOKIE, { httpOnly: true, sameSite: "lax", path: "/" });
    res.json({ ok: true, removed: leads.length });
  })
);

export default router;
