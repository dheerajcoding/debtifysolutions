import rateLimit from "express-rate-limit";
import { HttpError } from "../lib/http.js";

// CSRF defence: every state-changing API call must carry a custom header. Browsers
// won't send custom headers cross-site without a CORS preflight, which we only allow
// for our own origins. Combined with SameSite=Lax cookies this blocks CSRF.
export function requireAppHeader(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("X-Requested-With") !== "debtify") return next(new HttpError(403, "Missing request header", "CSRF"));
  next();
}

const limiter = (windowMin, limit, message) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    handler: (req, res) => res.status(429).json({ error: message, code: "RATE_LIMITED" }),
  });

export const apiLimiter = limiter(15, 600, "Too many requests. Please wait a few minutes and try again.");
export const authLimiter = limiter(15, 20, "Too many attempts. Please wait 15 minutes and try again.");
export const emailLimiter = limiter(60, 6, "Too many emails requested. Please try again later.");
export const chatLimiter = limiter(5, 40, "You're sending messages quickly. Please wait a moment.");
