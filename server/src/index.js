import bcrypt from "bcryptjs";
import { env } from "./config/env.js";
import { connectDB, db, disconnectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { newId } from "./lib/crypto.js";
import { buildSamples } from "./services/samples.js";
import { loadPanel } from "./services/panel.js";

await connectDB(env.mongoUri);

// Apply any admin overrides to the provider/state panel before serving traffic.
const panel = await loadPanel();
console.log(`[panel] serving ${panel.servedCount} states`);

// Create the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD (once).
if (env.adminEmail && env.adminPassword) {
  const email = env.adminEmail.toLowerCase();
  if (!(await db.users.findOne({ email }))) {
    await db.users.create({ userId: newId("usr"), email, passwordHash: await bcrypt.hash(env.adminPassword, 12), first: "Admin", last: "User", phone: "", lang: "en", role: "admin", emailVerified: true, tokenVersion: 0, failedLogins: 0 });
    console.log(`[auth] created admin account ${email}`);
  }
} else if (!env.isProd) {
  console.log("[auth] tip: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env to create a staff console login");
}

if (env.seedSamples && (await db.leads.count({ source: "sample" })) === 0) {
  await db.leads.insertMany(buildSamples());
  console.log("[db] seeded 181 sample applications for the admin dashboard");
}

const server = createApp().listen(env.port, () => console.log(`[api] Debtify listening on http://localhost:${env.port} (${env.isProd ? "production" : "development"})`));

const shutdown = (sig) => {
  console.log(`[api] ${sig} received, shutting down`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
