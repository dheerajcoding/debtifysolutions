import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { PERSONAS } from "../lib/copy.js";
import { clock } from "../lib/format.js";
import Phone from "../components/Flow.jsx";
import Admin from "./Admin.jsx";
import Library from "./Library.jsx";

function Log() {
  const { logs } = useApp();
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);
  return (
    <div className="log" ref={ref} aria-live="polite">
      {logs.map((l, i) => (
        <div key={i}>
          <span className="t">{clock(l.at)}</span>
          <span className={"tag-" + l.tag}>{l.tag}</span>
          <span>{l.text}</span>
        </div>
      ))}
    </div>
  );
}

function DemoGuide() {
  return (
    <section className="panel guide-steps">
      <h3>A 6-minute demo script</h3>
      <ol>
        <li><b>Meet Jay.</b> Every screen opens with Jay, the guide, explaining what's being asked and why. Tap "Listen" to hear it, and "Why we ask" for the reason.</li>
        <li><b>Switch language.</b> Tap ES in the phone header. Every screen, consent, disclosure, quiz, the call transcript and the chat switch to Spanish.</li>
        <li><b>Happy path.</b> Pick "Maria, Texas" and click through. On screen 04, confirm the unclear account as a medical bill.</li>
        <li><b>Disclosures you can see.</b> Screens 07 and 08 show each point with a picture. Tap "Explain simpler" on one: that answer is saved and counted in the admin "Clarity" table.</li>
        <li><b>Ask a question.</b> Tap one of the question chips under Jay; the chat opens and answers it.</li>
        <li><b>Get paid.</b> On the welcome screen, press "Simulate backend: payment 1 cleared", then open Admin.</li>
        <li><b>Declines and handoff.</b> Try "Budget too tight" or "Call needs a person".</li>
      </ol>
      <p className="small">The MERN build of the Debtify MVP in mock mode: every step is processed by the Express API and saved to MongoDB (or the in-memory store). Spanish text and all consent and disclosure wording are drafts for counsel and native-speaker review. Backend names and rules are placeholders.</p>
    </section>
  );
}

const TABS = [["app", "Consumer app"], ["library", "Explainer library"], ["admin", "Admin dashboard"], ["guide", "How to demo"]];

// Staff console: test personas, live event log, admin and library.
export default function Ops() {
  const { persona, choosePersona, restart, meta } = useApp();
  const [tab, setTab] = useState("app");
  const store = meta?.offline ? "API offline" : meta?.store === "mongodb" ? "MongoDB" : meta ? "In-memory store" : "Connecting…";
  return (
    <div id="ops">
      <header className="top">
        <div className="brand">
          <button className="back" onClick={() => { history.replaceState(null, "", location.pathname + location.search); window.dispatchEvent(new HashChangeEvent("hashchange")); }}>← Website</button>
          Staff console <span className="pill">Staging · mock vendors</span>
          <span className={"pill live" + (meta && !meta.offline ? " on" : "")}>{store}</span>
          {meta?.claude && <span className="pill live on">Claude chat on</span>}
        </div>
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </header>
      <main className="wrap">
        {tab === "app" && (
          <section className="stage">
            <div><Phone /></div>
            <div className="side">
              <div className="panel">
                <div className="toolbar"><h3>Test personas</h3><button className="mini" onClick={() => restart(persona)}>Restart flow</button></div>
                <p className="small">Pick one, then press Continue on each screen. Switch English / Español in the phone header at any time. All vendors are simulated; the full SSN is never saved.</p>
                <div className="personas">
                  {PERSONAS.map((p) => (
                    <button key={p.id} className={"persona " + (p.id === persona.id ? "on" : "")} onClick={() => choosePersona(p)}>
                      <b>{p.name}</b><span>{p.note}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h3>Behind the scenes</h3>
                <Log />
              </div>
            </div>
          </section>
        )}
        {tab === "library" && <Library />}
        {tab === "admin" && <Admin />}
        {tab === "guide" && <DemoGuide />}
      </main>
    </div>
  );
}
