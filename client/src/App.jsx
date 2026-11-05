import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { startReveal } from "./lib/reveal.js";
import { useApp } from "./context/AppContext.jsx";
import { Spinner } from "./components/ui.jsx";
import Consent from "./components/Consent.jsx";
import Home from "./pages/Home.jsx";

// Only the homepage ships in the first download; every other page loads when it is opened.
const part = (load, key) => lazy(() => load().then((m) => ({ default: key ? m[key] : m.default })));
const Apply = part(() => import("./pages/Apply.jsx"));
const DevOutbox = part(() => import("./pages/Auth.jsx"), "DevOutbox");
const Forgot = part(() => import("./pages/Auth.jsx"), "Forgot");
const Login = part(() => import("./pages/Auth.jsx"), "Login");
const Reset = part(() => import("./pages/Auth.jsx"), "Reset");
const Dashboard = part(() => import("./pages/Dashboard.jsx"));
const Agreement = part(() => import("./pages/Dashboard.jsx"), "Agreement");
const Settings = part(() => import("./pages/Settings.jsx"));
const Staff = part(() => import("./pages/Staff.jsx"));
const Contact = part(() => import("./pages/Legal.jsx"), "Contact");
const NotFound = part(() => import("./pages/Legal.jsx"), "NotFound");
const Privacy = part(() => import("./pages/Legal.jsx"), "Privacy");
const Terms = part(() => import("./pages/Legal.jsx"), "Terms");
const GuidePage = part(() => import("./pages/Content.jsx"), "GuidePage");
const LegalDisclosures = part(() => import("./pages/Content.jsx"), "LegalDisclosures");
const StatePage = part(() => import("./pages/Content.jsx"), "StatePage");

// Only the staff console needs a login. Customers never sign in: their application
// is tied to the browser they started it on.
const isStaff = (u) => u && ["staff", "admin"].includes(u.role);
function RequireStaff({ children }) {
  const { user } = useApp();
  const loc = useLocation();
  if (user === undefined) return <p className="center pad"><Spinner /></p>;
  if (!isStaff(user)) return <Navigate to={`/staff/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return children;
}
function StaffGuestOnly({ children }) {
  const { user } = useApp();
  if (user === undefined) return <p className="center pad"><Spinner /></p>;
  return isStaff(user) ? <Navigate to="/staff" replace /> : children;
}

function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 50);
    else window.scrollTo(0, 0);
    if (pathname === "/") document.title = "Debtify · Settle debt on your own terms";
    const t = setTimeout(startReveal, 60);
    // Keep canonical in sync with the current route
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = `https://godebtify.com${pathname === "/" ? "" : pathname}`;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", `https://godebtify.com${pathname === "/" ? "" : pathname}`);
    return () => clearTimeout(t);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Consent />
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/staff/login" element={<StaffGuestOnly><Login /></StaffGuestOnly>} />
        <Route path="/login" element={<Navigate to="/staff/login" replace />} />
        <Route path="/signup" element={<Navigate to="/apply" replace />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/reset-password" element={<Reset />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/agreement" element={<Agreement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/staff" element={<RequireStaff><Staff /></RequireStaff>} />
        <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
        <Route path="/how-it-works" element={<Navigate to="/#how" replace />} />
        <Route path="/alternatives" element={<Navigate to="/" replace />} />
        <Route path="/guides" element={<Navigate to="/" replace />} />
        <Route path="/guides/:slug" element={<GuidePage />} />
        <Route path="/states" element={<Navigate to="/" replace />} />
        <Route path="/states/:code" element={<StatePage />} />
        <Route path="/legal/disclosures" element={<LegalDisclosures />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dev/outbox" element={<DevOutbox />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
}
