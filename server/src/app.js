import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { db } from "./config/db.js";
import { CLOSED_STATES, PROVIDERS, US_STATES } from "../../shared/config/providers.js";
import { BRAND } from "../../shared/config/brand.js";
import { DEBT_RANGES } from "../../shared/config/flow.js";
import { publicApi, seo, webhooks } from "./routes/public.js";
import { evaluate } from "./compliance/engine.js";
import { tagTradeline, enrolledLines } from "./services/tradelines.js";
import { devOutbox } from "./lib/mailer.js";
import { loadUser } from "./middleware/auth.js";
import { apiLimiter, requireAppHeader } from "./middleware/security.js";
import authRouter from "./routes/auth.js";
import leadsRouter from "./routes/leads.js";
import meRouter from "./routes/me.js";
import adminRouter from "./routes/admin.js";
import chatRouter from "./routes/chat.js";
import { sampleFile } from "./services/vendors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Example plan for the homepage, computed by the real matching engine from a sample Texas profile.
function samplePlan() {
  const lines = enrolledLines(sampleFile().map(tagTradeline));
  return evaluate({ stateCode: "TX", lines, disposableIncome: 900, incomeVerified: false }).quote;
}

export function createApp() {
  const app = express();
  if (env.trustProxy) app.set("trust proxy", /^\d+$/.test(env.trustProxy) ? Number(env.trustProxy) : env.trustProxy);
  app.disable("x-powered-by");

  // Analytics hosts are allowed only when the matching ID is configured.
  const ga = process.env.GA_MEASUREMENT_ID || "", pixel = process.env.META_PIXEL_ID || "";
  const csp = { script: ["'self'"], img: ["'self'", "data:"], connect: ["'self'"] };
  if (ga) {
    csp.script.push("https://www.googletagmanager.com");
    csp.img.push("https://*.google-analytics.com", "https://*.googletagmanager.com");
    csp.connect.push("https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com");
  }
  if (pixel) {
    csp.script.push("https://connect.facebook.net");
    csp.img.push("https://www.facebook.com");
    csp.connect.push("https://www.facebook.com", "https://connect.facebook.net");
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": csp.script,
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
          "img-src": csp.img,
          "connect-src": csp.connect,
          "frame-ancestors": ["'none'"],
          "upgrade-insecure-requests": env.isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());
  app.use(cors({ origin: env.clientOrigins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  if (!env.isTest) app.use(morgan(env.isProd ? "combined" : "dev", { skip: (req) => req.path === "/api/health" }));

  // Provider webhooks come before the CSRF header check (they can't send it) and are signature-verified.
  app.use("/api/webhooks", express.urlencoded({ extended: false, limit: "20kb" }), webhooks);
  app.use(seo);
  app.use("/api", apiLimiter, requireAppHeader, loadUser);
  app.get("/api/health", (req, res) => res.json({ ok: true, store: db.kind, uptime: Math.round(process.uptime()) }));
  app.get("/api/meta", (req, res) =>
    res.json({
      brand: BRAND,
      served: US_STATES.map((s) => s.code).filter((c) => !CLOSED_STATES.includes(c) && PROVIDERS.some((p) => p.licensedStates.includes(c))),
      closed: CLOSED_STATES,
      states: US_STATES,
      debtRanges: Object.entries(DEBT_RANGES).map(([id, r]) => ({ id, label: r.label })),
      providers: PROVIDERS.map(({ id, displayName, legalName, administrator }) => ({ id, displayName, legalName, administrator })),
      sample: samplePlan(),
      store: db.kind,
      demoMode: env.demoMode,
      analytics: { ga, pixel },
      devMail: !env.smtp.host && !env.isProd,
      claude: !!env.anthropicKey,
    })
  );
  app.use("/api/auth", authRouter);
  app.use("/api/leads", leadsRouter);
  app.use("/api/me", meRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/public", publicApi);
  if (!env.isProd) app.get("/api/dev/outbox", (req, res) => res.json({ emails: devOutbox() }));

  // Serve the built React app (production / `npm start`).
  const dist = path.resolve(__dirname, "../../client/dist");
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: "1h", setHeaders: (res, p) => {
      if (/assets[\\/]/.test(p)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      else if (/(sw\.js|manifest\.json)$/.test(p)) { res.setHeader("Cache-Control", "no-cache"); res.setHeader("Service-Worker-Allowed", "/"); }
    } }));
    app.get(/^(?!\/api).*/, (req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found", code: "NOT_FOUND" }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON", code: "BAD_JSON" });
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 && env.isProd ? "Something went wrong. Please try again." : err.message, code: err.code || "ERROR", ...(err.details ? { details: err.details } : {}) });
  });
  return app;
}
