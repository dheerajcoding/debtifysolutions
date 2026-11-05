import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { SITE } from "../lib/copy.js";
import { MIN_LEFT, STAGE_OF } from "../lib/flowCopy.js";
import { LOGO } from "../lib/viz.js";
import { BRAND } from "@shared/config/brand.js";
import { Html, LangSwitch } from "./ui.jsx";
import { openCookieSettings } from "./Consent.jsx";

export const Logo = () => (
  <Link to="/" className="brandmark" aria-label="Debtify home">
    <Html as="span" html={LOGO} className="logo-wrap" />
    <b>Debtify</b>
  </Link>
);

export function Header() {
  const { user, a, lang, lead } = useApp();
  // A lead is "active" only while someone is mid-flow. Once it's enrolled, declined,
  // diverted, etc. it's done — show "My application" link to the dashboard but change
  // the CTA back to "Check my options" so they can start fresh if they want.
  const outcome = lead && (lead.outcome || "in_progress");
  const isActive = outcome === "in_progress";
  const isDone = lead && !isActive; // enrolled / declined / abandoned / etc.
  return (
    <header className="sitehead">
      <div className="in">
        <Logo />
        <nav id="siteNav" aria-label="Main">
          <Link to="/#how">{a.nav.how}</Link>
          <Link to="/#security">{lang === "es" ? "Seguridad" : "Why trust us"}</Link>
          <Link to="/#faq">{lang === "es" ? "Preguntas" : "FAQ"}</Link>
        </nav>
        <div className="right">
          <LangSwitch />
          {user && ["staff", "admin"].includes(user.role) && <Link className="navlink hide-sm" to="/staff">{a.nav.staff}</Link>}
          {/* Show "My application" only when there is an active or enrolled lead */}
          {lead && <Link className="navlink hide-sm" to="/dashboard">{a.nav.dashboard}</Link>}
          {/* CTA: "Continue" only while mid-flow; once done, reset to "Check my options" */}
          <Link id="siteCta" to="/apply">
            {isActive ? (lang === "es" ? "Continuar" : "Continue") : SITE[lang].cta}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { lang, a, meta } = useApp();
  const x = SITE[lang];
  return (
    <footer className="s-foot">
      <div className="s-footin">
        <p className="foot-legal">{x.legal}</p>
        <p className="foot-posture">{x.posture || BRAND.posture}</p>
        <div className="foot-pills">
          <span>{BRAND.legalName} · {BRAND.address}</span>
          <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
          {BRAND.supportPhone && <a href={`tel:${BRAND.supportPhone.replace(/[^+\d]/g, "")}`}>{BRAND.supportPhone}</a>}
          {BRAND.licenses?.map((l) => <span key={l}>{l}</span>)}
        </div>
        {meta?.demoMode && <p className="demo-note">{x.stageNote}</p>}
        <nav className="foot-bottom" aria-label="Footer">
          <span>© {new Date().getFullYear()} Debtify</span>
          <Link to="/privacy">{a.privacyL}</Link>
          <Link to="/terms">{a.termsL}</Link>
          <Link to="/legal/disclosures">{lang === "es" ? "Divulgaciones" : "Disclosures"}</Link>
          <Link to="/contact">{a.nav.contact}</Link>
          {(meta?.analytics?.ga || meta?.analytics?.pixel) && <button type="button" className="linkbtn" onClick={openCookieSettings}>{lang === "es" ? "Cookies" : "Cookie settings"}</button>}
        </nav>
      </div>
    </footer>
  );
}

function MobileCta() {
  const { lang, lead } = useApp();
  const outcome = lead && (lead.outcome || "in_progress");
  // Once someone is enrolled, pushing "check my options" is wrong — hide the bar.
  if (outcome && outcome !== "in_progress") return null;
  const inProgress = outcome === "in_progress";
  const label = inProgress ? (lang === "es" ? "Continuar donde quedaste" : "Continue where you left off") : SITE[lang].cta;
  const sub = lang === "es" ? "Unos 5 min · consulta suave · sin obligación" : "~5 min · soft check · no obligation";
  return (
    <div className="mobile-cta" role="region" aria-label={label}>
      <Link className="s-btn" to="/apply">{label}</Link>
      <p className="mc-sub">{sub}</p>
    </div>
  );
}

export function SiteLayout({ children }) {
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileCta />
    </>
  );
}

// 4-stage progress bar used on the application page and in the staff demo phone.
export function StageProgress({ step, compact = false }) {
  const { x } = useApp();
  const st = step ? STAGE_OF[step] : 0;
  const pct = step ? Math.min(100, ((step - 1) / 9) * 100 + 4) : 0;
  return (
    <div className={"stages" + (compact ? " compact" : "")}>
      <ol>
        {x.stages.map((name, i) => (
          <li key={name} className={i < st || step === 10 ? "done" : i === st && step ? "now" : ""}>
            <span className="dot">{i < st || step === 10 ? "✓" : i + 1}</span>
            <span className="nm">{name}</span>
          </li>
        ))}
      </ol>
      <div className="bar"><i style={{ width: `${step === 10 ? 100 : pct}%` }} /></div>
      {step > 0 && step < 10 && <p className="minleft">{x.stepNames[step]} · {x.minLeft(MIN_LEFT[step])}</p>}
    </div>
  );
}
