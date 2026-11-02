import { useId, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { pwStrength } from "../lib/format.js";

// Labeled input with hint and inline error message.
export function Field({ label, hint, error, value, onChange, type = "text", className = "", prefix, ...rest }) {
  const id = useId();
  return (
    <div className={"f " + className}>
      <label className="f-label" htmlFor={id}>{label}</label>
      <span className={"f-wrap" + (prefix ? " has-prefix" : "")}>
        {prefix && <span className="f-prefix">{prefix}</span>}
        <input
          id={id}
          className={"field" + (error ? " invalid" : "")}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? id + "-e" : hint ? id + "-h" : undefined}
          {...rest}
        />
      </span>
      {error ? <span className="f-err" id={id + "-e"} role="alert">{error}</span> : hint ? <span className="f-hint" id={id + "-h"}>{hint}</span> : null}
    </div>
  );
}

export function PasswordField({ label, value, onChange, error, showMeter = false, autoComplete = "current-password" }) {
  const { a } = useApp();
  const [show, setShow] = useState(false);
  const s = pwStrength(value);
  return (
    <div className="pw">
      <Field label={label} type={show ? "text" : "password"} value={value} onChange={onChange} error={error} autoComplete={autoComplete} hint={showMeter ? a.pwHint : undefined} />
      <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-pressed={show}>{show ? a.hide : a.show}</button>
      {showMeter && value ? (
        <div className={"meter m" + s} aria-live="polite">
          <i /><i /><i /><span>{a.strength[s]}</span>
        </div>
      ) : null}
    </div>
  );
}

export function Check({ checked, onChange, children, error }) {
  return (
    <label className={"check" + (error ? " invalid" : "")}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export const Alert = ({ children, kind = "err" }) => (children ? <p className={"alert " + kind} role={kind === "err" ? "alert" : "status"}>{children}</p> : null);

export function LangSwitch({ className = "" }) {
  const { lang, setLang } = useApp();
  return (
    <div className={"lang " + className} role="group" aria-label="Language / Idioma">
      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
    </div>
  );
}

export const Spinner = () => <span className="spinner" aria-hidden="true" />;

export function Html({ html, as: Tag = "div", className, ...rest }) {
  if (!html) return null;
  return <Tag className={className} {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}
