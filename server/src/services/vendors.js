// Simulated third-party vendors for staging: identity check, soft credit pull,
// signing, the AI verification call. Replace with real integrations
// (credit reseller, Dropbox Sign, account administrator, voice vendor).

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// SSN ending 0000 fails, 2222 needs review, anything else passes.
export async function idCheck(ssn) {
  await wait(250);
  const l4 = ssn.slice(-4);
  return l4 === "0000" ? "FAIL" : l4 === "2222" ? "REVIEW" : "PASS";
}

const line = (creditor, type, dpd, balance, extra = {}) => ({ creditor, type, dpd, balance, ...extra });

// DEMO: what the bureau returns. SSN ending 1111 = no file, 3333 = thin file.
// Payment status "current" returns the same accounts with nothing past due.
export async function softPull(ssn, paymentStatus = "behind") {
  await wait(300);
  const l4 = ssn.slice(-4);
  if (l4 === "1111") return null;
  let rows;
  if (l4 === "3333") rows = [line("Capital One", "credit_card", 45, 3200), line("Memorial Hospital", "medical", 120, 900)];
  else rows = sampleFile();
  if (paymentStatus === "current") rows = rows.map((r) => (["auto", "federal_student"].includes(r.type) ? r : { ...r, dpd: 0 }));
  return rows;
}

/** The standard sample credit file used by most test SSNs. */
export function sampleFile() {
  return [
    line("Capital One", "credit_card", 47, 6240),
    line("Chase", "credit_card", 62, 4815),
    line("Citi", "credit_card", 31, 3190),
    line("Synchrony", "store_card", 90, 2420),
    line("LendingClub", "personal_loan", 38, 4720),
    line("Memorial Hospital", "medical", 120, 2185),
    line("Northwind Services LLC", "unknown", 30, 1250),
    line("Toyota Financial", "auto", 0, 11300),
    line("Nelnet", "federal_student", 0, 18400),
  ];
}

const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");

// Scripted verification call (VERIFICATION_SCRIPT_V4). A phone ending in 99 simulates
// a consumer who was promised a result, which fails the call and routes it to review.
export function verificationCall({ first, phone, quote, lang }) {
  const human = String(phone || "").endsWith("99");
  const es = lang === "es";
  const pct = Math.round(quote.feePct * 100);
  const lines = es
    ? [
        ["IA", `Hola ${first}, soy la asistente de verificación en una línea grabada. Esta llamada se graba para confirmar lo que aceptaste. ¿Puedes confirmar tu fecha de nacimiento?`],
        ["Cliente", "Sí."],
        ["IA", `Inscribiste ${usd(quote.enrolledDebt)} en deudas con ${quote.providerName}. Tu depósito es de ${usd(quote.monthlyDeposit)} al mes, durante unos ${quote.termMonths[0]} a ${quote.termMonths[1]} meses. La tarifa es el ${pct}% de la deuda inscrita, solo después de liquidar. ¿Correcto?`],
        ["Cliente", human ? "Espera, me dijeron que mi deuda desaparecería en un año." : "Sí, correcto."],
        ["IA", human ? "Quiero que recibas la respuesta correcta. Detengo la llamada y una persona de nuestro equipo te contactará." : "¿Entiendes que tu puntaje de crédito bajará y que los acreedores aún pueden demandarte?"],
      ]
    : [
        ["AI", `Hi ${first}, this is the verification assistant on a recorded line. This call is recorded so we can confirm what you agreed to. Can you confirm your date of birth?`],
        ["Client", "Sure."],
        ["AI", `You enrolled ${usd(quote.enrolledDebt)} of debt with ${quote.providerName}. Your deposit is ${usd(quote.monthlyDeposit)} a month for about ${quote.termMonths[0]}–${quote.termMonths[1]} months. The fee is ${pct}% of enrolled debt, only after each debt settles. Is that right?`],
        ["Client", human ? "Wait, the guy online said my debt would be gone in a year?" : "Yes, that's right."],
        ["AI", human ? "I want to make sure you get the right answer. I'm stopping here and a member of our team will follow up." : "Do you understand your credit score will drop and creditors may still sue?"],
      ];
  if (!human) {
    lines.push(es ? ["Cliente", "Sí, lo entiendo."] : ["Client", "Yes, I understand."]);
    lines.push(es ? ["IA", "Gracias. Puedes cancelar cuando quieras. ¡Bienvenido!"] : ["AI", "Thanks. You can cancel any time. Welcome aboard."]);
  }
  const points = { identity: true, accounts_and_amount: true, payment_and_date: !human, credit_impact_understood: !human };
  return { result: human ? "FAILED" : "PASSED", points, lines: lines.map(([who, text]) => ({ who, text })) };
}
