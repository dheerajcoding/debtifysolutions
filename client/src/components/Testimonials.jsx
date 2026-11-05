import { useEffect, useState } from "react";
import { avatarVariant } from "../lib/viz.js";
import { Html } from "./ui.jsx";

// items: [line, who, photoUrl?]. 3D coverflow that slides left to right.
export default function Testimonials({ items }) {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;
  const half = Math.floor(n / 2);
  const active = (((-tick) % n) + n) % n;

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, [paused, n]);

  const pick = (i) => setTick((v) => v + ((((-v) % n + n) % n - i + n) % n));

  return (
    <div className="cflow" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="cflow-stage" aria-live="polite">
        {items.map(([line, who, photo], i) => {
          const d = ((i - active + n + half) % n) - half;
          return (
            <figure
              key={who}
              className={"cflow-card" + (d === 0 ? " on" : Math.abs(d) > 1 ? " far" : "")}
              style={{ "--d": d }}
              aria-hidden={d !== 0}
              onClick={() => d !== 0 && pick(i)}
            >
              <div className="cflow-photo">{photo ? <img src={photo} alt={who} width="640" height="480" decoding="async" /> : <Html html={avatarVariant(i)} />}</div>
              <figcaption>{who}</figcaption>
              <blockquote>{line}</blockquote>
            </figure>
          );
        })}
      </div>
      <div className="cflow-dots" role="tablist">
        {items.map(([, who], i) => (
          <button key={who} type="button" role="tab" aria-selected={i === active} aria-label={who} className={i === active ? "on" : ""} onClick={() => pick(i)} />
        ))}
      </div>
    </div>
  );
}
