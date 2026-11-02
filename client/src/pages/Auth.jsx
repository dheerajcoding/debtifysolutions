import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../lib/api.js";
import { isEmail } from "../lib/format.js";
import { Alert, Field, PasswordField, Spinner } from "../components/ui.jsx";
import { Logo } from "../components/Layout.jsx";

export function AuthShell({ title, sub, children, foot }) {
  const { meta, a } = useApp();
  return (
    <div className="auth">
      <div className="auth-top"><Logo /></div>
      <div className="auth-card">
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
        {children}
        {foot && <div className="auth-foot">{foot}</div>}
      </div>
      {meta?.devMail && <p className="small center">{a.devMail} <Link to="/dev/outbox">{a.openOutbox}</Link></p>}
    </div>
  );
}

const next = (loc, fallback = "/staff") => {
  const n = new URLSearchParams(loc.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : fallback;
};

export function Login() {
  const { a, login } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(f.email) || !f.password) return setErr(a.loginSub);
    setBusy(true);
    setErr(null);
    try {
      await login(f);
      nav(next(loc, "/staff"), { replace: true });
    } catch (e2) {
      setErr(e2.message);
    }
    setBusy(false);
  };
  return (
    <AuthShell title={a.loginH} sub={a.loginSub} foot={<Link to="/apply">{a.nav.start} →</Link>}>
      <form onSubmit={submit} className="stack" noValidate>
        <Field label={a.email} type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} autoFocus />
        <PasswordField label={a.password} value={f.password} onChange={(v) => setF({ ...f, password: v })} />
        <Link className="small-link" to="/forgot-password">{a.forgot}</Link>
        <Alert>{err}</Alert>
        <button className="btn" disabled={busy}>{busy ? <Spinner /> : a.nav.login}</button>
      </form>
    </AuthShell>
  );
}

export function Forgot() {
  const { a } = useApp();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setErr(a.forgotSub);
    setBusy(true);
    try { await api.forgot(email); setDone(true); } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  return (
    <AuthShell title={a.forgotH} sub={done ? null : a.forgotSub} foot={<Link to="/staff/login">← {a.loginH}</Link>}>
      {done ? <Alert kind="ok">{a.forgotDone}</Alert> : (
        <form onSubmit={submit} className="stack" noValidate>
          <Field label={a.email} type="email" autoComplete="email" value={email} onChange={setEmail} autoFocus />
          <Alert>{err}</Alert>
          <button className="btn" disabled={busy}>{busy ? <Spinner /> : a.sendLink}</button>
        </form>
      )}
    </AuthShell>
  );
}

export function Reset() {
  const { a, setUser } = useApp();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api.reset(sp.get("token") || "", pw);
      setUser(r.user);
      nav("/staff", { replace: true });
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  return (
    <AuthShell title={a.resetH}>
      <form onSubmit={submit} className="stack" noValidate>
        <PasswordField label={a.newPassword} value={pw} onChange={setPw} showMeter autoComplete="new-password" />
        <Alert>{err}</Alert>
        <button className="btn" disabled={busy}>{busy ? <Spinner /> : a.resetBtn}</button>
      </form>
    </AuthShell>
  );
}

export function DevOutbox() {
  const [emails, setEmails] = useState(null);
  useEffect(() => {
    const load = () => api.outbox().then((r) => setEmails(r.emails)).catch(() => setEmails([]));
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <AuthShell title="Dev outbox" sub="Emails the app would send. Only available in development (no SMTP configured).">
      {!emails ? <Spinner /> : !emails.length ? <p className="small">No emails yet.</p> : (
        <div className="stack">
          {emails.map((m) => (
            <div key={m.id} className="card">
              <b>{m.subject}</b>
              <span className="small">To {m.to} · {new Date(m.at).toLocaleTimeString()}</span>
              {m.link && <a className="btn as-link" href={m.link.replace(/^https?:\/\/[^/]+/, "")}>Open link</a>}
            </div>
          ))}
        </div>
      )}
    </AuthShell>
  );
}
