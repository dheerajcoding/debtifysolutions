import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { SiteLayout } from "../components/Layout.jsx";
import { BRAND } from "@shared/config/brand.js";

const MAIL = <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>;

// Starter legal pages. Placeholders in [brackets] must be completed and reviewed by counsel before launch.
const UPDATED = "October 2026";

function Doc({ title, children }) {
  useEffect(() => { document.title = `${title} · Debtify`; }, [title]);
  const { lang } = useApp();
  return (
    <SiteLayout>
      <article className="page doc legal">
        <h1>{title}</h1>
        <p className="small">Last updated {UPDATED}{lang === "es" ? " · La versión en español estará disponible pronto." : ""}</p>
        {children}
      </article>
    </SiteLayout>
  );
}

export function Privacy() {
  return (
    <Doc title="Privacy Policy">
      <h2>Who we are</h2>
      <p>{BRAND.name} ("we", "us") is a technology platform operated by {BRAND.legalName}, {BRAND.address}. We help you check eligibility for, and enroll in, debt settlement programs provided by licensed partner companies.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> name, email, mobile number and a securely hashed password.</li>
        <li><b>Application details:</b> state, approximate debt, payment situation, income and expenses, date of birth and address.</li>
        <li><b>Credit information:</b> the accounts returned by a soft credit inquiry you authorize.</li>
        <li><b>Social Security number:</b> used only to run the identity check and soft credit inquiry. We never store the full number; we keep only the last 4 digits.</li>
        <li><b>Usage data:</b> pages viewed and steps completed, to improve the application.</li>
      </ul>
      <h2>How we protect it</h2>
      <p>Data is encrypted in transit (HTTPS). Date of birth and address are encrypted at rest with AES-256. Passwords are hashed with bcrypt. Access is limited to staff who need it, and staff access is logged.</p>
      <h2>How we use and share it</h2>
      <ul>
        <li>To check eligibility and match you with a partner program, and to share your application with the partner you choose to enroll with.</li>
        <li>With identity, credit and bank-link providers that perform checks on our behalf.</li>
        <li>With other debt relief providers <b>only if you opt in</b>, and only if we can't help you.</li>
        <li>To send emails about your application, and deposit reminders by call or text <b>only if you opt in</b>. Reply STOP to opt out.</li>
      </ul>
      <p>We do not sell your personal information.</p>
      <h2>Your choices and rights</h2>
      <ul>
        <li>Change optional permissions at any time in <Link to="/settings">My data</Link> (on the device you applied from).</li>
        <li>Download a copy of your data from My data.</li>
        <li>Delete your personal details from My data, or ask us to. Some records may be kept where the law requires.</li>
        <li>Depending on your state (for example, California), you may have additional rights. Contact us at {MAIL}.</li>
      </ul>
      <h2>Cookies and analytics</h2>
      <p>The site works without cookies for advertising or measurement. If we use analytics or advertising pixels, they load only after you choose "Accept" in the cookie notice, and you can change your choice at any time using "Cookie settings" in the footer. We do not sell your personal information.</p>
      <h2>Retention</h2>
      <p>We keep application records for as long as needed to provide the service and to meet legal and regulatory record-keeping requirements, then delete or de-identify them.</p>
      <h2>Contact</h2>
      <p>{MAIL}{BRAND.supportPhone ? ` · ${BRAND.supportPhone}` : ""} · {BRAND.address}</p>
    </Doc>
  );
}

export function Terms() {
  return (
    <Doc title="Terms of Use">
      <h2>1. What Debtify is</h2>
      <p>Debtify is a technology platform. We are not a lender, law firm, credit repair organization or debt settlement company, and we do not negotiate with creditors. Programs, agreements and negotiations are provided by licensed partner companies named before you sign.</p>
      <h2>2. Eligibility</h2>
      <p>You must be at least 18, a US resident in a state where a partner program is available, and able to enter a binding agreement.</p>
      <h2>3. Your application</h2>
      <p>You don't need an account. Your application is saved on the device and browser you used, and your phone number is verified by a text-message code. You're responsible for information you provide being accurate.</p>
      <h2>4. Estimates</h2>
      <p>Estimates of deposits, program length, costs and savings are not offers or guarantees. Results depend on your creditors and on you keeping up your deposits.</p>
      <h2>5. Important risks</h2>
      <p>Debt settlement may hurt your credit, creditors may continue collection and may sue, balances may grow with fees and interest, and forgiven debt may be taxable.</p>
      <h2>6. Fees</h2>
      <p>Debtify does not charge you. Partner program fees are a percentage of enrolled debt and are charged only after a debt is settled and a payment is made under that settlement, as stated in your partner agreement.</p>
      <h2>7. Cancelling</h2>
      <p>You may cancel at any time with no penalty from Debtify. Money in your dedicated account remains yours, less any account fees.</p>
      <h2>8. Electronic communications</h2>
      <p>You agree to receive documents electronically and to sign electronically, as described during the application.</p>
      <h2>9. Acceptable use</h2>
      <p>Don't misuse the service, attempt to access other people's data, or interfere with its security.</p>
      <h2>10. Limitation of liability and disputes</h2>
      <p>To the fullest extent permitted by law, {BRAND.name} is not liable for indirect or consequential losses arising from your use of the service, and nothing here limits rights you have under applicable consumer-protection law. These terms are governed by the laws of {BRAND.governingLaw}, without regard to conflict-of-law rules.</p>
      <h2>11. Contact</h2>
      <p>{MAIL}{BRAND.supportPhone ? ` · ${BRAND.supportPhone}` : ""}</p>
    </Doc>
  );
}

export function Contact() {
  const { lead, openChat, lang } = useApp();
  const es = lang === "es";
  return (
    <Doc title={es ? "Contacto" : "Contact us"}>
      <div className="cols">
        <div className="panel stack">
          <h3>{es ? "Pregúntale a Jay" : "Ask Jay"}</h3>
          <p className="small">{es ? "Respuestas inmediatas sobre tarifas, crédito, plazos y lo que sigue." : "Instant answers about fees, credit, timing and what happens next."}</p>
          <Link className="btn as-link narrow" to={lead ? "/dashboard" : "/apply"} onClick={() => setTimeout(openChat, 50)}>{es ? "Abrir el chat" : "Open the chat"}</Link>
        </div>
        <div className="panel stack">
          <h3>{es ? "Habla con una persona" : "Talk to a person"}</h3>
          <p className="small">{es ? "Lunes a viernes, 9 a. m. a 6 p. m. (hora del Este)." : "Monday to Friday, 9am to 6pm Eastern."}</p>
          <p>{BRAND.supportPhone && <><b>{BRAND.supportPhone}</b><br /></>}{MAIL}</p>
          {lead && <p className="small">{es ? "Desde tu panel puedes pedir que te llamemos." : "From your dashboard you can request a call back."}</p>}
        </div>
      </div>
      <h2>{es ? "Si estás pasando por un momento difícil" : "If you're going through a hard time"}</h2>
      <p>{es ? "Si estás en peligro o piensas hacerte daño, llama o envía un mensaje al 988 (EE. UU.)." : "If you're in danger or thinking about harming yourself, call or text 988 (US)."}</p>
    </Doc>
  );
}

export function NotFound() {
  const { a } = useApp();
  // Tell search engines not to index unknown addresses, and fix the tab title.
  useEffect(() => {
    document.title = `${a.notFoundH} · Debtify`;
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);
  return (
    <SiteLayout>
      <div className="page center pad">
        <h1>{a.notFoundH}</h1>
        <p className="sub">{a.notFoundSub}</p>
        <Link className="btn as-link narrow" to="/">{a.home}</Link>
      </div>
    </SiteLayout>
  );
}
