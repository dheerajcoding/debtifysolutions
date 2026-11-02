import crypto from "node:crypto";
import { env } from "../config/env.js";

// AES-256-GCM field encryption for personal data at rest (date of birth, address).
const KEY = crypto.createHash("sha256").update(env.encryptionKey).digest();

export function encrypt(plain) {
  if (plain === undefined || plain === null || plain === "") return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const data = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decrypt(blob) {
  if (!blob) return null;
  try {
    const [, iv, tag, data] = blob.split(":");
    const d = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");
export const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
