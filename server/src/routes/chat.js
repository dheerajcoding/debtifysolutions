import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { ah, validate } from "../lib/http.js";
import { guestHash } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/security.js";
import { answer } from "../services/chat.js";

const router = Router();

router.post(
  "/",
  chatLimiter,
  validate(z.object({
    leadId: z.string().max(60).optional(),
    lang: z.enum(["en", "es"]).default("en"),
    step: z.number().int().min(0).max(10).default(1),
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(500) })).min(1).max(20),
  })),
  ah(async (req, res) => {
    const { leadId, lang, step, messages } = req.body;
    const { reply, source, events } = await answer({ messages, lang, step });
    const evs = events.map(([tag, text]) => ({ tag, text, at: new Date().toISOString() }));
    if (leadId) {
      const lead = await db.leads.get(leadId);
      const mine = lead && ((req.user && lead.userId === req.user.userId) || (!lead.userId && lead.guestTokenHash && lead.guestTokenHash === guestHash(req)));
      if (mine) {
        await db.leads.update(leadId, { chats: (lead.chats || 0) + 1 });
        await db.leads.pushEvents(leadId, evs);
      }
    }
    res.json({ reply, source, events: evs });
  })
);

export default router;
