import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../config/db.js";
import { HttpError } from "../lib/http.js";
import { randomToken, sha256 } from "../lib/crypto.js";

export const SESSION_COOKIE = "dfy_session";
export const GUEST_COOKIE = "dfy_guest";

const cookieBase = () => ({ httpOnly: true, sameSite: "lax", secure: env.isProd, path: "/" });

export function setSession(res, user) {
  const token = jwt.sign({ sub: user.userId, ver: user.tokenVersion || 0, role: user.role }, env.jwtSecret, { expiresIn: `${env.sessionDays}d` });
  res.cookie(SESSION_COOKIE, token, { ...cookieBase(), maxAge: env.sessionDays * 864e5 });
}
export const clearSession = (res) => res.clearCookie(SESSION_COOKIE, cookieBase());

// The guest token is how a visitor owns their application (no customer accounts).
export function ensureGuest(req, res) {
  let t = req.cookies?.[GUEST_COOKIE];
  if (!t) {
    t = randomToken(24);
    res.cookie(GUEST_COOKIE, t, { ...cookieBase(), maxAge: 365 * 864e5 });
    req.cookies[GUEST_COOKIE] = t;
  }
  return sha256(t);
}
export const guestHash = (req) => (req.cookies?.[GUEST_COOKIE] ? sha256(req.cookies[GUEST_COOKIE]) : null);

// Loads req.user from the session cookie on every request (if present and valid).
export async function loadUser(req, res, next) {
  req.user = null;
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  try {
    const p = jwt.verify(token, env.jwtSecret);
    const u = await db.users.get(p.sub);
    if (u && (u.tokenVersion || 0) === p.ver && ["staff", "admin"].includes(u.role)) req.user = u;
    else clearSession(res);
  } catch {
    clearSession(res);
  }
  next();
}

export const requireAuth = (req, res, next) => (req.user ? next() : next(new HttpError(401, "Please log in to continue", "AUTH_REQUIRED")));
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new HttpError(401, "Please log in to continue", "AUTH_REQUIRED"));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, "You don't have access to this", "FORBIDDEN"));
  next();
};

export const publicUser = (u) =>
  u && { userId: u.userId, email: u.email, first: u.first, last: u.last, phone: u.phone, lang: u.lang, role: u.role, emailVerified: !!u.emailVerified, createdAt: u.createdAt };
