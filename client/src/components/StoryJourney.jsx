import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { SITE } from "../lib/copy.js";

const IMGS = ["/story/story-1.webp", "/story/story-2.webp", "/story/story-3.webp", "/story/story-4.webp"];
const POS = ["70% 40%", "40% 45%", "68% 40%", "50% 38%"];
const ENHANCED = "(min-width: 901px) and (prefers-reduced-motion: no-preference)";

// Four-stage journey. On desktop the section pins to the screen while the visitor scrolls and each
// stage wipes in over the last; on phones and for reduced-motion it is four stacked cards.
export default function StoryJourney() {
  const { lang } = useApp();
  const s = SITE[lang].story;
  const secRef = useRef(null), trackRef = useRef(null), pinRef = useRef(null), curRef = useRef(0);
  const [enh, setEnh] = useState(false);
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(-1);

  useEffect(() => {
    const mq = window.matchMedia(ENHANCED);
    const f = () => setEnh(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  useEffect(() => {
    if (!enh) return;
    const sec = secRef.current, track = trackRef.current, pin = pinRef.current;
    if (!sec || !track || !pin) return;
    let ticking = false;
    const apply = () => {
      ticking = false;
      const hdr = document.querySelector(".sitehead")?.offsetHeight || 64;
      sec.style.setProperty("--hdr", hdr + "px");
      const r = track.getBoundingClientRect();
      const span = r.height - pin.offsetHeight;
      if (span <= 0) return;
      const p = Math.max(0, Math.min(1, (hdr - r.top) / span));
      const k = Math.min(IMGS.length - 1, Math.floor(p * IMGS.length));
      if (k !== curRef.current) { setPrev(curRef.current); curRef.current = k; setCur(k); }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [enh]);

  return (
    <section className={"jstory" + (enh ? " enh" : "")} ref={secRef} aria-labelledby="jstoryH">
      <h2 className="sr-only" id="jstoryH">{s.sr}</h2>
      <div className="jstory-track" ref={trackRef}>
        <div className="jstory-pin" ref={pinRef}>
          {s.stages.map((g, i) => (
            <article key={g.k} className={"jstage" + (enh && i === cur ? " on" : enh && i === prev ? " prev" : "")} aria-label={g.k}>
              <figure className="jstage-media">
                <img src={IMGS[i]} alt={g.alt} style={{ objectPosition: POS[i] }} width="1600" height="900" decoding="async" loading={i ? "lazy" : "eager"} />              </figure>
              <div className="jstage-copy">
                <p className="jk">{g.k}</p>
                <h3>{g.h}</h3>
                <p className="jp">{g.p}</p>
                {i === 0 && (
                  <div className="jdebt"><small>{s.debtLabel}</small><b>{s.debtAmt}</b><span>{s.debtSub}</span></div>
                )}
                <div className="jctas">
                  <Link className="jbtn" to="/apply">{s.cta.primary}</Link>
                  <span className="jmicro">{s.micro}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="jstory-end">
        <h2>{s.cta.h}</h2>
        <p>{s.cta.p}</p>
        <div className="jstory-btns">
          <Link className="jbtn" to="/apply">{s.cta.primary}</Link>
          <Link className="jbtn ghost" to="/#how">{s.cta.secondary}</Link>
        </div>
      </div>
    </section>
  );
}
