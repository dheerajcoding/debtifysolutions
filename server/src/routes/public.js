import { Router } from "express";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { CLOSED_STATES, PROVIDERS, STATE_FEE_CAPS, US_STATES, effectiveFeePct } from "../../../shared/config/providers.js";
import { GUIDES } from "../../../shared/content/guides/index.js";
import { ah } from "../lib/http.js";
import { registry } from "../compliance/registry.js";
import { isRevocation, suppress } from "../compliance/suppression.js";

// Public, read-only data the website and the application render from.
export const publicApi = Router();

publicApi.get("/registry", (req, res) => res.json(registry(req.query.lang === "es" ? "es" : "en")));

publicApi.get("/states", (req, res) =>
  res.json({
    states: US_STATES.map((s) => ({
      ...s,
      open: !CLOSED_STATES.includes(s.code),
      feeCap: STATE_FEE_CAPS[s.code] ?? null,
      providers: CLOSED_STATES.includes(s.code) ? [] : PROVIDERS.filter((p) => p.licensedStates.includes(s.code)).map((p) => ({ id: p.id, name: p.displayName, legalName: p.legalName, feePct: effectiveFeePct(p, s.code) })),
    })),
  })
);

// Inbound SMS (Twilio). A STOP-type reply suppresses the number on every channel.
// Mounted before the CSRF check: providers can't send our custom header.
export const webhooks = Router();

function validTwilio(req) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return !env.isProd; // dev/staging without Twilio: allow for testing
  const url = env.appUrl.replace(/\/$/, "") + req.originalUrl;
  const data = Object.keys(req.body || {}).sort().reduce((s, k) => s + k + req.body[k], url);
  const expected = crypto.createHmac("sha1", token).update(data).digest("base64");
  const got = req.get("X-Twilio-Signature") || "";
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

webhooks.post(
  "/sms",
  ah(async (req, res) => {
    if (!validTwilio(req)) return res.status(403).send("forbidden");
    const from = req.body.From || req.body.from;
    const body = req.body.Body || req.body.body || "";
    let reply = "";
    if (isRevocation(body)) {
      const r = await suppress(from, "inbound_sms", body);
      reply = r.ok || r.reason === "already" ? "You're unsubscribed from Debtify messages. No more texts will be sent." : "";
    }
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response>${reply ? `<Message>${reply}</Message>` : ""}</Response>`);
  })
);

// SEO: sitemap.xml and robots.txt
export const seo = Router();
const PAGES = ["/", "/how-it-works", "/alternatives", "/guides", "/states", "/legal/disclosures", "/privacy", "/terms", "/contact", "/apply"];
seo.get("/sitemap.xml", (req, res) => {
  const base = env.appUrl.replace(/\/$/, "");
  const urls = [
    ...PAGES.map((p) => ({ loc: base + p })),
    ...GUIDES.map((g) => ({ loc: `${base}/guides/${g.slug}`, lastmod: g.lastReviewedISO })),
    ...US_STATES.map((s) => ({ loc: `${base}/states/${s.code.toLowerCase()}` })),
  ];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
});
seo.get("/robots.txt", (req, res) => {
  const base = env.appUrl.replace(/\/$/, "");
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /staff\nDisallow: /dashboard\nDisallow: /settings\nDisallow: /apply\nDisallow: /api/\nDisallow: /dev/\nSitemap: ${base}/sitemap.xml\n`);
});
