// Inline SVG explainers. They return SVG markup strings whose labels follow the language.
import { esc, usd } from "./format.js";

export const AVATAR = `<svg class="avatar" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="28" class="v-bt"/><path d="M12 56c1-11 8-16 16-16s15 5 16 16z" class="v-a"/><circle cx="28" cy="25" r="11" class="v-skin"/><path d="M16 26c0-10 6-14 12-14s13 4 12 15c-2-5-6-8-12-8s-10 3-12 7z" class="v-hair"/><circle cx="24" cy="26" r="1.4" class="v-i"/><circle cx="32" cy="26" r="1.4" class="v-i"/><path d="M24.5 30.5c2 2 5 2 7 0" fill="none" stroke="#7a4a2a" stroke-width="1.4" stroke-linecap="round"/></svg>`;
// Generic, illustrated avatars (never real photos or named people) used to add visual
// warmth to trust sections — varied skin/hair tones and silhouette only, no identity implied.
const AVATAR_PALETTES = [
  { bg: "#DFF1EC", body: "#0B7A6E", skin: "#C68B59", hair: "#3B2A20" },
  { bg: "#FDF0D9", body: "#F2A93B", skin: "#8D5A3B", hair: "#1C1512" },
  { bg: "#E1F2E8", body: "#1E7B4F", skin: "#E7B895", hair: "#6B4226" },
  { bg: "#DFF1EC", body: "#0A685F", skin: "#F0C9A0", hair: "#A66A3C" },
];
export function avatarVariant(i) {
  const p = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
  return `<svg class="avatar" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="28" fill="${p.bg}"/><path d="M12 56c1-11 8-16 16-16s15 5 16 16z" fill="${p.body}"/><circle cx="28" cy="25" r="11" fill="${p.skin}"/><path d="M16 26c0-10 6-14 12-14s13 4 12 15c-2-5-6-8-12-8s-10 3-12 7z" fill="${p.hair}"/><circle cx="24" cy="26" r="1.4" fill="var(--ink)"/><circle cx="32" cy="26" r="1.4" fill="var(--ink)"/><path d="M24.5 30.5c2 2 5 2 7 0" fill="none" stroke="#7a4a2a" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}
function icon(kind, x, y) {
  const g = (inner) => `<g transform="translate(${x},${y})">${inner}</g>`;
  if (kind === "card") return g(`<rect x="0" y="6" width="34" height="22" rx="4" class="v-b"/><rect x="0" y="11" width="34" height="4" class="v-i" opacity=".5"/>`);
  if (kind === "loan") return g(`<rect x="5" y="0" width="24" height="30" rx="3" class="v-c" stroke="var(--soft)" stroke-width="1.5"/><rect x="9" y="7" width="16" height="3" class="v-l"/><rect x="9" y="13" width="16" height="3" class="v-l"/><text x="17" y="27" text-anchor="middle" class="v-tb">$</text>`);
  if (kind === "medical") return g(`<rect x="3" y="3" width="28" height="28" rx="6" class="v-at"/><rect x="14" y="8" width="6" height="18" class="v-a"/><rect x="8" y="14" width="18" height="6" class="v-a"/>`);
  if (kind === "house") return g(`<path d="M2 16 17 3 32 16v14H2z" class="v-l"/><rect x="13" y="20" width="8" height="10" class="v-c"/>`);
  if (kind === "car") return g(`<path d="M3 20l4-9h20l4 9v7H3z" class="v-l"/><circle cx="10" cy="28" r="4" class="v-i"/><circle cx="25" cy="28" r="4" class="v-i"/>`);
  return "";
}
const mark = (ok, x, y) => ok ? `<circle cx="${x}" cy="${y}" r="8" class="v-g"/><path d="M${x - 4} ${y}l3 3 5-6" stroke="#fff" stroke-width="2" fill="none"/>` : `<circle cx="${x}" cy="${y}" r="8" class="v-r"/><path d="M${x - 3.5} ${y - 3.5}l7 7M${x + 3.5} ${y - 3.5}l-7 7" stroke="#fff" stroke-width="2"/>`;
export function viz(kind, L, ctx = {}) {
  const en = L === "en", S = (w, h, body, label) => `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  if (kind === "debtTypes") {
    const items = [["card", en ? "Cards" : "Tarjetas", 1], ["loan", en ? "Loans" : "Préstamos", 1], ["medical", en ? "Medical" : "Médicas", 1], ["house", en ? "Mortgage" : "Hipoteca", 0], ["car", en ? "Car loan" : "Auto", 0]];
    return S(300, 96, items.map(([k, t, ok], i) => `${icon(k, 14 + i * 58, 14)}${mark(ok, 44 + i * 58, 14)}<text x="${31 + i * 58}" y="66" text-anchor="middle" class="v-t">${t}</text>`).join("") + `<text x="96" y="88" text-anchor="middle" class="v-tb">${en ? "Can enroll" : "Se pueden inscribir"}</text><text x="237" y="88" text-anchor="middle" class="v-tb">${en ? "Can't enroll" : "No se pueden"}</text><line x1="190" y1="10" x2="190" y2="76" stroke="var(--line)" stroke-width="2" stroke-dasharray="4 4"/>`, en ? "Cards, loans and medical bills can be enrolled; mortgages and car loans can't" : "Tarjetas, préstamos y facturas médicas se pueden inscribir; hipotecas y autos no");
  }
  if (kind === "softPull") return S(300, 100, `<rect x="20" y="12" width="70" height="78" rx="6" class="v-c" stroke="var(--soft)" stroke-width="1.5"/>${[26, 38, 50, 62].map(y => `<rect x="30" y="${y}" width="50" height="5" class="v-l"/>`).join("")}<circle cx="82" cy="70" r="16" class="v-s" stroke="var(--brand)" stroke-width="4"/><line x1="94" y1="82" x2="106" y2="94" stroke="var(--brand)" stroke-width="5" stroke-linecap="round"/>
    <path d="M160 78a50 50 0 0 1 100 0" fill="none" stroke="var(--line)" stroke-width="12"/><path d="M160 78a50 50 0 0 1 80-40" fill="none" stroke="var(--good)" stroke-width="12"/><text x="210" y="74" text-anchor="middle" class="v-tb" style="font-size:18px">650</text><text x="210" y="94" text-anchor="middle" class="v-t">${en ? "Score: no change" : "Puntaje: sin cambio"}</text>`, en ? "A soft credit check reads your report without changing your score" : "Una consulta suave lee tu reporte sin cambiar tu puntaje");
  if (kind === "budget") {
    const inc = Math.max(1, ctx.inc || 1), exp = Math.min(ctx.exp || 0, inc), left = inc - exp, W = 260, ew = Math.round(exp / inc * W);
    return S(300, 86, `<text x="20" y="16" class="v-t">${en ? "Income" : "Ingreso"} ${usd(inc)}</text><rect x="20" y="24" width="${W}" height="26" rx="6" class="v-l"/><rect x="20" y="24" width="${ew}" height="26" rx="6" class="v-bt"/><rect x="${20 + ew}" y="24" width="${W - ew}" height="26" rx="6" class="v-g"/><text x="${20 + ew / 2}" y="41" text-anchor="middle" class="v-t">${en ? "Expenses" : "Gastos"}</text>${W - ew > 50 ? `<text x="${20 + ew + (W - ew) / 2}" y="41" text-anchor="middle" class="v-tw">${usd(left)}</text>` : ""}<text x="20" y="72" class="v-tb">${en ? "Left over for your deposit:" : "Te queda para tu depósito:"} ${usd(left)}</text>`, en ? "Income minus expenses leaves room for your deposit" : "Ingreso menos gastos deja espacio para tu depósito");
  }
  if (kind === "compare") {
    const p = ctx.p, W = 200, cw = Math.round(p.estTotalCost / p.enrolledDebt * W);
    return S(300, 100, `<text x="10" y="22" class="v-t">${en ? "You owe today" : "Debes hoy"}</text><rect x="92" y="10" width="${W}" height="18" rx="4" class="v-i" opacity=".75"/><text x="${92 + W - 6}" y="23" text-anchor="end" class="v-tw">${usd(p.enrolledDebt)}</text>
      <text x="10" y="52" class="v-t">${en ? "Est. total paid" : "Total estimado"}</text><rect x="92" y="40" width="${cw}" height="18" rx="4" class="v-b"/><text x="${92 + cw - 6}" y="53" text-anchor="end" class="v-tw">${usd(p.estTotalCost)}</text>
      <rect x="${92 + cw}" y="40" width="${W - cw}" height="18" rx="4" class="v-at"/><text x="92" y="76" class="v-t">${en ? "Est. saved" : "Ahorro est."} ${usd(p.estSavings)}</text><text x="10" y="92" class="v-t">${en ? "Estimate only · includes program fees" : "Solo estimación · incluye tarifas"}</text>`, en ? "Debt today compared with the estimated total you would pay" : "Deuda de hoy comparada con el total estimado que pagarías");
  }
  if (kind === "feeTimeline") {
    const st = en ? [["Sign", "$0"], ["Save", "$0"], ["Settled", "✓"], ["Fee", "%"]] : [["Firmas", "$0"], ["Ahorras", "$0"], ["Liquidada", "✓"], ["Tarifa", "%"]];
    return S(300, 86, `<line x1="30" y1="30" x2="270" y2="30" stroke="var(--line)" stroke-width="4"/>` + st.map(([t, v], i) => { const x = 30 + i * 80, last = i === 3; return `<circle cx="${x}" cy="30" r="16" class="${last ? "v-a" : i === 2 ? "v-g" : "v-b"}"/><text x="${x}" y="35" text-anchor="middle" class="v-tw" style="font-size:12px">${v}</text><text x="${x}" y="64" text-anchor="middle" class="v-t">${t}</text>`; }).join(""), en ? "No fee when you sign or save; the fee comes only after a debt is settled" : "Sin tarifa al firmar ni al ahorrar; la tarifa llega solo después de liquidar una deuda");
  }
  if (kind === "months") {
    const m = ctx.p?.termMonths || 36, W = 250;
    return S(300, 80, `<rect x="25" y="22" width="${W}" height="16" rx="8" class="v-l"/><rect x="25" y="22" width="${W * 0.18}" height="16" rx="8" class="v-bt"/><circle cx="${25 + W * 0.18}" cy="30" r="7" class="v-g"/>${Array.from({ length: Math.floor(m / 12) + 1 }, (_, i) => `<line x1="${25 + i * 12 / m * W}" y1="42" x2="${25 + i * 12 / m * W}" y2="48" stroke="var(--soft)"/><text x="${25 + i * 12 / m * W}" y="60" text-anchor="middle" class="v-t">${i * 12}</text>`).join("")}<text x="25" y="16" class="v-t">${en ? "First settlement: usually a few months in" : "Primera liquidación: suele tardar unos meses"}</text><text x="${25 + W}" y="77" text-anchor="end" class="v-tb">${en ? `${m} months in total` : `${m} meses en total`}</text><text x="25" y="77" class="v-t">${en ? "months" : "meses"}</text>`, en ? `A ${m}-month plan` : `Un plan de ${m} meses`);
  }
  if (kind === "range") return S(300, 76, `<rect x="25" y="26" width="250" height="14" rx="7" class="v-l"/><rect x="85" y="26" width="120" height="14" rx="7" class="v-bt" stroke="var(--brand)" stroke-dasharray="4 3"/><text x="145" y="18" text-anchor="middle" class="v-tb">${en ? "Estimated range" : "Rango estimado"}</text><text x="25" y="58" class="v-t">${en ? "Less saved" : "Menos ahorro"}</text><text x="275" y="58" text-anchor="end" class="v-t">${en ? "More saved" : "Más ahorro"}</text><text x="150" y="72" text-anchor="middle" class="v-t">${en ? "Not a promise: depends on creditors and deposits" : "No es promesa: depende de acreedores y depósitos"}</text>`, en ? "Savings fall in a range, not a promised number" : "Los ahorros caen en un rango, no en una cifra prometida");
  if (kind === "moneyFlow") {
    const b = en ? ["Your bank", "Your account", "Creditors"] : ["Tu banco", "Tu cuenta", "Acreedores"], sub = en ? ["", "in your name", "when settled"] : ["", "a tu nombre", "al liquidar"];
    return S(300, 86, `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--soft)"/></marker></defs>` + b.map((t, i) => `<rect x="${4 + i * 100}" y="16" width="92" height="40" rx="8" class="${i === 1 ? "v-b" : "v-c"}" stroke="var(--line)"/><text x="${50 + i * 100}" y="40" text-anchor="middle" class="${i === 1 ? "v-tw" : "v-tb"}" style="font-size:11.5px">${t}</text><text x="${50 + i * 100}" y="74" text-anchor="middle" class="v-t">${sub[i]}</text>`).join("") + `<line x1="96" y1="36" x2="104" y2="36" stroke="var(--soft)" stroke-width="2" marker-end="url(#ar)"/><line x1="196" y1="36" x2="204" y2="36" stroke="var(--soft)" stroke-width="2" marker-end="url(#ar)"/>`, en ? "Money moves from your bank to your own account, then to creditors when a debt is settled" : "El dinero pasa de tu banco a tu cuenta y luego a los acreedores al liquidar");
  }
  if (kind === "scoreDown") return S(300, 80, `<line x1="30" y1="62" x2="280" y2="62" stroke="var(--line)" stroke-width="2"/><path d="M30 20 Q 90 22 130 44 T 280 58" class="v-sb" style="stroke:var(--bad)"/><circle cx="30" cy="20" r="4" class="v-i"/><text x="36" y="16" class="v-t">${en ? "Score today" : "Puntaje hoy"}</text><text x="280" y="76" text-anchor="end" class="v-t">${en ? "During the program" : "Durante el programa"}</text>`, en ? "Your credit score goes down during the program" : "Tu puntaje baja durante el programa");
  if (kind === "calls") return S(300, 80, `<rect x="40" y="10" width="34" height="58" rx="7" class="v-i" opacity=".8"/><rect x="45" y="18" width="24" height="38" rx="2" class="v-c"/><path d="M82 26q8 13 0 26M90 20q13 19 0 38" class="v-s" style="stroke:var(--accent)"/><rect x="170" y="18" width="70" height="46" rx="4" class="v-c" stroke="var(--soft)" stroke-width="1.5"/><text x="205" y="38" text-anchor="middle" class="v-tb">${en ? "NOTICE" : "AVISO"}</text><rect x="182" y="46" width="46" height="4" class="v-l"/><rect x="182" y="54" width="34" height="4" class="v-l"/><text x="150" y="78" text-anchor="middle" class="v-t">${en ? "Calls and legal notices may continue" : "Llamadas y avisos legales pueden continuar"}</text>`, en ? "Calls and legal notices may continue" : "Llamadas y avisos legales pueden continuar");
  if (kind === "tax") return S(300, 80, `<rect x="110" y="6" width="80" height="60" rx="4" class="v-c" stroke="var(--soft)" stroke-width="1.5"/><text x="150" y="26" text-anchor="middle" class="v-tb">1099-C</text><rect x="122" y="34" width="56" height="4" class="v-l"/><rect x="122" y="42" width="44" height="4" class="v-l"/><rect x="122" y="50" width="50" height="4" class="v-l"/><text x="150" y="78" text-anchor="middle" class="v-t">${en ? "A tax form may arrive for forgiven debt" : "Puede llegar un formulario de impuestos"}</text>`, en ? "A tax form may arrive for forgiven debt" : "Puede llegar un formulario de impuestos");
  if (kind === "exit") return S(300, 80, `<rect x="120" y="8" width="44" height="60" rx="3" class="v-bt" stroke="var(--brand)" stroke-width="2"/><circle cx="156" cy="40" r="3" class="v-b"/><path d="M172 38h36" class="v-sb"/><path d="M200 30l10 8-10 8" class="v-sb"/><text x="150" y="78" text-anchor="middle" class="v-t">${en ? "Leave any time, no penalty from Debtify" : "Sal cuando quieras, sin penalización de Debtify"}</text>`, en ? "You can leave any time" : "Puedes salir cuando quieras");
  if (kind === "journey") {
    // A warm "we walk you through it" scene: a guided path from "owe" to "debt-free",
    // Jay waving at the start, four milestone stops, a figure partway along.
    const stops = en ? ["Check", "Match", "Save", "Free"] : ["Revisa", "Conecta", "Ahorra", "Libre"];
    const px = [70, 160, 250, 338];
    const path = `M70 150 C 110 150 120 120 160 120 S 220 92 250 92 S 310 66 338 62`;
    const dots = px.map((x, i) => {
      const y = [150, 120, 92, 62][i], last = i === 3;
      return `<circle cx="${x}" cy="${y}" r="13" class="${last ? "v-g" : "v-b"}"/>${last ? `<path d="M${x - 5} ${y}l3.5 3.5 6-7" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : `<text x="${x}" y="${y + 4}" text-anchor="middle" class="v-tw" style="font-size:12px;font-weight:800">${i + 1}</text>`}<text x="${x}" y="${y - 22}" text-anchor="middle" class="v-tb" style="font-size:12.5px">${stops[i]}</text>`;
    }).join("");
    return S(400, 200, `
      <rect x="0" y="0" width="400" height="200" rx="20" class="v-bt"/>
      <path d="${path}" fill="none" stroke="var(--brand)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity=".65"/>
      ${dots}
      <g transform="translate(20,120)">
        <circle cx="16" cy="16" r="16" class="v-a"/>
        <circle cx="16" cy="13" r="7" class="v-skin"/>
        <path d="M6 14c0-6 4-8 10-8s9 3 8 9c-1.5-3-4-5-8-5s-7 2-8 4z" class="v-hair"/>
        <path d="M6 33c.6-7 5-10 10-10s9.4 3 10 10z" class="v-b"/>
        <text x="16" y="52" text-anchor="middle" class="v-tb" style="font-size:11px">${en ? "Jay" : "Jay"}</text>
      </g>
      <g transform="translate(236,70)"><circle cx="8" cy="8" r="8" class="v-at"/><circle cx="8" cy="6" r="3.4" class="v-skin"/><path d="M2.5 15c.4-3.4 2.6-5 5.5-5s5.1 1.6 5.5 5z" class="v-a"/></g>
      `, en ? "We walk you through every step from your first check to debt-free" : "Te acompañamos en cada paso, desde la primera revisión hasta estar libre de deudas");
  }
  return "";
}
// Security / trust badges — honest product facts rendered as compact icons.
export const SHIELD = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4l16 6v11c0 11-7 18-16 23-9-5-16-12-16-23V10z" class="v-bt" stroke="var(--brand)" stroke-width="2"/><path d="M16 24l6 6 11-13" stroke="var(--brand)" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const LOCK = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="21" width="28" height="20" rx="5" class="v-bt" stroke="var(--brand)" stroke-width="2"/><path d="M16 21v-5a8 8 0 0 1 16 0v5" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="30" r="3.2" class="v-b"/><rect x="22.6" y="31" width="2.8" height="6" rx="1.4" class="v-b"/></svg>';
export const SCALE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7v30" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="9" r="3.2" class="v-b"/><path d="M10 15h28" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/><path d="M10 15l-5 11a5 5 0 0 0 10 0z" class="v-bt" stroke="var(--brand)" stroke-width="2.4" stroke-linejoin="round"/><path d="M38 15l-5 11a5 5 0 0 0 10 0z" class="v-bt" stroke="var(--brand)" stroke-width="2.4" stroke-linejoin="round"/><path d="M15 39h18" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/></svg>';
export const EXITDOOR = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 9h14a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H12z" class="v-bt" stroke="var(--brand)" stroke-width="2.4" stroke-linejoin="round"/><circle cx="23" cy="24" r="2.6" class="v-b"/><path d="M33 24h10" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/><path d="M38 19l5 5-5 5" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const HOW_ICONS = [
  '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="6" width="28" height="36" rx="4" class="v-bt"/><circle cx="30" cy="30" r="8" fill="none" stroke="var(--brand)" stroke-width="3"/><path d="M36 36l6 6" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/><rect x="15" y="13" width="14" height="3" class="v-b"/><rect x="15" y="19" width="10" height="3" class="v-b"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="14" cy="24" r="8" class="v-bt"/><circle cx="34" cy="24" r="8" class="v-at"/><path d="M20 24h8" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><path d="M10 24l3 3 5-6" stroke="var(--brand)" stroke-width="2.5" fill="none"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="16" width="36" height="24" rx="5" class="v-b"/><rect x="6" y="22" width="36" height="4" class="v-i" opacity=".35"/><circle cx="34" cy="33" r="3" fill="#fff"/><path d="M16 12l8-6 8 6" stroke="var(--accent)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="8" width="32" height="32" rx="8" class="v-at"/><path d="M16 24l6 6 11-12" stroke="var(--good)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
];
export const CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" class="v-b"/><path d="M6 10l3 3 5-6" stroke="var(--on-brand)" stroke-width="2" fill="none"/></svg>';
export const LOGO = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--ink)"/><path d="M10 8h6c6 0 9 3.5 9 8s-3 8-9 8h-6z" fill="none" stroke="var(--accent)" stroke-width="3.2"/><path d="M13.5 16.5l2.5 2.5 4-5" fill="none" stroke="var(--paper)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
