import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useApp } from "../context/AppContext.jsx";
import Flow from "../components/Flow.jsx";
import { Logo, StageProgress } from "../components/Layout.jsx";
import { LangSwitch, Spinner } from "../components/ui.jsx";

// Focused, full-screen application: logo, 4-stage progress, language, help. No distractions.
export default function Apply() {
  const { x, a, lang, lead, leadLoaded, openChat } = useApp();
  const step = lead ? lead.step : 1;
  useEffect(() => {
    document.title = "Apply · Debtify";
  }, []);

  return (
    <div className="apply">
      <header className="aptop">
        <div className="in">
          <Logo />
          <div className="right">
            <LangSwitch />
            <button type="button" className="aphelp" onClick={openChat}>{x.ask}</button>
            {lead && lead.step > 1 && <Link className="navlink hide-sm" to="/dashboard">{a.nav.dashboard}</Link>}
          </div>
        </div>
      </header>
      <div className="apwrap">
        <StageProgress step={step} />
        {!leadLoaded ? <p className="center pad"><Spinner /></p> : <Flow />}
        {step > 1 && step < 10 && <p className="saved-note">✓ {x.saved}</p>}
        {step < 10 && (
          <p className="flow-trust">
            <span>🔒 {lang === "es" ? "Encriptado" : "Encrypted"}</span>
            <span>💾 {lang === "es" ? "Se guarda a medida que avanzas" : "Saves as you go"}</span>
            <span>🧭 {lang === "es" ? "Jay está a un toque de distancia" : "Jay is one tap away"}</span>
          </p>
        )}
      </div>
    </div>
  );
}
