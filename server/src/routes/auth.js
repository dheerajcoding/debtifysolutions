import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { ah, HttpError, validate } from "../lib/http.js";
import { randomToken, sha256 } from "../lib/crypto.js";
import { sendMail } from "../lib/mailer.js";
import { clearSession, publicUser, requireAuth, setSession } from "../middleware/auth.js";
import { authLimiter, emailLimiter } from "../middleware/security.js";

const router = Router();

const COMMON = new Set(["password", "password1", "password123", "12345678", "123456789", "qwerty123", "iloveyou1", "abc12345", "debtify123", "letmein1"]);
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters for your password")
  .max(128, "Password is too long")
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use letters and at least one number in your password")
  .refine((p) => !COMMON.has(p.toLowerCase()), "That password is too common. Try another one");
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);
const MAX_FAILED = 5;
const LOCK_MIN = 15;

// Accounts are for staff only (the staff console). Customers never sign in: their
// application is tied to this browser by the guest cookie.
const isStaffRole = (u) => u && ["staff", "admin"].includes(u.role);

router.post(
  "/login",
  authLimiter,
  validate(z.object({ email, password: z.string().min(1, "Enter your password").max(128) })),
  ah(async (req, res) => {
    const found = await db.users.findOne({ email: req.body.email });
    const user = isStaffRole(found) ? found : null;
    const bad = () => new HttpError(401, "That email and password don't match. Try again or reset your password.", "BAD_LOGIN");
    if (!user) {
      await bcrypt.compare(req.body.password, DUMMY_HASH); // keeps response time the same
      throw bad();
    }
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) throw new HttpError(423, `Too many wrong passwords. Try again in ${LOCK_MIN} minutes or reset your password.`, "LOCKED");
    const ok = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!ok) {
      const failed = (user.failedLogins || 0) + 1;
      await db.users.update(user.userId, failed >= MAX_FAILED ? { failedLogins: 0, lockUntil: new Date(Date.now() + LOCK_MIN * 6e4).toISOString() } : { failedLogins: failed });
      throw bad();
    }
    const fresh = await db.users.update(user.userId, { failedLogins: 0, lockUntil: null, lastLoginAt: new Date().toISOString() });
    setSession(res, fresh);
    res.json({ user: publicUser(fresh) });
  })
);

router.post("/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.post(
  "/logout-all",
  requireAuth,
  ah(async (req, res) => {
    await db.users.update(req.user.userId, { tokenVersion: (req.user.tokenVersion || 0) + 1 });
    clearSession(res);
    res.json({ ok: true });
  })
);

router.get("/me", (req, res) => res.json({ user: publicUser(req.user) }));

router.post(
  "/forgot-password",
  emailLimiter,
  validate(z.object({ email })),
  ah(async (req, res) => {
    const user = await db.users.findOne({ email: req.body.email });
    if (isStaffRole(user)) {
      const token = randomToken();
      await db.users.update(user.userId, { resetTokenHash: sha256(token), resetExpires: new Date(Date.now() + 36e5).toISOString() });
      await sendMail(user.email, "reset", { first: user.first, lang: user.lang, url: `${env.appUrl}/reset-password?token=${token}` });
    }
    // Same answer either way so the form can't be used to discover accounts.
    res.json({ ok: true });
  })
);

router.post(
  "/reset-password",
  authLimiter,
  validate(z.object({ token: z.string().min(10).max(200), password: passwordSchema })),
  ah(async (req, res) => {
    const user = await db.users.findOne({ resetTokenHash: sha256(req.body.token) });
    if (!isStaffRole(user) || !user.resetExpires || new Date(user.resetExpires) < new Date()) throw new HttpError(400, "This reset link has expired or was already used. Request a new one.", "BAD_TOKEN");
    const u = await db.users.update(user.userId, {
      passwordHash: await bcrypt.hash(req.body.password, 12), resetTokenHash: null, resetExpires: null,
      tokenVersion: (user.tokenVersion || 0) + 1, failedLogins: 0, lockUntil: null, emailVerified: true,
    });
    await sendMail(u.email, "passwordChanged", { first: u.first, lang: u.lang });
    setSession(res, u);
    res.json({ user: publicUser(u) });
  })
);

export default router;
