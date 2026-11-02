import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../lib/api.js";
import { Alert, Check, Field, LangSwitch } from "../components/ui.jsx";
import { SiteLayout } from "../components/Layout.jsx";
import { purgeOfflineCache } from "../components/InstallCoach.jsx";

// "My data": no account, so this works off the application saved on this browser.
export default function Settings() {
  const { a, lang, loadLead } = useApp();
  const nav = useNavigate();
  const [app, setApp] = useState(undefined);
  const [prefs, setPrefs] = useState(null);
  const [del, setDel] = useState({ open: false, confirm: "", err: null });

  useEffect(() => {
    document.title = `${a.setH} · Debtify`;
    api.application().then((r) => {
      setApp(r.application);
      const c = r.application?.consents || [];
      if (c.length) setPrefs(Object.fromEntries(c.map((k) => [k.key, k.granted])));
    }).catch(() => setApp(null));
  }, [a.setH]);

  const setPref = async (k, v) => {
    setPrefs({ ...prefs, [k]: v });
    try { await api.preferences({ [k]: v }); } catch {}
  };
  const remove = async (e) => {
    e.preventDefault();
    try {
      await api.deleteMe(del.confirm.trim().toUpperCase());
      purgeOfflineCache();
      await loadLead();
      nav("/", { replace: true });
    } catch (e2) { setDel({ ...del, err: e2.message }); }
  };

  return (
    <SiteLayout>
      <div className="page narrow-page">
        <h1>{a.setH}</h1>

        <div className="panel stack">
          <h3>{a.langH}</h3>
          <LangSwitch />
        </div>

        {app === null && (
          <div className="panel stack">
            <p>{a.dashNone}</p>
            <p className="small">{a.dashNoneSub}</p>
            <Link className="btn as-link narrow" to="/apply">{a.nav.start}</Link>
          </div>
        )}

        {app && (
          <div className="panel stack">
            <h3>{lang === "es" ? "Tus datos de contacto" : "Your contact details"}</h3>
            <p className="small">{app.first} {app.last}{app.email ? ` · ${app.email}` : ""}{app.phoneMasked ? ` · ${app.phoneMasked}` : ""}</p>
            <p className="small">{lang === "es" ? "Para cambiarlos, escríbenos o llámanos desde la página de contacto." : "To change these, contact us from the contact page."} <Link to="/contact">{a.nav.contact}</Link></p>
          </div>
        )}

        {prefs && (
          <div className="panel stack" id="prefs">
            <h3>{a.prefsH}</h3>
            <Check checked={!!prefs.contact_partners} onChange={(v) => setPref("contact_partners", v)}>{a.prefCalls}</Check>
            <p className="small">{a.prefShare}</p>
          </div>
        )}

        {app && (
          <>
            <div className="panel stack">
              <h3>{a.dataH}</h3>
              <div className="row-wrap">
                <a className="mini as-link" href="/api/me/export" download>{a.exportBtn}</a>
              </div>
            </div>

            <div className="panel stack danger-zone">
              <h3>{a.deleteH}</h3>
              <p className="small">{a.deleteSub}</p>
              {del.open ? (
                <form className="stack" onSubmit={remove}>
                  <Field label={a.deleteConfirm} value={del.confirm} onChange={(v) => setDel({ ...del, confirm: v, err: null })} autoComplete="off" />
                  <Alert>{del.err}</Alert>
                  <button className="mini danger" disabled={del.confirm.trim().toUpperCase() !== "DELETE"}>{a.deleteGo}</button>
                </form>
              ) : <button className="mini danger" onClick={() => setDel({ ...del, open: true })}>{a.deleteBtn}</button>}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
