import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DECL, QUIZ } from "../lib/copy.js";
import { G } from "../lib/flowCopy.js";
import { AVATAR, viz } from "../lib/viz.js";
import { fmtDate, maskMoney, maskPhone, maskSsn, usd, digits } from "../lib/format.js";
import { Alert, Check, Field, Html, Spinner } from "./ui.jsx";
import { InstallCoach } from "./InstallCoach.jsx";
import { US_STATES, CLOSED_STATES } from "@shared/config/providers.js";
import { ALTERNATIVES, ALTERNATIVE_LINKS, BUREAU_STAGES, COMPENSATION_DISCLOSURE, DOCUMENT_PACK, ACCOUNT_RIGHTS, CALL_SLOTS, REFERRAL_HREFS, OTP, PUSH_TYPES, DEBT_RANGES } from "@shared/config/flow.js";
import { IRS_1099C_URL } from "@shared/config/constants.js";

const PAY_IDS = ["current", "behind", "not_paying", "collections"];
const CLARITY_ID = { advance_fee: "fee", dedicated_account: "account", credit_impact: "credit", creditor_contact: "collections", tax: "tax" };
const VIZ_FOR = { advance_fee: "feeTimeline", dedicated_account: "moneyFlow", credit_impact: "scoreDown", creditor_contact: "calls", tax: "tax" };

const fe = (ui, field) => ui.fieldErrs?.[field] || (ui.errField === field ? ui.err : null);
const formErr = (ui) => (ui.err && !ui.errField ? ui.err : null);
const pct = (v) => Math.round(v * 100);

export function GuideTip({ step, lang, x, act }) {
  const g = G[step];
  if (!g) return null;
  const [say, why] = g[lang];
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  return (
    <div className="tip">
      <Html as="span" html={AVATAR} className="tip-av" />
      <div className="tip-body">
        <p><b>{x.guideRole.split(" · ")[0]}:</b> {say}</p>
        <div className="tip-actions">
          <details><summary>{x.why}</summary><p>{why}</p></details>
          {canSpeak && <button type="button" className="linkish" onClick={() => act.listen(step)}>🔊 {x.listen}</button>}
        </div>
        <div className="chips">{g.q[lang].map((q) => <button type="button" key={q} className="chip-q" onClick={() => act.askq(q)}>{q}</button>)}</div>
      </div>
    </div>
  );
}

function Actions({ ui, onMain, label, disabled, back, x, secondary }) {
  return (
    <div className="actions">
      <Alert>{formErr(ui)}</Alert>
      <div className="actions-row">
        {back && <button type="button" className="ghost back-btn" onClick={back} disabled={ui.pending}>← {x.back}</button>}
        <button type="submit" className="btn" onClick={onMain} disabled={disabled || ui.pending}>{ui.pending && ui.busy ? <><Spinner /> {ui.busy}</> : label}</button>
      </div>
      {secondary}
    </div>
  );
}

function ClarityRow({ id, x, lead, act }) {
  const v = lead.clarity?.[id];
  return (
    <div className="clarity">
      <span>{x.wasClear}</span>
      <button type="button" className={v === "clear" ? "on" : ""} onClick={() => act.clarity(id, "clear")}>👍 {x.clear}</button>
      <button type="button" className={"simp " + (v === "simpler" ? "on" : "")} onClick={() => act.clarity(id, "simpler")}>{x.simpler}</button>
    </div>
  );
}

// A disclosure exactly as the registry holds it. Records when it was shown (dwell) and,
// when acknowledged, the version hash goes back to the server as evidence.
function Disclosure({ dKey, p, ackable = true, extra }) {
  const { reg, ui, setUi, x, lang, lead } = p;
  const d = reg?.disclosures.find((z) => z.key === dKey);
  useEffect(() => {
    setUi((u) => (u.shownAt[dKey] ? {} : { shownAt: { ...u.shownAt, [dKey]: Date.now() } }));
  }, [dKey, setUi]);
  if (!d) return <div className="card"><Spinner /></div>;
  const cid = CLARITY_ID[dKey];
  return (
    <div className={"card point" + (fe(ui, dKey) ? " invalid-card" : "")}>
      <h2>{d.title}</h2>
      <Html html={viz(VIZ_FOR[dKey], lang, { p: lead.program })} />
      {d.body.map((b, i) => <p key={i} className="sub">{b}</p>)}
      {extra}
      {cid && <ClarityRow id={cid} {...p} />}
      {ackable && d.acknowledgement && (
        <Check checked={!!ui.acks[dKey]} onChange={(v) => setUi((u) => ({ acks: { ...u.acks, [dKey]: v }, fieldErrs: { ...u.fieldErrs, [dKey]: null } }))}>{d.acknowledgement}</Check>
      )}
      <p className="reg-meta">v {d.version}{d.tsr ? ` · ${d.tsr}` : ""}</p>
    </div>
  );
}

// ======================================================================= 1
const S = {};
S[1] = (p) => {
  const { x, ui, setUi, act } = p;
  const stateBlocked = ui.state && CLOSED_STATES.includes(ui.state);
  const debtTooSmall = ui.debtRange === "lt_7500";
  return (
    <>
      <GuideTip step={1} {...p} />
      <h1>{x.q1h}</h1>
      <p className="sub">{x.q1sub}</p>
      <fieldset>
        <legend>{x.q1a}</legend>
        <p className="small">{x.q1aHint}</p>
        <div className="tapgrid">
          {Object.entries(DEBT_RANGES).map(([id, r]) => (
            <button type="button" key={id} className={"tap" + (ui.debtRange === id ? " on" : "")} aria-pressed={ui.debtRange === id} onClick={() => setUi({ debtRange: id, fieldErrs: {} })}>{r.label}</button>
          ))}
        </div>
        {debtTooSmall && <p className="alert err" role="alert">⚠ Our programs require at least $7,500 in enrolled debt. We can't help with amounts below that.</p>}
        {fe(ui, "debtRange") && !debtTooSmall && <span className="f-err">{fe(ui, "debtRange")}</span>}
      </fieldset>
      <label className="f">
        <span className="f-label legendish">{x.q1b}</span>
        <select className={"field" + (fe(ui, "state") || stateBlocked ? " invalid" : "")} value={ui.state} onChange={(e) => setUi({ state: e.target.value, fieldErrs: {} })}>
          <option value="">{x.chooseState}</option>
          {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
      </label>
      {stateBlocked && <p className="alert err" role="alert">⚠ We don't have a licensed partner program in {US_STATES.find((s) => s.code === ui.state)?.name || ui.state} yet. Please select another state.</p>}
      {fe(ui, "state") && !stateBlocked && <span className="f-err">{fe(ui, "state")}</span>}
      <fieldset>
        <legend>{x.q1c}</legend>
        {PAY_IDS.map((id, i) => (
          <button type="button" key={id} className={"choice" + (ui.paymentStatus === id ? " on" : "")} aria-pressed={ui.paymentStatus === id} onClick={() => setUi({ paymentStatus: id })}>{x.pay[i]}</button>
        ))}
      </fieldset>
      {ui.paymentStatus === "current" && <p className="alert info">ℹ Most programs require accounts to be behind on payments. You may still qualify — we'll check your specific situation.</p>}
      <Actions ui={ui} x={x} onMain={act.s1} label={x.seeEstimate} />
    </>
  );
};

// ======================================================================= 2
// No account or password: just the details we need to send the plan and verify the phone.
function ContactForm({ p }) {
  const { x, a, ui, setUi, act } = p;
  const f = ui.acct;
  const on = (k) => (v) => setUi((u) => ({ acct: { ...u.acct, [k]: k === "phone" ? maskPhone(v) : v }, fieldErrs: { ...u.fieldErrs, [k]: null } }));
  return (
    <form className="card stack" onSubmit={(e) => { e.preventDefault(); act.contact(); }} noValidate>
      <h2>{x.e2acct}</h2>
      <p className="small">{x.e2acctSub}</p>
      <div className="grid2">
        <Field label={a.first} autoComplete="given-name" value={f.first} onChange={on("first")} error={fe(ui, "first")} />
        <Field label={a.last} autoComplete="family-name" value={f.last} onChange={on("last")} error={fe(ui, "last")} />
      </div>
      <Field label={a.email} type="email" autoComplete="email" inputMode="email" value={f.email} onChange={on("email")} error={fe(ui, "email")} />
      <Field label={a.phone} type="tel" autoComplete="tel-national" inputMode="tel" value={f.phone} onChange={on("phone")} error={fe(ui, "phone")} placeholder="(512) 555-0142" />
      <Check checked={f.terms} onChange={(v) => setUi((u) => ({ acct: { ...u.acct, terms: v }, fieldErrs: { ...u.fieldErrs, terms: null } }))} error={fe(ui, "terms")}>
        {a.terms(<Link key="t" to="/terms" target="_blank">{a.termsL}</Link>, <Link key="p" to="/privacy" target="_blank">{a.privacyL}</Link>)}
      </Check>
      {fe(ui, "terms") && <span className="f-err">{fe(ui, "terms")}</span>}
      <Actions ui={ui} x={x} label={x.createCont} back={() => act.back(1)} />
    </form>
  );
}

S[2] = (p) => {
  const { x, lead } = p;
  const e = lead.estimate;
  return (
    <>
      <GuideTip step={2} {...p} />
      <h1>{x.e2h}</h1>
      {e && (
        <div className="big estimate">
          <span className="k">{x.e2resolve}</span>
          <span className="v">{x.e2range(usd(e.resolveLow), usd(e.resolveHigh))}</span>
          <span className="small-on-dark">{x.e2depRange(usd(e.depositLow), usd(e.depositHigh), e.monthsLow, e.monthsHigh)}</span>
          <span className="small-on-dark">{x.e2fee(pct(e.feeLow), pct(e.feeHigh))}</span>
        </div>
      )}
      <div className="alert info">{x.e2note}</div>
      <ul className="trustline">{x.e2trust.map((t) => <li key={t}>✓ {t}</li>)}</ul>
      <ContactForm p={p} />
    </>
  );
};

// ======================================================================= 3
function OtpCard({ p }) {
  const { x, ui, setUi, act, lead, demo } = p;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (lead.phoneVerified) return <div className="card ok-card">✓ {x.otpDone} · {lead.otp?.masked || maskPhone(lead.phone || ui.form.phone || "")}</div>;
  const sent = lead.otp?.sentAt;
  const wait = sent ? Math.max(0, OTP.resendSeconds - Math.floor((now - new Date(sent).getTime()) / 1000)) : 0;
  const phone = demo ? ui.form.phone : lead.phone || digits(ui.acct.phone);
  return (
    <form className="card stack otp" onSubmit={(e) => { e.preventDefault(); act.otpVerify(); }} noValidate>
      <h2>{x.otpH}</h2>
      <p className="small">{x.otpSub(lead.otp?.masked || maskPhone(phone || ""))}</p>
      {!sent ? (
        <button type="button" className="btn narrow" onClick={act.otpSend} disabled={ui.pending}>{x.otpSend}</button>
      ) : (
        <>
          <Field label={x.otpLabel} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={ui.otpCode} onChange={(v) => setUi({ otpCode: digits(v).slice(0, 6) })} error={fe(ui, "code")} className="otp-field" />
          {ui.devCode && <p className="demo-note">{x.otpDev(ui.devCode)}</p>}
          <div className="row-wrap">
            <button className="btn narrow" disabled={ui.pending || ui.otpCode.length !== 6}>{x.otpVerify}</button>
            <button type="button" className="linkish" disabled={wait > 0 || ui.pending} onClick={act.otpSend}>{wait > 0 ? x.otpWait(wait) : x.otpResend}</button>
          </div>
        </>
      )}
      {!lead.phoneVerified && <Alert>{formErr(ui)}</Alert>}
    </form>
  );
}

function Stages({ p }) {
  const { lang, ui, x } = p;
  if (ui.stage < 0) return null;
  return (
    <div className="card stages-card" aria-live="polite">
      <h2>{x.pulling}</h2>
      <ol className="pull">{BUREAU_STAGES[lang].map((s, i) => <li key={s} className={i < ui.stage ? "done" : i === ui.stage ? "now" : ""}>{i < ui.stage ? "✓" : i === ui.stage ? <Spinner /> : "·"} {s}</li>)}</ol>
    </div>
  );
}

function Consents({ p }) {
  const { reg, ui, setUi, x } = p;
  useEffect(() => { if (reg && !ui.consentsShownAt) setUi({ consentsShownAt: Date.now() }); }, [reg, ui.consentsShownAt, setUi]);
  if (!reg) return <Spinner />;
  const setC = (k) => (v) => setUi((u) => ({ consents: { ...u.consents, [k]: v }, fieldErrs: { ...u.fieldErrs, [k]: null } }));
  const one = (c) => (
    <div key={c.key} className={"perm" + (fe(ui, c.key) ? " invalid" : "")}>
      <Check checked={!!ui.consents[c.key]} onChange={setC(c.key)}><b>{c.plain}.</b></Check>
      <p className="small">{c.legal}</p>
      {fe(ui, c.key) && <span className="f-err">{fe(ui, c.key)}</span>}
    </div>
  );
  return (
    <>
      <fieldset className="perms"><legend>{x.perms} · {x.required}</legend>{reg.consents.filter((c) => c.required).map(one)}</fieldset>
      <fieldset className="perms"><legend>{x.optional}</legend>{reg.consents.filter((c) => !c.required).map(one)}</fieldset>
    </>
  );
}

S[3] = (p) => {
  const { x, ui, setUi, act, lead } = p;
  const f = ui.form;
  const on = (k, m) => (v) => setUi((u) => ({ form: { ...u.form, [k]: m ? m(v) : v }, fieldErrs: { ...u.fieldErrs, [k]: null } }));
  return (
    <>
      <GuideTip step={3} {...p} />
      <h1>{x.v3h}</h1>
      <p className="sub">{x.v3sub}</p>
      <OtpCard p={p} />
      {lead.phoneVerified && (ui.stage >= 0 ? <Stages p={p} /> : (
        <>
          <div className="grid2">
            <Field label={x.dob} type="date" autoComplete="bday" value={f.dob} onChange={on("dob")} error={fe(ui, "dob")} max={new Date(Date.now() - 18 * 365.25 * 864e5).toISOString().slice(0, 10)} />
            <Field label={x.ssnL} hint={x.ssnHint} type="password" inputMode="numeric" autoComplete="off" value={maskSsn(f.ssn)} onChange={on("ssn", maskSsn)} error={fe(ui, "ssn")} placeholder="123-45-6789" />
          </div>
          <Field label={x.a1} autoComplete="address-line1" value={f.address} onChange={on("address")} error={fe(ui, "address")} />
          <div className="grid2">
            <Field label={x.city} autoComplete="address-level2" value={f.city} onChange={on("city")} error={fe(ui, "city")} />
            <Field label={x.zip} inputMode="numeric" autoComplete="postal-code" value={f.zip} onChange={on("zip", (v) => digits(v).slice(0, 5))} error={fe(ui, "zip")} />
          </div>
          <p className="small">{x.stateLine(lead.state).split(".")[0]}.</p>
          <p className="secure">🔒 {x.v3secure}</p>
          <Consents p={p} />
          <Actions ui={ui} x={x} onMain={act.s3} label={x.find} />
        </>
      ))}
    </>
  );
};

// ======================================================================= 4
S[4] = (p) => {
  const { x, ui, setUi, act, lead } = p;
  const tls = ui.tls || lead.tradelines || [];
  const en = tls.filter((t) => !t.excludedReason && (t.enrollable || t.needsReview) && t.source !== "consumer");
  const ex = tls.filter((t) => t.excludedReason);
  const bal = (t) => (t.balanceConfirmed ?? t.balanceBureau ?? 0);
  const total = [...en.filter((t) => t.selected && t.enrollable), ...ui.added].reduce((s, t) => s + (t.amount ?? bal(t)), 0);
  const declared = [...tls.filter((t) => t.source !== "consumer"), ...ui.added].reduce((s, t) => s + (t.amount ?? bal(t)), 0);
  const af = ui.addForm;
  return (
    <>
      <GuideTip step={4} {...p} />
      <h1>{x.h4(lead.first)}</h1>
      <p className="sub">{x.s4sub}</p>
      {lead.bureauNoHit && <p className="alert info">{x.noHit}</p>}
      {en.length > 0 && <p className="small">{x.balNote}</p>}
      {en.map((t) => (
        <div className={"card debtcard" + (t.selected ? " on" : "")} key={t.tlId}>
          <label className="debt">
            <input type="checkbox" checked={!!t.selected} disabled={t.needsReview && !t.confirmed} onChange={(e) => act.pick(t.tlId, e.target.checked)} />
            <span className="grow"><b>{t.creditor}</b><br /><span className="small">{t.needsReview && !t.confirmed ? x.tell : x.accountTypes[t.confirmed || t.type] || x.types[t.type] || t.type} · {x.dpd(t.dpd)}</span></span>
            <b>{usd(bal(t))}</b>
          </label>
          {t.needsReview && (
            <select className="field" value={t.confirmed || ""} onChange={(e) => act.confirm(t.tlId, e.target.value)}>
              <option value="">{x.kind}</option>
              <option value="medical">{x.accountTypes.medical}</option>
              <option value="credit_card">{x.accountTypes.credit_card}</option>
              <option value="collection">{x.accountTypes.collection}</option>
            </select>
          )}
          <details className="edit-bal">
            <summary>{x.editBal}</summary>
            <Field label={x.yourBal} prefix="$" inputMode="numeric" value={t.balanceConfirmed == null ? "" : maskMoney(String(t.balanceConfirmed))} onChange={(v) => act.balance(t.tlId, v)} hint={x.bureauSaid(usd(t.balanceBureau))} />
          </details>
        </div>
      ))}
      {ui.added.map((a, i) => (
        <div className="card debtcard on" key={"a" + i}>
          <div className="debt"><span className="grow"><b>{a.creditor}</b><br /><span className="small">{x.accountTypes[a.type]} · {x.added}</span></span><b>{usd(a.amount)}</b>
            <button type="button" className="linkish" onClick={() => setUi((u) => ({ added: u.added.filter((_, j) => j !== i) }))}>{x.remove}</button></div>
        </div>
      ))}
      <details className="card" open={lead.bureauNoHit || undefined}>
        <summary><b>{x.addH}</b></summary>
        <p className="small">{x.addSub}</p>
        <div className="stack">
          <Field label={x.addCreditor} value={af.creditor} onChange={(v) => setUi((u) => ({ addForm: { ...u.addForm, creditor: v } }))} error={fe(ui, "addCreditor")} />
          <div className="grid2">
            <Field label={x.addAmount} prefix="$" inputMode="numeric" value={maskMoney(af.amount)} onChange={(v) => setUi((u) => ({ addForm: { ...u.addForm, amount: digits(v) } }))} error={fe(ui, "addAmount")} />
            <label className="f"><span className="f-label">{x.addType}</span>
              <select className="field" value={af.type} onChange={(e) => setUi((u) => ({ addForm: { ...u.addForm, type: e.target.value } }))}>{Object.entries(x.accountTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
          </div>
          <button type="button" className="ghost" onClick={act.addDebt} disabled={ui.added.length >= 15}>+ {x.addBtn}</button>
        </div>
      </details>
      {ex.length > 0 && (
        <div className={"card excl" + (fe(ui, "exclusionsAck") ? " invalid-card" : "")}>
          <h2>{x.exclH(ex.length)}</h2>
          {ex.map((t) => (
            <div key={t.tlId} className="excl-row">
              <div className="row-between"><b>{t.creditor}</b><span>{usd(bal(t))}</span></div>
              <p className="small">{x.exclReasons[t.excludedReason]}</p>
              {t.excludedReason === "federal_student" && <a className="small-link" href={REFERRAL_HREFS.federal_student_loan_options} target="_blank" rel="noreferrer">{x.studentLink} ↗</a>}
            </div>
          ))}
          <Check checked={ui.exclAck} onChange={(v) => setUi((u) => ({ exclAck: v, fieldErrs: { ...u.fieldErrs, exclusionsAck: null } }))}>{x.exclAck}</Check>
        </div>
      )}
      <div className="card kv total"><span>{x.enrolling}<br /><span className="small">{x.totals(usd(declared), usd(total))}</span></span><span>{usd(total)}</span></div>
      <Actions ui={ui} x={x} onMain={act.s4} label={x.cont} disabled={total === 0} back={() => act.back(3)} />
    </>
  );
};

// ======================================================================= 5
S[5] = (p) => {
  const { x, ui, setUi, act, lead, lang } = p;
  const net = +digits(ui.net) || 0, housing = +digits(ui.housing) || 0, other = +digits(ui.other) || 0;
  const disp = net - housing - other;
  return (
    <>
      <GuideTip step={5} {...p} />
      <h1>{x.h5}</h1>
      <p className="sub">{x.s5sub}</p>
      <Field label={x.netL} prefix="$" inputMode="numeric" value={maskMoney(ui.net)} onChange={(v) => setUi({ net: digits(v) })} error={fe(ui, "netMonthly")} placeholder="4,200" />
      <div className="grid2">
        <Field label={x.housingL} prefix="$" inputMode="numeric" value={maskMoney(ui.housing)} onChange={(v) => setUi({ housing: digits(v) })} placeholder="1,500" />
        <Field label={x.otherL} prefix="$" inputMode="numeric" value={maskMoney(ui.other)} onChange={(v) => setUi({ other: digits(v) })} placeholder="900" />
      </div>
      {net > 0 && <Html html={viz("budget", lang, { inc: net, exp: housing + other })} className="card" />}
      <div className="card kv total"><span>{x.dispL}</span><span>{usd(disp)}</span></div>
      {disp > 0 && <p className="small">{x.capNote(usd(Math.max(150, disp * 0.55)))}</p>}
      <div className="card stack">
        <h2>{x.bankH}</h2>
        <p className="small">{x.bankSub}</p>
        <div className="eq-buttons">
          <button type="button" className={"ghost" + (lead.bankLinked ? " done" : "")} onClick={act.bank1}>{lead.bankLinked ? x.bankDone : x.bankYes}</button>
          {!lead.bankLinked && <button type="button" className="ghost" onClick={act.s5}>{x.bankSkip}</button>}
        </div>
      </div>
      <Actions ui={ui} x={x} onMain={act.s5} label={x.seeProg} back={() => act.back(4)} />
    </>
  );
};

// ======================================================================= 6
S[6] = (p) => {
  const { x, ui, setUi, act, lead, lang } = p;
  const q = lead.quote;
  if (!q) return <Spinner />;
  const notIncl = (lead.tradelines || []).filter((t) => t.excludedReason === "excluded_creditor");
  return (
    <>
      <GuideTip step={6} {...p} />
      <h1>{x.h6}</h1>
      <p className="sub" dangerouslySetInnerHTML={{ __html: x.prov(q.providerName) }} />
      <div className="big">
        <span className="k">{x.dep}</span>
        <span className="v">{usd(q.monthlyDeposit)}</span>
        <span className="small-on-dark">{x.planTerm(q.termMonths[0], q.termMonths[1])}</span>
      </div>
      <div className="card">
        <div className="kv"><span>{x.rDebt}</span><span>{usd(q.enrolledDebt)}</span></div>
        <div className="kv"><span>{x.rCost}</span><span>{x.planCost(usd(q.estTotalCost[0]), usd(q.estTotalCost[1]))}</span></div>
        <div className="kv"><span>{x.rSave}</span><span>{x.planCost(usd(q.estSavings[0]), usd(q.estSavings[1]))}</span></div>
        <div className="kv"><span>{x.rFee}</span><span>{x.feeTxt(pct(q.feePct))}</span></div>
        <div className="kv"><span>{x.firstSettle}</span><span>{x.firstSettleV(q.firstSettlementMonths[0], q.firstSettlementMonths[1])}</span></div>
        <div className="kv"><span>{x.counterpartyL}</span><span>{q.providerLegalName}</span></div>
        <div className="kv"><span>{x.administratorL}</span><span>{q.administrator}</span></div>
      </div>
      {q.feePct < q.rawFeePct && <p className="alert info">{x.capApplied(pct(q.rawFeePct), pct(q.feePct), lead.state)}</p>}
      {notIncl.length > 0 && <p className="alert info">{x.notIncl(q.providerName, notIncl.map((t) => t.creditor).join(", "))}</p>}
      <p className="small">{x.s6note}</p>
      <div className={fe(ui, "quote") ? "invalid-card card" : ""}>
        <Check checked={!!ui.acks.quote} onChange={(v) => setUi((u) => ({ acks: { ...u.acks, quote: v }, fieldErrs: { ...u.fieldErrs, quote: null } }))}>{x.ackQuote}</Check>
      </div>
      {lead.heightenedCredit && <p className="alert err">{x.heightened}</p>}
      <h2 className="sec-h">{x.p6how}</h2>
      <Disclosure dKey="advance_fee" p={p} />
      <Disclosure dKey="dedicated_account" p={p} extra={<p className="small"><b>{x.administratorL}:</b> {q.administrator}</p>} />
      <Actions ui={ui} x={x} onMain={act.s6} label={x.cont} back={() => act.back(5)} />
    </>
  );
};

// ======================================================================= 7
function AlternativesBlock({ p }) {
  const { x, ui, setUi, lang } = p;
  const labels = ALTERNATIVES[lang];
  return (
    <div className={"card stack" + (fe(ui, "choice") ? " invalid-card" : "")}>
      <h2>{x.altH}</h2>
      <p className="small">{x.altSub}</p>
      <ul className="alt-list">{Object.entries(labels).map(([k, v]) => <li key={k}>{v}</li>)}</ul>
      <p className="small">{COMPENSATION_DISCLOSURE[lang]}</p>
      <Link className="small-link" to="/alternatives" target="_blank">{x.altCompare} ↗</Link>
      <div className="eq-buttons">
        <button type="button" className={"choice" + (ui.altChoice === "settlement" ? " on" : "")} onClick={() => setUi({ altChoice: "settlement", altPick: null })}>{x.altSettle}</button>
        <button type="button" className={"choice" + (ui.altChoice === "other" ? " on" : "")} onClick={() => setUi({ altChoice: "other" })}>{x.altOther}</button>
      </div>
      {ui.altChoice === "other" && (
        <fieldset>
          <legend>{x.altPick}</legend>
          {Object.entries(labels).map(([k, v]) => <button type="button" key={k} className={"choice" + (ui.altPick === k ? " on" : "")} onClick={() => setUi({ altPick: k })}>{v}</button>)}
        </fieldset>
      )}
    </div>
  );
}

S[7] = (p) => {
  const { x, ui, act, lang, lead } = p;
  const passed = lead.comprehensionPassed;
  return (
    <>
      <GuideTip step={7} {...p} />
      <h1>{x.h8}</h1>
      <Disclosure dKey="credit_impact" p={p} ackable={false} />
      {!passed ? (
        <>
          <h2 className="sec-h">{x.compH}</h2>
          {ui.wrong?.length > 0 && <p className="alert info">{x.compRetry}</p>}
          {QUIZ.map((q, qi) => (
            <fieldset key={q.id}>
              <legend>{qi + 1}. {q.q[lang]}</legend>
              {q.o[lang].map((o, i) => <button type="button" key={o} className={"choice" + (ui.answers[q.id] === i ? " on" : "")} aria-pressed={ui.answers[q.id] === i} onClick={() => act.ans(q.id, i)}>{o}</button>)}
              {ui.wrong?.includes(q.id) && <p className="alert info">{q.ex[lang]}</p>}
            </fieldset>
          ))}
          <Actions ui={ui} x={x} onMain={act.s7a} label={x.checkA} disabled={QUIZ.some((q) => ui.answers[q.id] === undefined)} back={() => act.back(6)} />
        </>
      ) : (
        <>
          <Disclosure dKey="creditor_contact" p={p} />
          <Disclosure dKey="tax" p={p} extra={<a className="small-link" href={IRS_1099C_URL} target="_blank" rel="noreferrer">{x.irs} ↗</a>} />
          <AlternativesBlock p={p} />
          <Actions ui={ui} x={x} onMain={act.s7b} label={x.cont} />
        </>
      )}
    </>
  );
};

// ======================================================================= 8
S[8] = (p) => {
  const { x, ui, setUi, act, lead, demo, lang } = p;
  const q = lead.quote;
  const name = `${lead.first || ""} ${lead.last || ""}`.trim();
  return (
    <>
      <GuideTip step={8} {...p} />
      <h1>{x.signH}</h1>
      <div className="card">
        <h2>{x.keyT}</h2>
        <div className="kv"><span>{x.counterpartyL}</span><span>{q.providerLegalName}</span></div>
        <div className="kv"><span>{x.mdep}</span><span>{usd(q.monthlyDeposit)}</span></div>
        <div className="kv"><span>{x.len}</span><span>{x.planTerm(q.termMonths[0], q.termMonths[1])}</span></div>
        <div className="kv"><span>{x.feeL}</span><span>{x.feeTxt(pct(q.feePct))}</span></div>
        <div className="kv"><span>{x.cancel}</span><span>{x.anytime}</span></div>
      </div>
      <div className="card">
        <h2>{x.signDocs}</h2>
        <ol className="docs">{DOCUMENT_PACK[lang].map((d) => <li key={d}>📄 {d}</li>)}</ol>
        <p className="small">{x.full(q.providerName)}</p>
      </div>
      <div className="card stack">
        <h2>{x.acctH}</h2>
        <p className="small">{x.acctSub(q.administrator)}</p>
        <p className="small"><b>{x.rightsH}:</b></p>
        <ul className="checklist">{ACCOUNT_RIGHTS[lang].map((r) => <li key={r}>{r}</li>)}</ul>
        <button type="button" className={"ghost" + (lead.depositAccountLinked ? " done" : "")} onClick={act.bank2}>{lead.depositAccountLinked ? x.bankOn : x.bank2}</button>
        <Field label={x.draft} type="date" value={ui.draft} onChange={(v) => setUi({ draft: v })} hint={x.draftSub} error={fe(ui, "draftDate")}
          min={new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)} max={new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10)} />
        <Check checked={ui.achOk} onChange={(v) => setUi((u) => ({ achOk: v, fieldErrs: { ...u.fieldErrs, achAuthorized: null } }))} error={fe(ui, "achAuthorized")}>{x.achL(usd(q.monthlyDeposit), q.administrator)}</Check>
        {fe(ui, "achAuthorized") && <span className="f-err">{fe(ui, "achAuthorized")}</span>}
      </div>
      <div className="card stack">
        <Field label={x.signName} hint={x.signHint(name)} value={ui.signName} onChange={(v) => setUi((u) => ({ signName: v, fieldErrs: { ...u.fieldErrs, signatureName: null } }))} error={fe(ui, "signatureName")} autoComplete="name" className="sig" />
        <p className="small">{x.signCapture}</p>
      </div>
      <Actions ui={ui} x={x} onMain={act.sign} label={x.signCont} disabled={!lead.depositAccountLinked} back={() => act.back(7)}
        secondary={<button type="button" className="ghost" onClick={act.nosign} disabled={ui.pending}>{x.notNow}</button>} />
    </>
  );
};

// ======================================================================= 9
S[9] = (p) => {
  const { x, ui, setUi, act, lead, lang } = p;
  const slots = CALL_SLOTS[lang];
  if (lead.callResult === "BOOKED")
    return (<><h1>{x.callH}</h1><p className="alert ok">{x.callBooked(slots[lead.callBooking?.slot] || "")}</p><Link className="btn as-link" to="/dashboard">{x.toDash}</Link></>);
  return (
    <>
      <GuideTip step={9} {...p} />
      <h1>{x.callH}</h1>
      <div className="card stack">
        <p className="small">🎙 {x.recording}</p>
        <p className="small"><b>{x.covers.split(":")[0]}:</b></p>
        <ul className="checklist">{x.confirmPoints.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
      {!ui.calling && !ui.call.length && lead.callResult !== "FAILED" && (
        <fieldset>
          <legend>{x.callSlotQ}</legend>
          {Object.entries(slots).map(([k, v]) => <button type="button" key={k} className={"choice" + (ui.callSlot === k ? " on" : "")} onClick={() => setUi({ callSlot: k })}>{v}</button>)}
        </fieldset>
      )}
      {(ui.call.length > 0 || ui.calling) && (
        <div className="card call" aria-live="polite">
          {ui.call.map((l, i) => <p className="small" key={i}><b>{l.who}:</b> {l.text}</p>)}
          {ui.calling && <p className="small"><Spinner /> …</p>}
        </div>
      )}
      {lead.callResult === "FAILED" && !ui.calling ? <p className="alert info">{x.humanMsg}</p> : ui.calling ? null : <Actions ui={ui} x={x} onMain={act.call} label={ui.callSlot === "now" ? x.callMe : slots[ui.callSlot]} />}
    </>
  );
};

// ======================================================================= 10
S[10] = (p) => {
  const { x, lead, lang, act, demo } = p;
  const q = lead.quote;
  const two = (lead.deposits || []).slice(0, 2);
  return (
    <>
      <div className="done-badge">✓</div>
      <h1>{x.done9}</h1>
      <div className="card">
        {two.map((d) => <div className="kv" key={d.n}><span>{x.depNamed(d.n)}</span><span>{usd(d.amount)} · {fmtDate(d.date, lang, { month: "long", day: "numeric" })}</span></div>)}
        <div className="kv"><span>{x.administratorL}</span><span>{q?.administrator}</span></div>
      </div>
      <div className="card">
        <h2>{x.next}</h2>
        <ol className="sub steps-list">{x.nextL(q?.providerName).map((l) => <li key={l}>{l}</li>)}</ol>
      </div>
      <div className="card"><h2>{x.pushH}</h2><ul className="checklist">{PUSH_TYPES.map((t) => <li key={t}>{x.pushTypes[t]}</li>)}</ul></div>
      <InstallCoach x={x} />
      {demo ? (
        <div className="card dashed">
          <p className="demo-note">Demo control (staff only): simulate partner events</p>
          <p className="small">Fee status: <b>{lead.feeStatus}</b> · Debtify fee {usd(q?.debtifyFee)}</p>
          <div className="row-wrap">
            {["PAYMENT1_CLEARED", "PAYMENT2_CLEARED", "PAYMENT2_FAILED", "DEBT_SETTLED"].map((t) => <button type="button" className="mini" key={t} onClick={() => act.backend(t)}>{t.replace(/_/g, " ").toLowerCase()}</button>)}
          </div>
        </div>
      ) : <Link className="btn as-link" to="/dashboard">{x.toDash}</Link>}
    </>
  );
};

// ======================================================================= exits
export function AltList({ lang, x }) {
  const labels = ALTERNATIVES[lang];
  return (
    <div className="card stack">
      <h2>{x.altsTitle}</h2>
      {Object.entries(labels).filter(([k]) => ALTERNATIVE_LINKS[k]).map(([k, v]) => (
        <a key={k} className="alt-link" href={ALTERNATIVE_LINKS[k]} target="_blank" rel="noreferrer">{v} ↗</a>
      ))}
      <Link className="small-link" to="/alternatives">{x.altCompare}</Link>
    </div>
  );
}

function Exit({ x, lang, lead, act }) {
  const [h, b] = DECL[lang][lead.dropReason] || DECL[lang].NO_BACKEND_FIT;
  const ref = lead.referral?.destination;
  return (
    <>
      <div className="tip">
        <Html as="span" html={AVATAR} className="tip-av" />
        <div className="tip-body"><p>{b}</p></div>
      </div>
      <h1>{h}</h1>
      {ref && ALTERNATIVE_LINKS[ref] && <a className="btn as-link" href={ALTERNATIVE_LINKS[ref]} target="_blank" rel="noreferrer">{ALTERNATIVES[lang][ref]} ↗</a>}
      {lead.dropReason !== "UNDER_18" && <AltList lang={lang} x={x} />}
      {lead.state && CLOSED_STATES.includes(lead.state) && <Link className="small-link" to={`/states/${lead.state.toLowerCase()}`}>{lang === "es" ? "Lo que esto significa en tu estado" : "What this means in your state"} →</Link>}
      <button type="button" className="ghost" onClick={act.restart}>{x.restart}</button>
    </>
  );
}

export function Screen(props) {
  const { step } = props;
  if (!step) return <div className="step-enter" key="exit"><Exit {...props} /></div>;
  const C = S[step];
  if (!C) return null;
  return <div className="step-enter" key={step}>{C(props)}</div>;
}
