import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { SITE } from "../lib/copy.js";

const IMGS = ["/story/story-1.webp", "/story/story-2.webp", "/story/story-3.webp", "/story/story-4.webp"];
const POS = ["70% 40%", "40% 45%", "68% 40%", "50% 38%"];
const ENHANCED = "(min-width: 901px) and (prefers-reduced-motion: no-preference)";

const DWELL = 5000; // ms each stage stays before the next one wipes in

// Four-stage journey. On desktop the stages advance by themselves while the section is on screen
// (paused only while the pointer or keyboard focus is on a button); on phones and for reduced-motion it is four stacked cards.
export default function StoryJourney() {
  const { lang } = useApp();
  const s = SITE[lang].story;
  const pinRef = useRef(null), curRef = useRef(0);
  const [enh, setEnh] = useState(false);
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false); // visitor pressed pause

  useEffect(() => {
    const mq = window.matchMedia(ENHANCED);
    const f = () => setEnh(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  // Only run while the section is actually on screen.
  useEffect(() => {
    const el = pinRef.current;
    if (!enh || !el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [enh]);

  useEffect(() => {
    if (!enh || !visible || paused || stopped) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      const k = (curRef.current + 1) % IMGS.length;
      setPrev(curRef.current);
      curRef.current = k;
      setCur(k);
    }, DWELL);
    return () => clearInterval(id);
  }, [enh, visible, paused, stopped]);

  return (
    <section className={"jstory" + (enh ? " enh" : "")} aria-labelledby="jstoryH">
      <h2 className="sr-only" id="jstoryH">{s.sr}</h2>
      <div className="jstory-track">
        <div className="jstory-pin" ref={pinRef}>
          {s.stages.map((g, i) => (
            <article key={g.k} className={"jstage" + (enh && i === cur ? " on" : enh && i === prev ? " prev" : "")} aria-label={g.k}>
              <figure className="jstage-media">
                <img src={IMGS[i]} alt={g.alt} style={{ objectPosition: POS[i] }} width="1600" height="900" decoding="async" loading={i ? "lazy" : "eager"} />              </figure>
              <div className="jstage-copy">
                <p className="jk">{g.k}</p>
                <h3>{g.h}</h3>
                <p className="jp">{g.p}</p>
                {g.b && <ul className="jb">{g.b.map((t) => <li key={t}>{t}</li>)}</ul>}
                {i === 0 && (
                  <div className="jdebt"><small>{s.debtLabel}</small><b>{s.debtAmt}</b><span>{s.debtSub}</span></div>
                )}
                <div className="jctas" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
                  <Link className="jbtn" to="/apply">{g.cta}</Link>
                  <span className="jmicro">{s.micro} · <Link to="/legal/disclosures">{s.disc}</Link></span>
                </div>
              </div>
            </article>
          ))}
          {enh && (
            <button type="button" className="jpause" aria-pressed={stopped} aria-label={stopped ? (lang === "es" ? "Reanudar" : "Play") : (lang === "es" ? "Pausar" : "Pause")} onClick={() => setStopped((v) => !v)}>
              {stopped ? "▶" : "❚❚"}
            </button>
          )}
        </div>
      </div>
      <div className="jstory-end">
        <h2>{s.cta.h}</h2>
        <p>{s.cta.p}</p>
        <div className="jstory-btns">
          <Link className="jbtn" to="/apply">{s.cta.primary}</Link>
          <Link className="jbtn ghost" to="/#how">{s.cta.secondary}</Link>
        </div>
        <p className="jstory-fine">{s.micro} · <Link to="/legal/disclosures">{s.disc}</Link></p>
      </div>
    </section>
  );
}
