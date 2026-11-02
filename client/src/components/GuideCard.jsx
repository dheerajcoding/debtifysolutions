import { GUIDE } from "../lib/copy.js";
import { AVATAR, viz } from "../lib/viz.js";
import Html from "./Html.jsx";

// Jay's speech bubble at the top of every screen: what's asked, why, a picture, and question chips.
export default function GuideCard({ step, lang, x, lead, ui, act }) {
  const g = GUIDE[step];
  if (!g) return null;
  const [say, why] = g[lang];
  const pic = g.viz ? viz(g.viz, lang, { inc: +ui.inc || 0, exp: +ui.exp || 0, p: lead?.program }) : "";
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  return (
    <div className="guide-card">
      <Html as="span" html={AVATAR} style={{ display: "contents" }} />
      <div className="bubble">
        <div className="who">
          <span>{x.guideRole}</span>
          {canSpeak && <button onClick={() => act.listen(step)}>🔊 {x.listen}</button>}
        </div>
        <p>{say}</p>
        {pic && <Html html={pic} />}
        <details>
          <summary>{x.why}</summary>
          <p>{why}</p>
        </details>
        <div className="chips">
          {g.q[lang].map((q) => (
            <button key={q} className="chip-q" onClick={() => act.askq(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
