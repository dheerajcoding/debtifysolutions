import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Sends transactional email through SMTP when configured. Without SMTP (local development)
// messages go to a "dev outbox" you can open at /dev/outbox, and are printed to the console.
const outbox = [];
let transport = null;
if (env.smtp.host) {
  transport = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
}

export const devOutbox = () => outbox;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function layout(title, bodyHtml, cta) {
  return `<!doctype html><html><body style="margin:0;background:#F3F7F5;font-family:Arial,Helvetica,sans-serif;color:#0F2A2E">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:14px;border:1px solid #D9E4E0">
  <tr><td style="padding:24px 28px 8px;font-size:20px;font-weight:800">Debtify</td></tr>
  <tr><td style="padding:8px 28px 4px;font-size:22px;font-weight:800">${esc(title)}</td></tr>
  <tr><td style="padding:8px 28px;font-size:15px;line-height:1.5;color:#3E5458">${bodyHtml}</td></tr>
  ${cta ? `<tr><td style="padding:12px 28px 24px"><a href="${esc(cta.url)}" style="display:inline-block;background:#0B7A6E;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">${esc(cta.label)}</a><p style="font-size:12px;color:#66797C;margin-top:14px">Or paste this link into your browser:<br>${esc(cta.url)}</p></td></tr>` : ""}
  <tr><td style="padding:16px 28px 24px;font-size:12px;color:#66797C;border-top:1px solid #D9E4E0">You're receiving this because an account was created at Debtify with this email. If this wasn't you, you can ignore it.</td></tr>
  </table></td></tr></table></body></html>`;
}

const TEMPLATES = {
  verify: ({ first, url, lang }) =>
    lang === "es"
      ? { subject: "Confirma tu correo de Debtify", html: layout(`Hola ${first}, confirma tu correo`, "Toca el botón para confirmar tu correo electrónico. El enlace vence en 24 horas.", { url, label: "Confirmar mi correo" }) }
      : { subject: "Confirm your Debtify email", html: layout(`Hi ${first}, confirm your email`, "Tap the button to confirm your email address. The link expires in 24 hours.", { url, label: "Confirm my email" }) },
  reset: ({ first, url, lang }) =>
    lang === "es"
      ? { subject: "Restablece tu contraseña de Debtify", html: layout("Restablece tu contraseña", `Hola ${esc(first)}, recibimos una solicitud para restablecer tu contraseña. El enlace vence en 1 hora. Si no fuiste tú, ignora este correo.`, { url, label: "Elegir una nueva contraseña" }) }
      : { subject: "Reset your Debtify password", html: layout("Reset your password", `Hi ${esc(first)}, we got a request to reset your password. The link expires in 1 hour. If this wasn't you, ignore this email and your password stays the same.`, { url, label: "Choose a new password" }) },
  passwordChanged: ({ first, lang }) =>
    lang === "es"
      ? { subject: "Tu contraseña de Debtify cambió", html: layout("Tu contraseña cambió", `Hola ${esc(first)}, la contraseña de tu cuenta se cambió. Si no fuiste tú, restablécela de inmediato y contáctanos.`) }
      : { subject: "Your Debtify password was changed", html: layout("Your password was changed", `Hi ${esc(first)}, the password on your account was just changed. If this wasn't you, reset it right away and contact us.`) },
  enrolled: ({ first, deposit, date, company, lang }) =>
    lang === "es"
      ? { subject: "¡Bienvenido a tu programa!", html: layout(`¡Ya estás inscrito, ${esc(first)}!`, `Tu programa con ${esc(company)} está listo. Tu primer depósito de <b>${esc(deposit)}</b> es el <b>${esc(date)}</b>. Puedes ver tu progreso en tu panel.`, { url: env.appUrl + "/dashboard", label: "Ver mi panel" }) }
      : { subject: "Welcome to your program", html: layout(`You're enrolled, ${esc(first)}!`, `Your program with ${esc(company)} is set up. Your first deposit of <b>${esc(deposit)}</b> is on <b>${esc(date)}</b>. You can follow your progress on your dashboard.`, { url: env.appUrl + "/dashboard", label: "Open my dashboard" }) },
};

export async function sendMail(to, template, data) {
  const { subject, html } = TEMPLATES[template](data);
  const msg = { id: outbox.length + 1, to, subject, html, link: data.url || null, at: new Date().toISOString() };
  if (transport) {
    try {
      await transport.sendMail({ from: env.smtp.from, to, subject, html });
    } catch (e) {
      console.error(`[mail] failed to send "${template}" email: ${e.message}`);
    }
  } else {
    outbox.unshift(msg);
    outbox.splice(50);
    if (!env.isTest) console.log(`[mail:dev] to=${to} subject="${subject}"${msg.link ? ` link=${msg.link}` : ""}`);
  }
  return msg;
}
