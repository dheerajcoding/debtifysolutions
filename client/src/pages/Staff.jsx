import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../lib/api.js";
import { PERSONAS } from "../lib/copy.js";
import { fmtDate } from "../lib/format.js";
import Flow from "../components/Flow.jsx";
import { Logo, StageProgress } from "../components/Layout.jsx";
import { Alert, LangSwitch, Spinner } from "../components/ui.jsx";
import Admin from "./Admin.jsx";
import Library from "./Library.jsx";
import { Applications, Log } from "./staff/Applications.jsx";
import { AccessLog, Consents, Disclosures, Dropoffs, Providers, Suppression } from "./staff/Records.jsx";
import States from "./staff/States.jsx";
import { PageHeader } from "./staff/ui.jsx";

function DemoApp() {
  const { persona, choosePersona, restart, logs, lead, meta } = useApp();
  if (!meta?.demoMode) return <Alert kind="info">Demo mode is off (DEMO_MODE=false). Test personas are disabled in this environment.</Alert>;
  return (
    <div className="stack">
      <PageHeader title="Demo app" sub="The consumer flow, framed, with test personas. Demo files are tagged and excluded from customer dashboards." />
      <section className="stage">
        <div>
          <div className="phone-head"><StageProgress step={lead ? lead.step : 1} compact /><LangSwitch /></div>
          <Flow framed />
        </div>
        <div className="side">
          <div className="panel">
            <div className="toolbar"><h3>Test personas</h3><button className="mini" onClick={() => restart(persona, true)}>Restart flow</button></div>
            <p className="small">Pick one and press Continue on each screen. The text-message code appears on screen in demo mode. All vendors are simulated; a phone ending in 99 fails the verification call.</p>
            <div className="personas">
              {PERSONAS.map((p) => (
                <button key={p.id} className={"persona " + (p.id === persona.id ? "on" : "")} onClick={() => choosePersona(p)}><b>{p.name}</b><span>{p.note}</span></button>
              ))}
            </div>
          </div>
          <div className="panel"><h3>Behind the scenes</h3><Log logs={logs} /></div>
        </div>
      </section>
    </div>
  );
}

function Users() {
  const { user } = useApp();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const load = () => api.users().then((r) => setRows(r.users)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  return (
    <div className="stack">
      <PageHeader title="Users and roles" sub="Staff can use this console. Admins can also manage roles and see the access log. Changing a role signs that person out." />
      <div className="panel">
        <Alert>{err}</Alert>
        {!rows ? <Spinner /> : (
          <div className="tbl"><table>
            <thead><tr><th>Name</th><th>Email</th><th>Verified</th><th>Joined</th><th>Role</th></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.userId}>
                <td>{u.first} {u.last}</td><td>{u.email}</td><td>{u.emailVerified ? "✓" : "–"}</td><td className="small">{fmtDate(u.createdAt, "en")}</td>
                <td>{u.userId === user.userId ? <b>{u.role}</b> : (
                  <select className="field slim" value={u.role} aria-label={`Role for ${u.email}`} onChange={async (e) => { try { await api.setRole(u.userId, e.target.value); load(); } catch (e2) { setErr(e2.message); } }}>
                    <option value="user">user</option><option value="staff">staff</option><option value="admin">admin</option>
                  </select>
                )}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

function DemoGuide() {
  return (
    <div className="stack">
      <PageHeader title="How to demo" sub="A 10-minute script that shows every gate." />
      <section className="panel guide-steps">
        <ol>
          <li><b>Quick check.</b> In Demo app pick "Maria, Texas". Three taps, then an instant estimate range and contact details (no account or password). Try state CA or "under $7,500" to see an early, no-data exit to alternatives.</li>
          <li><b>Phone code.</b> The 6-digit code is shown on screen in demo mode. Five wrong tries locks it; resend is rate-limited.</li>
          <li><b>Identity + consents.</b> Credit check and e-sign are required; partner contact is optional and never blocks. Open Consent records to see the hashes, IP and render-to-grant time.</li>
          <li><b>Debts.</b> Watch the bureau stages. Confirm the unclear account, correct a balance, add a missing debt. Student and auto loans are excluded with reasons.</li>
          <li><b>Budget.</b> Link a bank or enter numbers. Open Applications → this file → Decision log: every rule R1–R7, the bound provider, fallback chain and snapshot hash.</li>
          <li><b>Plan + disclosures.</b> The advance-fee and dedicated-account notices need a dwell before the tick enables. Then the comprehension check: two misses diverts to alternatives ("Not ready" persona).</li>
          <li><b>Alternatives.</b> Before signing the consumer chooses settlement or one of the other options; choosing one refers out.</li>
          <li><b>Sign + call.</b> Type the exact name, authorise ACH, book the verification call. In the file detail, mark the call passed to enroll (or use a phone ending in 99 to fail it).</li>
          <li><b>After enrolment.</b> Simulate "payment 1 cleared" etc. Dashboard updates funnel, economics and clearance sensitivity.</li>
          <li><b>Opt-out.</b> In Suppression, test "STOP" and add a number. No text — not even a code — goes to a suppressed number.</li>
          <li><b>Customer view.</b> Open the site in a private window and apply — no account needed. The application is saved on that browser; "My application" shows its status (installable as an app).</li>
        </ol>
      </section>
    </div>
  );
}

const SECTIONS = [
  ["Operate", [["dashboard", "Dashboard"], ["apps", "Applications"], ["dropoffs", "Drop-offs"]]],
  ["Compliance", [["consents", "Consent records"], ["disclosures", "Disclosure registry"], ["suppression", "Suppression"], ["access", "Access log", "admin"]]],
  ["Configuration", [["states", "Served states", "admin"], ["providers", "Providers"], ["users", "Users", "admin"]]],
  ["Demo", [["demo", "Demo app"], ["library", "Explainer library"], ["guide", "How to demo"]]],
];

export default function Staff() {
  const { user, setDemo, restart, persona, logout, loadLead } = useApp();
  const [params, setParams] = useSearchParams();
  const sec = params.get("s") || "dashboard";
  const fileId = params.get("id");
  const isAdmin = user.role === "admin";
  const [menu, setMenu] = useState(false);
  const go = (s, id) => { setParams(id ? { s, id } : { s }); setMenu(false); window.scrollTo(0, 0); };

  useEffect(() => {
    document.title = "Staff console · Debtify";
    setDemo(true);
    restart(persona, true, { abandon: false });
    return () => { setDemo(false); restart(PERSONAS[0], false); loadLead(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openFile = (id) => go("apps", id);
  const allowed = (role) => !role || (role === "admin" && isAdmin);

  return (
    <div id="ops" className="adm">
      <header className="top">
        <div className="brand"><button className="mini adm-burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button><Logo /> <span className="pill">Staff console</span></div>
        <div className="row-wrap">
          <span className="small">{user.email} · {user.role}</span>
          <Link className="mini as-link" to="/">Website</Link>
          <button className="mini" onClick={logout}>Log out</button>
        </div>
      </header>
      <div className="adm-banner" role="note">Internal — contains consumer personal data. Every file view is logged. Don't screenshot or export outside approved tools.</div>
      <div className="adm-body">
        <nav className={"adm-nav" + (menu ? " open" : "")} aria-label="Console sections">
          {SECTIONS.map(([group, items]) => (
            <div key={group} className="adm-group">
              <p className="adm-gl">{group}</p>
              {items.filter(([, , r]) => allowed(r)).map(([id, label]) => (
                <button key={id} className={"adm-link" + (sec === id ? " on" : "")} aria-current={sec === id ? "page" : undefined} onClick={() => go(id)}>{label}</button>
              ))}
            </div>
          ))}
        </nav>
        <main className="adm-main">
          {sec === "dashboard" && <Admin go={go} />}
          {sec === "apps" && <Applications openId={fileId} setOpenId={(id) => go("apps", id)} />}
          {sec === "consents" && <Consents openFile={openFile} />}
          {sec === "disclosures" && <Disclosures />}
          {sec === "suppression" && <Suppression />}
          {sec === "states" && isAdmin && <States />}
          {sec === "providers" && <Providers />}
          {sec === "dropoffs" && <Dropoffs openFile={openFile} />}
          {sec === "access" && isAdmin && <AccessLog />}
          {sec === "users" && isAdmin && <Users />}
          {sec === "demo" && <DemoApp />}
          {sec === "library" && <Library />}
          {sec === "guide" && <DemoGuide />}
        </main>
      </div>
    </div>
  );
}
