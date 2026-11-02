import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { PERSONAS, T } from "../lib/copy.js";
import { A, F } from "../lib/flowCopy.js";
import { X2 } from "../lib/flowCopy2.js";
import { maskPhone, suggestDate } from "../lib/format.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function initialLang() {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "es" || q === "en") return q;
    const saved = localStorage.getItem("dfy_lang");
    if (saved === "es" || saved === "en") return saved;
    return (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "en";
  } catch {
    return "en";
  }
}

const rangeFor = (debt) => (debt < 7500 ? "lt_7500" : debt < 15000 ? "7500_15000" : debt < 25000 ? "15000_25000" : debt <= 50000 ? "25000_50000" : "gt_50000");

// Screen state that isn't saved on the server (form inputs, quiz picks, call transcript).
// Real visitors start blank and nothing is pre-checked; staff demo personas are prefilled.
export function freshUi(persona, demo) {
  const p = persona?.p || PERSONAS[0].p;
  return {
    debtRange: demo ? rangeFor(persona.debt) : null,
    state: demo ? persona.state : "",
    paymentStatus: demo ? persona.pay || "behind" : null,
    acct: demo ? { first: p.fn, last: p.ln, email: p.em, phone: maskPhone(p.ph), terms: true } : { first: "", last: "", email: "", phone: "", terms: false },
    otpCode: "",
    devCode: null,
    otpSentAt: 0,
    form: demo ? { dob: p.dob, ssn: p.ssn, address: p.a1, city: p.city, zip: p.zip, first: p.fn, last: p.ln, phone: p.ph } : { dob: "", ssn: "", address: "", city: "", zip: "" },
    consents: demo ? { fcra: true, esign: true, contact_partners: true } : { fcra: false, esign: false, contact_partners: false },
    consentsShownAt: 0,
    tls: null,
    added: [],
    addForm: { creditor: "", amount: "", type: "credit_card" },
    exclAck: false,
    net: demo ? String(persona.net || "") : "",
    housing: demo ? String(persona.housing || "") : "",
    other: demo ? String(persona.other || "") : "",
    acks: {},
    shownAt: {},
    answers: {},
    wrong: [],
    altChoice: null,
    altPick: null,
    signName: demo ? `${p.fn} ${p.ln}` : "",
    achOk: !!demo,
    draft: suggestDate(),
    callSlot: "now",
    call: [],
    calling: false,
    stage: -1,
    err: null,
    errField: null,
    busy: null,
    pending: false,
  };
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [meta, setMeta] = useState(null);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [demo, setDemo] = useState(false);
  const [lead, setLead] = useState(null);
  const [leadLoaded, setLeadLoaded] = useState(false);
  const [ui, setUiState] = useState(() => freshUi(PERSONAS[0], false));
  const [logs, setLogs] = useState([]);
  const [chat, setChat] = useState({ open: false, msgs: [], typing: false });
  const [registry, setRegistry] = useState({});
  const refs = useRef({});
  Object.assign(refs.current, { lang, lead, chat, user, demo });

  const x = useMemo(() => ({ ...T[lang], ...F[lang], ...X2[lang] }), [lang]);
  const a = A[lang];
  const step = lead ? lead.step : 1;

  const setUi = useCallback((patch) => setUiState((u) => ({ ...u, ...(typeof patch === "function" ? patch(u) : patch) })), []);
  const addLog = useCallback((tag, text) => setLogs((l) => [...l, { at: new Date().toISOString(), tag, text }].slice(-400)), []);
  const addEvents = useCallback((evs = []) => evs?.length && setLogs((l) => [...l, ...evs].slice(-400)), []);

  const loadLead = useCallback(async () => {
    try {
      const r = await api.currentLead();
      if (refs.current.demo) return; // the staff demo owns the flow right now
      const l = r.lead;
      // Only keep the lead in context if it's actively in-progress or enrolled.
      // A declined/diverted/abandoned lead should not show "My application" / "Continue" in the nav.
      // Note: outcome defaults to "in_progress" only when it's explicitly null/undefined AND
      // the status is a known active status — not just any missing field.
      const ACTIVE_STATUSES = ["STARTED", "QUALIFIED", "MATCHED", "SIGNED", "ENROLLED", "PAYMENT1_CLEARED", "PAYMENT2_CLEARED"];
      const isActive = l && ACTIVE_STATUSES.includes(l.status) && !["declined", "diverted", "referred_out", "abandoned"].includes(l.outcome);
      setLead(isActive ? l : null);
    } catch {
      setLead(null);
    }
    setLeadLoaded(true);
  }, []);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setMeta({ offline: true }));
    api.me().then((r) => setUser(r.user)).catch(() => setUser(null));
    loadLead();
  }, [loadLead]);

  // Consent + disclosure text with version hashes, per language. The screens render
  // exactly this, and send the hash back so the server can prove what was shown.
  useEffect(() => {
    if (registry[lang]) return;
    api.registry(lang).then((r) => setRegistry((g) => ({ ...g, [lang]: r }))).catch(() => {});
  }, [lang, registry]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem("dfy_lang", lang); } catch {}
  }, [lang]);

  // Runs an API call: busy label, inline error (with the field it belongs to), log events, store lead.
  const run = useCallback(
    async (busyLabel, fn) => {
      setUi({ busy: busyLabel || null, pending: true, err: null, errField: null });
      try {
        const r = await fn();
        if (r?.events) addEvents(r.events);
        if (r?.lead) setLead(r.lead);
        return r;
      } catch (e) {
        const L = refs.current.lang;
        const known = { BAD_DATE: T[L].badDate, BAD_SSN: T[L].needSsn };
        setUi({ err: known[e.code] || e.message || F[L].somethingWrong, errField: e.field || null, errCode: e.code });
        return null;
      } finally {
        setUi({ busy: null, pending: false });
      }
    },
    [setUi, addEvents]
  );

  const setLang = useCallback(
    (l) => {
      if (refs.current.lang === l) return;
      setLangState(l);
      const cur = refs.current.lead;
      if (cur && cur.step > 0) api.patchLead(cur.leadId, { lang: l }).then((r) => { addEvents(r.events); setLead(r.lead); }).catch(() => {});
    },
    [addEvents]
  );

  // ---------- staff auth (customers never sign in) ----------
  const login = useCallback(async (b) => {
    const r = await api.login(b);
    setUser(r.user);
    await loadLead();
    return r.user;
  }, [loadLead]);
  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    setUser(null);
    setLead(null);
    setUiState(freshUi(PERSONAS[0], false));
    setChat({ open: false, msgs: [], typing: false });
    loadLead(); // a visitor's own application (this browser) is still theirs
  }, [loadLead]);

  const restart = useCallback((p, isDemo, { abandon = true } = {}) => {
    const cur = refs.current.lead;
    if (abandon && cur && cur.step > 0 && cur.step < 9 && !cur.dropReason) api.abandon(cur.leadId).catch(() => {});
    setLead(null);
    setUiState(freshUi(p, isDemo));
    setChat({ open: false, msgs: [], typing: false });
    if (isDemo && p.lang) setLangState(p.lang);
    setLogs([{ at: new Date().toISOString(), tag: "EVENT", text: isDemo ? `new demo session · persona: ${p.name}` : "new application" }]);
  }, []);
  const choosePersona = useCallback((p) => { setPersona(p); restart(p, true); }, [restart]);

  // ---------- chat with Jay ----------
  const openChat = useCallback(() => setChat((c) => ({ ...c, open: true })), []);
  const closeChat = useCallback(() => setChat((c) => ({ ...c, open: false })), []);
  const sendChat = useCallback(
    async (q) => {
      q = String(q || "").trim().slice(0, 500);
      if (!q) return;
      const history = [...refs.current.chat.msgs, ["u", q]].slice(-12);
      setChat((c) => ({ ...c, open: true, msgs: [...c.msgs, ["u", q]], typing: true }));
      const L = refs.current.lang;
      const cur = refs.current.lead;
      let reply;
      try {
        const r = await api.chat({ leadId: cur?.leadId, lang: L, step: cur ? Math.max(0, cur.step) : 1, messages: history.map(([w, t]) => ({ role: w === "u" ? "user" : "assistant", content: t })) });
        addEvents(r.events);
        reply = r.reply;
      } catch (e) {
        reply = e.code === "RATE_LIMITED" ? e.message : T[L].notSure;
      }
      setChat((c) => ({ ...c, msgs: [...c.msgs, ["a", reply]], typing: false }));
    },
    [addEvents]
  );
  const askPerson = useCallback(async () => {
    const cur = refs.current.lead;
    if (cur) {
      try {
        const r = await api.person(cur.leadId);
        addEvents(r.events);
        setLead(r.lead);
      } catch {}
    }
    setChat((c) => ({ ...c, open: true, msgs: [...c.msgs, ["a", T[refs.current.lang].personOk]] }));
  }, [addEvents]);

  const value = useMemo(
    () => ({
      lang, setLang, x, a, user, reg: registry[lang] || null, setUser, login, logout, meta, persona, choosePersona, demo, setDemo,
      lead, setLead, leadLoaded, loadLead, step, ui, setUi, logs, addLog, addEvents, run, restart,
      chat, openChat, closeChat, sendChat, askPerson,
    }),
    [lang, setLang, x, a, user, registry, login, logout, meta, persona, choosePersona, demo, lead, leadLoaded, loadLead, step, ui, setUi, logs, addLog, addEvents, run, restart, chat, openChat, closeChat, sendChat, askPerson]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
