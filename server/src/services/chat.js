import { STEP_NAMES } from "../../../shared/config/flow.js";

// Jay, the enrollment guide. Answers from approved facts only.
// Uses Claude when ANTHROPIC_API_KEY is set; otherwise falls back to the approved FAQ.

const FAQ = [
  [/fee|cost|charge|price|tarifa|cuesta|cobra/i, { en: "No fee is charged until a debt is settled and you've made a payment on it. The fee is a percentage of the debt you enroll, shown before you sign.", es: "No se cobra ninguna tarifa hasta que se liquide una deuda y hayas hecho un pago. La tarifa es un porcentaje de la deuda inscrita y la ves antes de firmar." }],
  [/credit|score|crédito|puntaje/i, { en: "Checking uses a soft inquiry, so it won't affect your score. During the program your score usually drops, because you stop paying creditors while you save.", es: "La revisión usa una consulta suave, así que no afecta tu puntaje. Durante el programa tu puntaje suele bajar, porque dejas de pagar a los acreedores mientras ahorras." }],
  [/ssn|social security|seguro social/i, { en: "Your SSN finds the right credit file and confirms your identity. It's used only for those checks and the full number is never stored.", es: "Tu número de Seguro Social encuentra el historial correcto y confirma tu identidad. Solo se usa para eso y nunca se guarda completo." }],
  [/sue|lawsuit|call|demand|llamar|llamadas/i, { en: 'Creditors may keep calling and may sue while debts are negotiated. For legal questions, tap "Talk to a person".', es: 'Los acreedores pueden seguir llamando y demandarte mientras se negocian las deudas. Para preguntas legales, toca "Hablar con una persona".' }],
  [/how long|month|time|cuánto tiempo|meses/i, { en: "Most programs take 24 to 48 months. Your estimate is on the program screen.", es: "La mayoría de los programas duran de 24 a 48 meses. Tu estimación aparece en la pantalla del programa." }],
  [/miss|falta|atras/i, { en: 'Missed deposits slow down settlements. If money is tight, tap "Talk to a person" before a deposit is due.', es: 'Si faltan depósitos, las liquidaciones se retrasan. Si el dinero está justo, toca "Hablar con una persona" antes de la fecha del depósito.' }],
  [/loan|préstamo/i, { en: "No, it isn't a loan. You save in your own account and the program company negotiates with your creditors.", es: "No, no es un préstamo. Ahorras en tu propia cuenta y la empresa del programa negocia con tus acreedores." }],
  [/include|car|auto|mortgage|hipoteca|incluir/i, { en: "Credit cards, personal loans, medical bills and collections can usually be enrolled. Mortgages, car loans and other secured loans can't.", es: "Normalmente se pueden inscribir tarjetas, préstamos personales, facturas médicas y cobranzas. Hipotecas, préstamos de auto y otros préstamos con garantía no." }],
  [/cancel|money back|recuperar/i, { en: "You can cancel any time. The money in your dedicated account is yours, less any account fees.", es: "Puedes cancelar cuando quieras. El dinero de tu cuenta dedicada es tuyo, menos cualquier cargo de la cuenta." }],
  [/guarantee|garantiz/i, { en: "No. Savings are estimates and depend on your creditors and on keeping up your deposits.", es: "No. Los ahorros son estimaciones y dependen de tus acreedores y de que mantengas tus depósitos." }],
  [/company|empresa|who/i, { en: "Your program is run by a licensed debt settlement company, named on your program screen and your agreement.", es: "Tu programa lo maneja una empresa de liquidación de deudas con licencia, que aparece en la pantalla del programa y en tu contrato." }],
  [/date|fecha/i, { en: 'For date changes, tap "Talk to a person" and our team will help.', es: 'Para cambiar la fecha, toca "Hablar con una persona" y nuestro equipo te ayudará.' }],
  [/person|persona|next|sigue|work|funciona/i, { en: "You save each month in your own account. As it builds, the program company negotiates with each creditor. You can ask for a person any time.", es: "Ahorras cada mes en tu propia cuenta. A medida que crece, la empresa negocia con cada acreedor. Puedes pedir hablar con una persona cuando quieras." }],
];

const NOT_SURE = {
  en: 'I\'m not sure about that one. Tap "Talk to a person" and someone will call you during US business hours.',
  es: 'No estoy seguro de eso. Toca "Hablar con una persona" y alguien te llamará en horario hábil de EE. UU.',
};

const DISTRESS = /(kill myself|suicid|end my life|hurt myself|can'?t go on|quitarme la vida|matarme|no puedo más)/i;
const DISTRESS_REPLY = {
  en: 'I\'m really sorry you\'re going through this. If you\'re in danger or thinking about harming yourself, please call or text 988 now (US). Tap "Talk to a person" and someone from our team will call you.',
  es: 'Siento mucho lo que estás pasando. Si estás en peligro o piensas hacerte daño, llama o envía un mensaje al 988 ahora (EE. UU.). Toca "Hablar con una persona" y alguien de nuestro equipo te llamará.',
};

// Output guardrail: replies that make forbidden promises are replaced by the FAQ answer.
const FORBIDDEN = [/guarantee(?!d)/i, /cut your debt in half/i, /stop (all )?(the )?(collection )?calls/i, /won'?t (be )?sue/i, /no impact on your credit/i, /government (program|backed)/i, /garantizamos/i, /reducir(á|emos) tu deuda a la mitad/i];

const APPROVED = `- Debtify helps you see if you qualify for a debt settlement program run by a licensed partner company. The partner holds your agreement and negotiates with creditors.
- Checking uses a soft credit inquiry. It does not affect your credit score. The SSN is used only for the credit and identity check and is never stored in full.
- No program fee is charged until a debt is settled and at least one payment is made under that settlement. The fee is a percentage of the debt you enroll; the exact percentage is shown before you sign.
- It is not a loan. You make one monthly deposit into a dedicated account in your own name. You own it and can withdraw at any time, less account fees.
- Programs usually take 24 to 48 months. Savings are estimates and are not guaranteed. Missed deposits slow settlements.
- Your credit score will usually drop, because you stop paying creditors while you save.
- Creditors may keep calling, add fees and interest, and may sue.
- Forgiven debt may be taxable; a tax professional can advise you.
- Usually enrollable: credit cards, unsecured personal loans, medical bills, collections. Not enrollable: mortgages, car loans, secured loans, federal student loans, taxes, child support.
- You can cancel at any time. For changes like deposit dates, or anything else, use the "Talk to a person" button.`;

const systemPrompt = (lang, step) =>
  `You are Jay, Debtify's enrollment guide for US consumers considering a debt settlement program. Reply ONLY in ${
    lang === "es" ? 'Spanish (US), warm and simple, and call the button "Hablar con una persona"' : 'English, and call the button "Talk to a person"'
  }. Answer ONLY from APPROVED_FACTS. If the answer is not there, say you are not sure and suggest the person button. Never promise savings, a settlement amount, a timeline, or that creditors will stop calling or suing. Never give legal or tax advice; suggest a licensed professional and the person button. When fees come up, say no fee is charged until a debt is settled and fees are a percentage of enrolled debt. The person is on screen ${step}: ${
    STEP_NAMES[step] || "decline"
  }. Keep answers under 70 words, plain words, no markdown.\n\nAPPROVED_FACTS:\n${APPROVED}`;

async function askClaude(messages, lang, step) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 300,
        system: systemPrompt(lang, step),
        messages: messages.slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: String(m.content).slice(0, 500) })),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.content || []).map((c) => c.text || "").join("").trim() || null;
  } catch {
    return null;
  }
}

export async function answer({ messages, lang = "en", step = 1 }) {
  const L = lang === "es" ? "es" : "en";
  // Chat history must start with a user turn for the API.
  const turns = messages.filter((m, i) => !(i === 0 && m.role !== "user"));
  const q = String(turns.filter((m) => m.role === "user").pop()?.content || "");
  const events = [];
  if (DISTRESS.test(q)) {
    events.push(["GUARD", "distress detected → care response + 988"]);
    return { reply: DISTRESS_REPLY[L], source: "care", events };
  }
  const ai = await askClaude(turns, L, step);
  if (ai) {
    if (FORBIDDEN.some((r) => r.test(ai))) events.push(["GUARD", "Claude reply blocked by output guardrail → approved FAQ"]);
    else {
      events.push(["AI", `Claude answered in ${L === "es" ? "Spanish" : "English"} from approved facts · guardrail passed`]);
      return { reply: ai, source: "claude", events };
    }
  }
  const hit = FAQ.find(([r]) => r.test(q));
  events.push(["AI", hit ? "answered from approved FAQ" : "no FAQ match → suggested a person"]);
  return { reply: hit ? hit[1][L] : NOT_SURE[L], source: "faq", events };
}
