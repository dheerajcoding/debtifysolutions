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
          {BRAND.supportPhone && <a className="navlink hide-sm hdr-phone" href={`tel:${BRAND.supportPhone.replace(/[^+\d]/g, "")}`}>☎ {BRAND.supportPhone}</a>}
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
  const es = lang === "es";
  const tel = BRAND.supportPhone && BRAND.supportPhone.replace(/[^+\d]/g, "");
  return (
    <footer className="s-foot">
      <div className="s-footin">
        <div className="foot-grid">
          <div className="foot-brand">
            <Logo />
            <p className="foot-tag">{x.footTag}</p>
            <Link className="foot-cta" to="/apply">{x.cta}</Link>
          </div>
          <nav className="foot-col" aria-label={x.footExplore}>
            <h4>{x.footExplore}</h4>
            <Link to="/#how">{a.nav.how}</Link>
            <Link to="/#security">{es ? "Seguridad" : "Why trust us"}</Link>
            <Link to="/#faq">{es ? "Preguntas" : "FAQ"}</Link>
            <Link to="/apply">{a.nav.start}</Link>
          </nav>
          <nav className="foot-col" aria-label={x.footLegalH}>
            <h4>{x.footLegalH}</h4>
            <Link to="/privacy">{a.privacyL}</Link>
            <Link to="/terms">{a.termsL}</Link>
            <Link to="/legal/disclosures">{es ? "Divulgaciones" : "Disclosures"}</Link>
            {(meta?.analytics?.ga || meta?.analytics?.pixel) && <button type="button" className="linkbtn" onClick={openCookieSettings}>{es ? "Cookies" : "Cookie settings"}</button>}
          </nav>
          <div className="foot-col foot-contact">
            <h4>{x.footContact}</h4>
            {tel && <a className="foot-phone" href={`tel:${tel}`}>{BRAND.supportPhone}</a>}
            <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
            <p className="foot-addr"><b>{BRAND.legalName}</b><br />{BRAND.address}</p>
            {BRAND.licenses?.map((l) => <p key={l} className="foot-addr">{l}</p>)}
            <Link to="/contact" className="foot-more">{a.nav.contact} →</Link>
          </div>
        </div>
        <div className="foot-legalbox">
          <p className="foot-legal">{x.legal}</p>
          <p className="foot-posture">{x.posture || BRAND.posture}</p>
          <p className="foot-comp">{x.comp} {x.imgNote}</p>
        </div>
        {meta?.demoMode && <p className="demo-note">{x.stageNote}</p>}
        <div className="foot-base"><span>© {new Date().getFullYear()} Debtify</span></div>
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
