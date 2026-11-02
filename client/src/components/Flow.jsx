import { useEffect, useMemo, useRef } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../lib/api.js";
import { G } from "../lib/flowCopy.js";
import { digits, isEmail } from "../lib/format.js";
import { Screen } from "./Screens.jsx";
import Chat from "./Chat.jsx";
import { CLOSED_STATES } from "@shared/config/providers.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MSG = {
  en: { debtRange: "Choose how much you owe", state: "Choose your state", paymentStatus: "Choose where you are with payments", first: "Enter your first name", last: "Enter your last name", email: "Enter a valid email address", phone: "Enter a 10-digit mobile number", password: "Use at least 8 characters with letters and a number", terms: "Please agree to the Terms and Privacy Policy", dob: "Enter your date of birth", ssn: "Enter all 9 digits", address: "Enter your street address", city: "Enter your city", zip: "Enter a 5-digit ZIP code", consent: "Please check this box to continue", income: "Enter your monthly take-home pay", fix: "Please fix the highlighted fields.", ack: "Please tick this box to confirm", choice: "Choose one to continue", pick: "Pick the option you'd like", addCreditor: "Enter the creditor", addAmount: "Enter the amount", sig: "Type your full name to sign", ach: "Please authorise the deposits" },
  es: { debtRange: "Elige cuánto debes", state: "Elige tu estado", paymentStatus: "Elige cómo vas con tus pagos", first: "Escribe tu nombre", last: "Escribe tu apellido", email: "Escribe un correo válido", phone: "Escribe un celular de 10 dígitos", password: "Usa al menos 8 caracteres con letras y un número", terms: "Acepta los Términos y la Política de privacidad", dob: "Escribe tu fecha de nacimiento", ssn: "Escribe los 9 dígitos", address: "Escribe tu dirección", city: "Escribe tu ciudad", zip: "Escribe un código postal de 5 dígitos", consent: "Marca esta casilla para continuar", income: "Escribe tu ingreso mensual neto", fix: "Corrige los campos marcados.", ack: "Marca esta casilla para confirmar", choice: "Elige una opción para continuar", pick: "Elige la opción que prefieras", addCreditor: "Escribe el acreedor", addAmount: "Escribe la cantidad", sig: "Escribe tu nombre completo para firmar", ach: "Autoriza los depósitos" },
};

// Every button in the application maps to one of these actions.
function useActions() {
  const app = useApp();
  const ref = useRef(app);
  ref.current = app;

  return useMemo(() => {
    const A = () => ref.current;
    const id = () => A().lead?.leadId;
    const U = () => A().ui;
    const m = () => MSG[A().lang];
    // Shows field errors; returns true when the form is valid.
    const check = (errs) => {
      const bad = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
      A().setUi({ fieldErrs: bad, err: Object.keys(bad).length ? m().fix : null, errField: null });
      return !Object.keys(bad).length;
    };
    return {
      listen: (step) => {
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(G[step][A().lang].join(" "));
          u.lang = A().lang === "es" ? "es-US" : "en-US";
          speechSynthesis.speak(u);
        } catch {}
      },
      askq: (q) => A().sendChat(q),
      clarity: (pid, v) => A().run(null, () => api.patchLead(id(), { clarity: { [pid]: v } })),
      back: (n) => A().run(null, () => api.patchLead(id(), { step: n })),
      s1: () => {
        const u = U();
        const L = A().lang;
        const stateErr = !u.state ? m().state
          : CLOSED_STATES.includes(u.state) ? (L === "es" ? "No tenemos programas con licencia en este estado todavía." : "We don't have a licensed program in this state yet.") : null;
        const debtErr = !u.debtRange ? m().debtRange
          : u.debtRange === "lt_7500" ? (L === "es" ? "El mínimo para nuestros programas es $7,500." : "Our programs require at least $7,500 in debt.") : null;
        if (!check({ debtRange: debtErr, state: stateErr, paymentStatus: u.paymentStatus == null && m().paymentStatus })) return;
        return A().run(null, () => api.createLead({ debtRange: u.debtRange, state: u.state, paymentStatus: u.paymentStatus, lang: A().lang, source: A().demo ? "demo" : "web", persona: A().demo ? A().persona.id : undefined }));
      },
      // ---- 2: contact details (no account or password)
      contact: () => {
        const f = U().acct;
        const ok = check({
          first: !f.first.trim() && m().first, last: !f.last.trim() && m().last, email: !isEmail(f.email) && m().email,
          phone: digits(f.phone).length !== 10 && m().phone, terms: !f.terms && m().terms,
        });
        if (!ok) return;
        return A().run(null, () => api.contact(id(), { first: f.first.trim(), last: f.last.trim(), email: f.email.trim(), phone: digits(f.phone), terms: true }));
      },
      // ---- 3: OTP, identity, consents, bureau pull
      otpSend: async () => {
        const r = await A().run(null, () => api.otpSend(id(), A().demo ? { phone: U().form.phone } : {}));
        if (r) A().setUi({ devCode: r.devCode || null, otpCode: "" });
      },
      otpVerify: () => {
        if (!/^\d{6}$/.test(U().otpCode)) return A().setUi({ fieldErrs: { code: A().x.otpLabel }, err: null });
        return A().run(null, () => api.otpVerify(id(), U().otpCode)).then((r) => r && A().setUi({ devCode: null, consentsShownAt: Date.now() }));
      },
      s3: async () => {
        const f = U().form, c = U().consents, mm = m();
        const errs = { dob: !f.dob && mm.dob, ssn: digits(f.ssn).length !== 9 && mm.ssn, address: f.address.trim().length < 3 && mm.address, city: f.city.trim().length < 2 && mm.city, zip: digits(f.zip).length !== 5 && mm.zip, fcra: !c.fcra && mm.consent, esign: !c.esign && mm.consent };
        if (!check(errs)) return;
        // Show the bureau stages while the pull runs (S10).
        A().setUi({ stage: 0 });
        const tick = setInterval(() => A().setUi((u) => ({ stage: Math.min(3, u.stage + 1) })), 700);
        const [r] = await Promise.all([
          A().run(null, () => api.identity(id(), { dob: f.dob, ssn: digits(f.ssn), address: f.address, city: f.city, zip: digits(f.zip), consents: c, renderedAt: U().consentsShownAt || Date.now() - 1000, ...(A().demo ? { first: f.first, last: f.last } : {}) })),
          wait(2600),
        ]);
        clearInterval(tick);
        A().setUi({ stage: -1, tls: null });
        return r;
      },
      // ---- 4: debts
      pick: (tlId, checked) => A().setUi((u) => ({ tls: (u.tls || A().lead.tradelines).map((t) => (t.tlId === tlId ? { ...t, selected: checked } : t)) })),
      confirm: (tlId, v) => A().setUi((u) => ({ tls: (u.tls || A().lead.tradelines).map((t) => (t.tlId === tlId ? { ...t, confirmed: v || null, enrollable: !!v, selected: !!v } : t)) })),
      balance: (tlId, v) => A().setUi((u) => ({ tls: (u.tls || A().lead.tradelines).map((t) => (t.tlId === tlId ? { ...t, balanceConfirmed: digits(v) ? +digits(v) : null } : t)) })),
      addDebt: () => {
        const f = U().addForm;
        if (!check({ addCreditor: !f.creditor.trim() && m().addCreditor, addAmount: !(+f.amount > 0) && m().addAmount })) return;
        A().setUi((u) => ({ added: [...u.added, { creditor: f.creditor.trim(), amount: +f.amount, type: f.type }].slice(0, 15), addForm: { creditor: "", amount: "", type: "credit_card" }, err: null }));
      },
      s4: async () => {
        const tls = U().tls || A().lead.tradelines;
        const hasExcl = tls.some((t) => t.excludedReason);
        if (hasExcl && !U().exclAck) return check({ exclusionsAck: m().ack });
        const r = await A().run(null, () => api.debts(id(), {
          tradelines: tls.filter((t) => t.source !== "consumer").map((t) => ({ tlId: t.tlId, selected: !!t.selected, confirmed: t.confirmed || null, balanceConfirmed: t.balanceConfirmed ?? null })),
          added: U().added, exclusionsAck: !!U().exclAck, advance: true,
        }));
        if (r) A().setUi({ tls: null, added: [] });
      },
      // ---- 5: budget + bank link + underwriting
      bank1: () => A().run(null, () => api.budget(id(), { netMonthly: +digits(U().net) || 0, housing: +digits(U().housing) || 0, obligations: +digits(U().other) || 0, bankLinked: true, linkOnly: true })),
      s5: () => {
        if (!check({ netMonthly: !(+digits(U().net) > 0) && m().income })) return;
        return A().run(A().x.finding, () => api.budget(id(), { netMonthly: +digits(U().net), housing: +digits(U().housing) || 0, obligations: +digits(U().other) || 0, bankLinked: !!A().lead.bankLinked }));
      },
      // ---- 6: plan + disclosures (hash + dwell go back as evidence)
      s6: () => {
        const u = U(), reg = A().reg;
        if (!check({ quote: !u.acks.quote && m().ack, advance_fee: !u.acks.advance_fee && m().ack, dedicated_account: !u.acks.dedicated_account && m().ack })) return;
        const ack = (k) => ({ hash: reg.disclosures.find((d) => d.key === k).hash, dwellMs: Math.max(0, Date.now() - (u.shownAt[k] || Date.now())) });
        return A().run(null, () => api.acknowledge(id(), { quote: true, advance_fee: ack("advance_fee"), dedicated_account: ack("dedicated_account") }));
      },
      // ---- 7: comprehension, then creditor + tax + alternatives
      ans: (qid, i) => A().setUi((u) => ({ answers: { ...u.answers, [qid]: i } })),
      s7a: async () => {
        const r = await A().run(null, () => api.comprehension(id(), U().answers));
        if (r) A().setUi({ wrong: r.wrong || [], answers: r.correct ? U().answers : {} });
      },
      s7b: () => {
        const u = U(), reg = A().reg;
        const errs = { creditor_contact: !u.acks.creditor_contact && m().ack, tax: !u.acks.tax && m().ack, choice: !u.altChoice && m().choice };
        if (u.altChoice === "other" && !u.altPick) errs.choice = m().pick;
        if (!check(errs)) return;
        const ack = (k) => ({ hash: reg.disclosures.find((d) => d.key === k).hash, dwellMs: Math.max(0, Date.now() - (u.shownAt[k] || Date.now())) });
        return A().run(null, () => api.risks(id(), { creditor_contact: ack("creditor_contact"), tax: ack("tax"), choice: u.altChoice === "settlement" ? "settlement" : u.altPick }));
      },
      // ---- 8: sign + dedicated account
      bank2: () => A().run(null, () => api.linkDeposits(id())),
      sign: async () => {
        const u = U();
        const d = new Date(u.draft + "T12:00:00Z").getTime();
        const errs = { draftDate: (!d || d < Date.now() + 3 * 864e5 - 432e5 || d > Date.now() + 45 * 864e5) && A().x.badDate, signatureName: !u.signName.trim() && m().sig, achAuthorized: !u.achOk && m().ach };
        if (!check(errs)) return;
        return A().run(null, () => api.enroll(id(), { accept: true, draftDate: u.draft, signatureName: u.signName.trim(), achAuthorized: true }));
      },
      nosign: () => A().run(null, () => api.enroll(id(), { accept: false })),
      // ---- 9: book or take the verification call
      call: async () => {
        const slot = U().callSlot;
        if (slot !== "now") return A().run(null, () => api.call(id(), slot));
        A().setUi({ calling: true, call: [], err: null });
        try {
          const r = await api.call(id(), "now");
          A().addEvents(r.events.slice(0, 1));
          for (const line of r.call.lines) {
            await wait(600);
            A().setUi((u) => ({ call: [...u.call, line] }));
          }
          await wait(500);
          A().addEvents(r.events.slice(1));
          A().setLead(r.lead);
        } catch (e) {
          A().setUi({ err: e.message });
        }
        A().setUi({ calling: false });
      },
      backend: (type) => A().run(null, () => api.backendEvent(id(), type)),
      restart: () => A().restart(A().persona, A().demo),
    };
  }, []);
}

// The application. `framed` shows it inside a phone frame (staff console demo).
export default function Flow({ framed = false }) {
  const app = useApp();
  const { lead, ui, setUi, x, a, lang, user, demo, reg } = app;
  const act = useActions();
  const screenRef = useRef(null);
  const step = lead ? lead.step : 1;

  useEffect(() => {
    if (framed && screenRef.current) screenRef.current.scrollTop = 0;
    if (!framed) window.scrollTo(0, 0);
    setUi({ err: null, errField: null, fieldErrs: {} });
  }, [step, lead?.leadId, framed, setUi]);

  const props = { x, a, lang, lead: lead || { step: 1, clarity: {} }, ui, setUi, act, step, user, demo, reg };
  const body = (
    <div className="app">
      <Screen {...props} />
    </div>
  );
  if (!framed)
    return (
      <div className="flow-main">
        {body}
        <Chat />
      </div>
    );
  return (
    <div className="phone">
      <div className="screen" ref={screenRef}>
        {body}
        <Chat />
      </div>
    </div>
  );
}
