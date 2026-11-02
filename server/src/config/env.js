import "dotenv/config";
import crypto from "node:crypto";

// Central, validated configuration. In production the server refuses to start
// without the secrets it needs; in development safe throwaway values are generated.
const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

function secret(name, bytes = 32) {
  const v = process.env[name];
  if (v) return v;
  if (isProd) {
    console.error(`[config] ${name} is required in production. See server/.env.example`);
    process.exit(1);
  }
  if (!isTest) console.warn(`[config] ${name} not set → using a temporary development value (sessions reset on restart)`);
  return crypto.randomBytes(bytes).toString("hex");
}

if (isProd && !process.env.MONGO_URI) {
  console.error("[config] MONGO_URI is required in production.");
  process.exit(1);
}

// A persistent database with development defaults is the dangerous combination: real
// consumer records are being written, but the dev conveniences are still switched on.
// Warn loudly and specifically rather than letting it pass unnoticed.
if (!isProd && !isTest && process.env.MONGO_URI) {
  const problems = [];
  if (!process.env.ENCRYPTION_KEY) problems.push("ENCRYPTION_KEY is random on every restart — date of birth and address written now become PERMANENTLY UNREADABLE after the next restart");
  if (!process.env.JWT_SECRET) problems.push("JWT_SECRET is random on every restart — everyone is signed out whenever the server restarts");
  if (process.env.SEED_SAMPLES !== "false") problems.push("SEED_SAMPLES is on — 181 fake applications are written into this database");
  problems.push("/api/dev/outbox is publicly readable — it contains one-time phone codes and password-reset links");
  console.warn(`\n[config] ⚠  Real database connected while NODE_ENV is "${process.env.NODE_ENV || "development"}".`);
  for (const p of problems) console.warn(`[config] ⚠  ${p}`);
  console.warn("[config] ⚠  Before taking real applications set NODE_ENV=production and fixed JWT_SECRET / ENCRYPTION_KEY values.\n");
}

export const env = {
  isProd,
  isTest,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  appUrl: (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, ""),
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
  jwtSecret: secret("JWT_SECRET"),
  encryptionKey: secret("ENCRYPTION_KEY"),
  sessionDays: Number(process.env.SESSION_DAYS) || 7,
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "Debtify <no-reply@debtify.local>",
  },
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  demoMode: process.env.DEMO_MODE ? process.env.DEMO_MODE === "true" : !isProd,
  seedSamples: process.env.SEED_SAMPLES ? process.env.SEED_SAMPLES === "true" : !isProd,
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
  trustProxy: process.env.TRUST_PROXY || (isProd ? "1" : ""),
};
