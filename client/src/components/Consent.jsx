import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const KEY = "debtify_cookie_consent";
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch {} };

let loaded = false;
function loadTrackers({ ga, pixel }) {
  if (loaded) return;
  loaded = true;
  if (ga) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga, { send_page_view: false, anonymize_ip: true });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
    document.head.appendChild(s);
  }
  if (pixel) {
    const f = (window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); });
    f.push = f; f.loaded = true; f.version = "2.0"; f.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", pixel);
  }
}

export function openCookieSettings() { window.dispatchEvent(new Event("debtify:cookie-settings")); }

export default function Consent() {
  const { meta, lang } = useApp();
  const { pathname } = useLocation();
  const ga = meta?.analytics?.ga || "", pixel = meta?.analytics?.pixel || "";
  const enabled = !!(ga || pixel);
  const [choice, setChoice] = useState(read);
  const es = lang === "es";

  useEffect(() => {
    const reopen = () => { write(null); setChoice(null); };
    window.addEventListener("debtify:cookie-settings", reopen);
    return () => window.removeEventListener("debtify:cookie-settings", reopen);
  }, []);

  useEffect(() => {
    if (enabled && choice === "granted") loadTrackers({ ga, pixel });
  }, [enabled, choice, ga, pixel]);

  useEffect(() => {
    if (!enabled || choice !== "granted") return;
    const t = setTimeout(() => {
      window.gtag?.("event", "page_view", { page_path: pathname, page_location: location.href, page_title: document.title });
      window.fbq?.("track", "PageView");
    }, 400);
    return () => clearTimeout(t);
  }, [enabled, choice, pathname]);

  if (!enabled || choice) return null;
  const pick = (v) => { write(v); setChoice(v); };
  return (
    <div className="cookie-bar" role="region" aria-label={es ? "Aviso de cookies" : "Cookie notice"}>
      <p>
        {es
          ? "Usamos cookies de medición para mejorar el sitio. Puedes aceptarlas o rechazarlas. "
          : "We use measurement cookies to improve the site. You can accept or decline. "}
        <Link to="/privacy">{es ? "Política de privacidad" : "Privacy policy"}</Link>
      </p>
      <div className="cookie-btns">
        <button type="button" className="ghost" onClick={() => pick("denied")}>{es ? "Rechazar" : "Decline"}</button>
        <button type="button" onClick={() => pick("granted")}>{es ? "Aceptar" : "Accept"}</button>
      </div>
    </div>
  );
}
