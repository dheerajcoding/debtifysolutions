// Spanish versions of the consent and disclosure registry text.
// DRAFT for native-speaker and counsel review. Each language is hashed separately,
// so the record proves exactly which words (and which language) a consumer saw.
import { CONSENTS } from "./consents.js";
import { DISCLOSURES } from "./disclosures.js";

export const CONSENTS_ES = {
  fcra: {
    plain: "Revisar mi reporte de crédito",
    legal: "Autorizo a Debtify a obtener mi reporte de consumidor de una o más agencias de crédito para evaluarme para un programa de liquidación de deudas. Es una consulta suave y no afectará mi puntaje de crédito.",
  },
  esign: {
    plain: "Usar documentos y firmas electrónicas",
    legal: "Acepto recibir documentos de forma electrónica y firmarlos electrónicamente. Puedo retirar este consentimiento en cualquier momento.",
  },
  contact_partners: {
    plain: "Contactarme, incluso por proveedores asociados",
    legal: "Debtify y los proveedores de alivio de deudas de nuestra lista publicada de socios pueden llamarme o enviarme mensajes, incluso con tecnología automatizada, al número que di. No es obligatorio para usar Debtify. Responde STOP para dejar de recibirlos.",
  },
};

export const DISCLOSURES_ES = {
  advance_fee: {
    title: "No pagas nada hasta que se liquide una deuda",
    body: [
      "No se cobra ninguna tarifa hasta que pasen estas tres cosas:",
      "1. Una de tus deudas se haya liquidado",
      "2. Hayas aceptado esa liquidación",
      "3. Hayas hecho un pago de esa liquidación",
      "El dinero que depositas cada mes es tuyo, está en tu propia cuenta y se usa para pagar las liquidaciones. No es un pago para nosotros.",
    ],
    acknowledgement: "Entiendo que no pago ninguna tarifa hasta que se liquide una deuda y haya hecho un pago.",
  },
  dedicated_account: {
    title: "El dinero sigue siendo tuyo",
    body: [
      "Tu cuenta dedicada se abre a tu nombre en un banco asegurado por la FDIC y la maneja un administrador independiente que no es de Debtify ni tiene relación financiera con Debtify.",
      "Quién es dueño del dinero: tú. Puedes retirarlo cuando quieras. Puedes salir del programa en cualquier momento sin penalización y te devuelven tu saldo.",
    ],
    acknowledgement: "Entiendo que la cuenta es mía, que yo la controlo y que puedo salir cuando quiera sin penalización.",
  },
  credit_impact: {
    title: "Esto dañará tu puntaje de crédito",
    body: ["La liquidación funciona dejando de pagar y negociando. Eso hace que tus cuentas queden atrasadas. Tu puntaje bajará y puede tardar años en recuperarse."],
    acknowledgement: "",
  },
  creditor_contact: {
    title: "Los acreedores pueden seguir llamando y pueden demandarte",
    body: [
      "Mientras ahorras para las liquidaciones, tus acreedores pueden seguir contactándote. Algunos pueden presentar una demanda. Estar en un programa no lo impide.",
      "Los intereses y cargos por atraso suelen seguir sumándose hasta que se liquida la cuenta, así que el saldo puede crecer antes de bajar.",
    ],
    acknowledgement: "Entiendo que los acreedores pueden seguir contactándome, pueden demandarme y que los cargos e intereses pueden seguir sumándose.",
  },
  tax: {
    title: "La deuda perdonada puede pagar impuestos",
    body: [
      "Si un acreedor perdona parte de lo que debes, el IRS puede considerar esa cantidad como ingreso. Podrías recibir un formulario 1099-C y deber impuestos.",
      "Hay excepciones, como la insolvencia. No podemos darte asesoría de impuestos. Habla con un profesional de impuestos sobre tu caso.",
    ],
    acknowledgement: "Entiendo que la deuda perdonada puede pagar impuestos y que Debtify no da asesoría de impuestos.",
  },
};

/** Consent text as rendered in a language. */
export function consentText(key, lang = "en") {
  const c = CONSENTS.find((k) => k.key === key);
  if (!c) return null;
  const t = lang === "es" ? CONSENTS_ES[key] : c;
  return { key, required: c.required, plain: t.plain, legal: t.legal };
}

/** Disclosure as rendered in a language (version stays the registry version). */
export function disclosureText(key, lang = "en") {
  const d = DISCLOSURES[key];
  if (!d) return null;
  const t = lang === "es" ? DISCLOSURES_ES[key] : d;
  return { key, version: d.version, gate: d.gate, tsr: d.tsr || null, title: t.title, body: t.body, acknowledgement: t.acknowledgement };
}
