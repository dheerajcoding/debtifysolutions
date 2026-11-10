import { useEffect, useState } from "react";
import { avatarVariant } from "../lib/viz.js";
import { Html } from "./ui.jsx";

// items: [line, who, photoUrl?, state?]. Review-style cards with a small round photo; they slide sideways, click a side card to bring it forward.
export default function Testimonials({ items }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;
  const half = Math.floor(n / 2);

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [paused, n]);

  const go = (i) => setActive(((i % n) + n) % n);

  return (
    <div className="rv" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="rv-stage" aria-live="polite">
        {items.map(([line, who, photo, state], i) => {
          const d = ((i - active + n + half) % n) - half;
          return (
            <figure
              key={who}
              className={"rv-card" + (d === 0 ? " on" : Math.abs(d) > 1 ? " far" : "")}
              style={{ "--d": d }}
              aria-hidden={d !== 0}
              onClick={() => d !== 0 && go(i)}
            >
              <span className="rv-q" aria-hidden="true">“</span>
              <span className="rv-photo">{photo ? <img src={photo} alt="" width="64" height="64" decoding="async" loading="lazy" /> : <Html html={avatarVariant(i)} />}</span>
              <div className="rv-body">
                <figcaption>{who}{state && <span className="rv-st"> · {state}</span>}</figcaption>
                <blockquote>{line}</blockquote>
              </div>
            </figure>
          );
        })}
      </div>
      <div className="rv-ctl">
        <button type="button" className="rv-arrow" aria-label="Previous" onClick={() => go(active - 1)}>‹</button>
        <div className="rv-dots" role="tablist">
          {items.map(([, who], i) => (
            <button key={who} type="button" role="tab" aria-selected={i === active} aria-label={who} className={i === active ? "on" : ""} onClick={() => go(i)}><i key={active} /></button>
          ))}
        </div>
        <button type="button" className="rv-arrow" aria-label="Next" onClick={() => go(active + 1)}>›</button>
      </div>
    </div>
  );
}
