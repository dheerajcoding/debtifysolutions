import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../lib/api.js";
import { DECL } from "../lib/copy.js";
import { fmtDate, usd } from "../lib/format.js";
import { Alert, Spinner } from "../components/ui.jsx";
import { SiteLayout } from "../components/Layout.jsx";
import Chat from "../components/Chat.jsx";
import { InstallCoach } from "../components/InstallCoach.jsx";
import { AltList } from "../components/Screens.jsx";
import { CALL_SLOTS } from "@shared/config/flow.js";

function useApplication() {
  const [app, setApp] = useState(undefined);
  const [err, setErr] = useState(null);
  const reload = () => api.application().then((r) => setApp(r.application)).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, []);
  return { app, setApp, err, reload };
}

const chipFor = (s) => (s === "CLEARED" || s === "SETTLED" ? "c-good" : s === "FAILED" ? "c-bad" : s === "CANCELLED" ? "c-warn" : "c-info");

export default function Dashboard() {
  const { a, x, lang, openChat, askPerson } = useApp();
  const { app, setApp, err } = useApplication();
  const loc = useLocation();
  const [all, setAll] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [msg, setMsg] = useState(loc.state?.flash || null);
  const [called, setCalled] = useState(false);

  useEffect(() => { document.title = (lang === "es" ? "Mi solicitud" : "My application") + " · Debtify"; }, []);

  const enrolledLike = app && ["ENROLLED", "PAYMENT1_CLEARED", "PAYMENT2_CLEARED", "CLAWBACK", "CANCELLED"].includes(app.status) && app.program != null && app.deposits?.length;
  const inProgress = app && !enrolledLike && (app.outcome || "in_progress") === "in_progress" && app.step > 0 && app.step < 10;
  const exited = app && !enrolledLike && ["declined", "diverted", "referred_out", "abandoned"].includes(app.outcome);
  const pr = app?.program;

  const cancel = async () => {
    try {
      const r = await api.cancelProgram();
      setApp(r.application);
      setMsg(a.cancelledMsg);
      setConfirmCancel(false);
    } catch (e) { setMsg(e.message); }
  };

  return (
    <SiteLayout>
      <div className="page">
        <div className="page-head">
          <h1>{a.hi(app?.first || "")}</h1>
          {msg && <Alert kind="ok">{msg}</Alert>}
        </div>
        {err && <Alert>{err}</Alert>}
        {app === undefined ? <p className="center pad"><Spinner /></p> : !app ? (
          <div className="panel hero-panel">
            <h2>{a.dashNone}</h2>
            <p className="sub">{a.dashNoneSub}</p>
            <Link className="btn as-link narrow" to="/apply">{a.startApp}</Link>
          </div>
        ) : inProgress ? (
          <div className="panel hero-panel">
            <span className="chip c-info">{a.inProgress}</span>
            <h2>{a.stepOf(app.step, x.stepNames[app.step])}</h2>
            <div className="bar"><i style={{ width: `${(app.step / 9) * 100}%` }} /></div>
            {app.callResult === "FAILED" ? <p className="alert info">{a.callHuman}</p> : app.callResult === "BOOKED" ? <p className="alert ok">{x.callBooked(CALL_SLOTS[lang][app.callBooking?.slot] || "")}</p> : <Link className="btn as-link narrow" to="/apply">{a.continueApp}</Link>}
            {app.estimate && <p className="small">{x.e2depRange(usd(app.estimate.depositLow), usd(app.estimate.depositHigh), app.estimate.monthsLow, app.estimate.monthsHigh)}</p>}
          </div>
        ) : exited ? (
          <div className="dash-grid">
            <div className="panel hero-panel">
              <span className="chip c-warn">{a.declinedH}</span>
              <h2>{(DECL[lang][app.dropReason] || DECL[lang].NO_BACKEND_FIT)[0]}</h2>
              <p className="sub">{(DECL[lang][app.dropReason] || DECL[lang].NO_BACKEND_FIT)[1]}</p>
              <Link className="ghost as-link narrow" to="/apply">{a.startOver}</Link>
            </div>
            <AltList lang={lang} x={x} />
          </div>
        ) : (
          <>
            <div className="dash-grid">
              <div className="panel program">
                <div className="row-between">
                  <h2>{a.enrolledH}</h2>
                  <span className={"chip " + (app.status === "CANCELLED" ? "c-warn" : app.status === "CLAWBACK" ? "c-bad" : "c-good")}>{a.statusL[app.status] || app.status}</span>
                </div>
                <div className="kpis">
                  <div className="kpi"><div className="v">{usd(pr?.monthlyDeposit)}</div><div className="k">{a.monthly}</div></div>
                  <div className="kpi"><div className="v">{usd(app.summary.saved)}</div><div className="k">{a.saved}</div></div>
                  <div className="kpi"><div className="v">{app.summary.nextDeposit ? fmtDate(app.summary.nextDeposit.date, lang, { month: "short", day: "numeric" }) : "–"}</div><div className="k">{a.nextDep}</div></div>
                  <div className="kpi"><div className="v">{app.summary.settled}/{app.debts.length}</div><div className="k">{a.debtStatus.SETTLED}</div></div>
                </div>
                <div>
                  <div className="row-between small"><span>{a.progress}</span><span>{a.depositsMade(app.summary.depositsMade, app.summary.depositsTotal)}</span></div>
                  <div className="bar big-bar"><i style={{ width: `${Math.max(2, app.summary.progressPct)}%` }} /></div>
                </div>
                <div className="kv"><span>{a.company}</span><span>{app.counterparty || pr?.backendName}</span></div>
                <div className="kv"><span>{x.administratorL}</span><span>{app.administrator}</span></div>
                {(app.firstTwoDeposits || []).map((d) => <div className="kv" key={d.n}><span>{x.depNamed(d.n)}</span><span>{usd(d.amount)} · {fmtDate(d.date, lang)}</span></div>)}
                <div className="kv"><span>{a.length}</span><span>{app.quote ? x.planTerm(app.quote.termMonths[0], app.quote.termMonths[1]) : a.months(pr?.termMonths)}</span></div>
                <div className="kv"><span>{x.rDebt}</span><span>{usd(pr?.enrolledDebt)}</span></div>
                <div className="kv"><span>{x.rFee}</span><span>{x.feeTxt(Math.round(pr?.clientFeePct * 100))}</span></div>
              </div>

              <div className="panel">
                <h3>{a.debtsH}</h3>
                <div className="tbl">
                  <table>
                    <tbody>
                      {app.debts.map((d) => (
                        <tr key={d.tlId}><td><b>{d.creditor}</b><br /><span className="small">{x.types[d.type] || d.type}</span></td><td className="r">{usd(d.balance)}</td><td className="r"><span className={"chip " + chipFor(d.status)}>{a.debtStatus[d.status] || d.status}</span></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="dash-grid">
              <div className="panel">
                <h3>{a.scheduleH}</h3>
                <div className="tbl">
                  <table>
                    <thead><tr><th>#</th><th>{a.dateL}</th><th className="r">{a.amountL}</th><th className="r">{a.statusCol}</th></tr></thead>
                    <tbody>
                      {(all ? app.deposits : app.deposits.slice(0, 6)).map((d) => (
                        <tr key={d.n}><td>{d.n}</td><td>{fmtDate(d.date, lang)}</td><td className="r">{usd(d.amount)}</td><td className="r"><span className={"chip " + chipFor(d.status)}>{a.depStatus[d.status]}</span></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {app.deposits.length > 6 && <button className="linkish" onClick={() => setAll(!all)}>{all ? a.showLess : a.showAll} ({app.deposits.length})</button>}
              </div>

              <div className="stack">
                <div className="panel">
                  <h3>{a.docsH}</h3>
                  <div className="doc-row"><span>📄 {a.agreement}</span><Link to="/dashboard/agreement">{a.view}</Link></div>
                  <div className="doc-row"><span>✅ {a.consentsDoc}</span><Link to="/settings#prefs">{a.view}</Link></div>
                </div>
                <div className="panel">
                  <h3>{a.helpH}</h3>
                  <p className="small">{a.helpSub}</p>
                  <div className="row-wrap">
                    <button className="mini" onClick={openChat}>{a.askJay}</button>
                    <button className="mini" disabled={called} onClick={async () => { await askPerson(); setCalled(true); }}>{called ? "✓" : a.callMe}</button>
                  </div>
                  {called && <p className="small">{a.callReq}</p>}
                </div>
                <InstallCoach x={x} />
                <div className="panel"><h3>{x.pushH}</h3><ul className="checklist">{(app.pushTypes || []).map((t) => <li key={t}>{x.pushTypes[t]}</li>)}</ul></div>
                {app.status !== "CANCELLED" && (
                  <div className="panel">
                    <h3>{a.cancelH}</h3>
                    <p className="small">{a.cancelSub}</p>
                    {confirmCancel ? (
                      <div className="row-wrap">
                        <button className="mini danger" onClick={cancel}>{a.cancelConfirm}</button>
                        <button className="mini" onClick={() => setConfirmCancel(false)}>{a.keep}</button>
                      </div>
                    ) : <button className="mini" onClick={() => setConfirmCancel(true)}>{a.cancelBtn}</button>}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="dash-chat"><Chat /></div>
    </SiteLayout>
  );
}

export function Agreement() {
  const { a, x, lang } = useApp();
  const { app } = useApplication();
  if (app === undefined) return <SiteLayout><p className="center pad"><Spinner /></p></SiteLayout>;
  if (!app?.program) return <SiteLayout><div className="page"><p>{a.dashNone}</p><Link to="/dashboard">{a.nav.dashboard}</Link></div></SiteLayout>;
  const pr = app.program;
  return (
    <SiteLayout>
      <div className="page doc">
        <div className="row-between no-print">
          <Link to="/dashboard">← {a.nav.dashboard}</Link>
          <button className="mini" onClick={() => window.print()}>{a.print}</button>
        </div>
        <h1>{a.agH}</h1>
        <p className="small">{app.first} {app.last} · {app.email} · {lang === "es" ? "Firmado" : "Signed"} {fmtDate(app.signedAt, lang)}</p>
        <table className="doc-table">
          <tbody>
            <tr><th>{a.company}</th><td>{pr?.backendName}</td></tr>
            <tr><th>{x.rDebt}</th><td>{usd(pr?.enrolledDebt)}</td></tr>
            <tr><th>{a.monthly}</th><td>{usd(pr?.monthlyDeposit)}</td></tr>
            <tr><th>{x.first}</th><td>{fmtDate(app.draftDate, lang)}</td></tr>
            <tr><th>{a.length}</th><td>{a.months(pr?.termMonths)}</td></tr>
            <tr><th>{x.rCost}</th><td>{usd(pr?.estTotalCost)}</td></tr>
            <tr><th>{x.rFee}</th><td>{x.feeTxt(Math.round(pr?.clientFeePct * 100))}</td></tr>
            <tr><th>{x.cancel}</th><td>{x.anytime}</td></tr>
          </tbody>
        </table>
        {app.signature && <p className="small">{lang === "es" ? "Firmado electrónicamente por" : "Signed electronically by"} <b>{app.signature.name}</b> · audit {app.signature.auditHash?.slice(0, 16)}…</p>}
        <h2>{a.debtsH}</h2>
        <ul>{app.debts.map((d) => <li key={d.tlId}>{d.creditor}: {usd(d.balance)}</li>)}</ul>
        <h2>{a.consentsDoc}</h2>
        <ul>{app.consents.map((c) => <li key={c.key}>{c.key}: {c.granted ? "✓" : "✗"} · {fmtDate(c.at, lang)} · hash {String(c.versionHash || "").slice(0, 12)}…</li>)}</ul>
        <p className="small">{a.agNote(pr?.backendName)}</p>
      </div>
    </SiteLayout>
  );
}
