import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { startReveal } from "./lib/reveal.js";
import { useApp } from "./context/AppContext.jsx";
import { Spinner } from "./components/ui.jsx";
import Consent from "./components/Consent.jsx";
import Home from "./pages/Home.jsx";
import Apply from "./pages/Apply.jsx";
import { DevOutbox, Forgot, Login, Reset } from "./pages/Auth.jsx";
import Dashboard, { Agreement } from "./pages/Dashboard.jsx";
import Settings from "./pages/Settings.jsx";
import Staff from "./pages/Staff.jsx";
import { Contact, NotFound, Privacy, Terms } from "./pages/Legal.jsx";
import { GuidePage, LegalDisclosures, StatePage } from "./pages/Content.jsx";

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
    </>
  );
}
