export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const usd = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");
export const clock = (d = new Date()) => new Date(d).toTimeString().slice(0, 8);
export const digits = (s) => String(s || "").replace(/\D/g, "");

// Input masks so people see familiar formats while typing.
export function maskPhone(v) {
  const d = digits(v).replace(/^1(?=\d{10})/, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
export function maskSsn(v) {
  const d = digits(v).slice(0, 9);
  if (d.length < 4) return d;
  if (d.length < 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}
export const maskMoney = (v) => {
  const d = digits(v).slice(0, 7);
  return d ? Number(d).toLocaleString("en-US") : "";
};
export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim());

// 0..3 password strength for the meter.
export function pwStrength(p) {
  if (!p || p.length < 8) return 0;
  let s = 1;
  if (/[a-zA-Z]/.test(p) && /\d/.test(p)) s++;
  if (p.length >= 12 || (/[^a-zA-Z0-9]/.test(p) && /[A-Z]/.test(p))) s++;
  return s;
}

// Suggests a first deposit date just after a common payday (1st or 15th).
export function suggestDate() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  const day = d.getDate();
  if (day > 15) d.setMonth(d.getMonth() + 1, 1);
  else if (day > 1) d.setDate(15);
  return d.toISOString().slice(0, 10);
}

export const fmtDate = (iso, lang, opts = { month: "short", day: "numeric", year: "numeric" }) =>
  iso ? new Date((iso.length === 10 ? iso + "T12:00:00Z" : iso)).toLocaleDateString(lang === "es" ? "es-US" : "en-US", { ...opts, timeZone: "UTC" }) : "–";
