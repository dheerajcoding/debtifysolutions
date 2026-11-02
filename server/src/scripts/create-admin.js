// Creates or promotes a staff/admin account in MongoDB.
// Usage: npm run create-admin -- you@company.com "StrongPassw0rd" [admin|staff]
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { connectDB, db, disconnectDB } from "../config/db.js";
import { newId } from "../lib/crypto.js";

const [email, password, role = "admin"] = process.argv.slice(2);
if (!email || !password || !["admin", "staff"].includes(role)) {
  console.log('Usage: npm run create-admin -- you@company.com "StrongPassw0rd" [admin|staff]');
  process.exit(1);
}
await connectDB(env.mongoUri);
if (db.kind !== "mongodb") {
  console.log("MONGO_URI is not set. With the in-memory store, use ADMIN_EMAIL / ADMIN_PASSWORD in server/.env instead.");
  process.exit(1);
}
const existing = await db.users.findOne({ email: email.toLowerCase() });
const passwordHash = await bcrypt.hash(password, 12);
if (existing) {
  await db.users.update(existing.userId, { role, passwordHash, emailVerified: true, tokenVersion: (existing.tokenVersion || 0) + 1 });
  console.log(`Updated ${email} → ${role}`);
} else {
  await db.users.create({ userId: newId("usr"), email: email.toLowerCase(), passwordHash, first: "Staff", last: "User", phone: "", lang: "en", role, emailVerified: true, tokenVersion: 0, failedLogins: 0 });
  console.log(`Created ${role} ${email}`);
}
await disconnectDB();
