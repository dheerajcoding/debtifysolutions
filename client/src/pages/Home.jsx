import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { AP, RISKS, SITE } from "../lib/copy.js";
import { AVATAR, HOW_ICONS, LOCK, SCALE, SHIELD, EXITDOOR, viz } from "../lib/viz.js";
import { usd } from "../lib/format.js";
import { Html } from "../components/ui.jsx";
import { SiteLayout } from "../components/Layout.jsx";
import Testimonials from "../components/Testimonials.jsx";
import StoryJourney from "../components/StoryJourney.jsx";
import { BRAND } from "@shared/config/brand.js";

const SEC_ICON = { lock: LOCK, shield: SHIELD, scale: SCALE, exit: EXITDOOR };
const FAQ_PICK =[1, 2, 3, 4, 6, 7];
const PHOTOS = ["cris", "martin", "marina", "hellen", "romario", "marrie"];
// Amounts mirror the server's sample tradelines that make up the $23,570 example plan.
const BILLS = [6240, 4815, 3190, 2420, 4720, 2185];
const BILL_COLORS = ["#5C7377", "#B3261E", "#F2A93B", "#0B7A6E", "#3CC2AE", "#8F5F00"];
const TICK = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" class="v-g"/><path d="M6 10l3 3 5-6" stroke="var(--on-accent)" stroke-width="2" fill="none"/></svg>';

// True once the element has scrolled into view (or straight away without IntersectionObserver / with reduced motion).
function useSeen(ref) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return seen;
}

// Counts a dollar amount up from 0 once `go` is true.
function CountUsd({ to, go, delay = 0 }) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!go || !(to > 0) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf, t0;
    const run = (t) => {
      t0 = t0 ?? t;
      const k = Math.min(1, Math.max(0, (t - t0 - delay) / 1200));
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    setV(0);
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [go, to]);
  return usd(v);
}

export default function Home() {
  const { lang, meta, lead, setUi, a, x: fx } = useApp();
  const nav = useNavigate();
  const glanceRef = useRef(null);
  const glanceIn = useSeen(glanceRef);
  // Curved guide lines from each debt card into the arrow, so the six debts visibly merge into one deposit.
  const [lines, setLines] = useState([]);
  useEffect(() => {
    const g = glanceRef.current;
    if (!g) return;
    const measure = () => {
      const arr = g.querySelector(".flow .arr"), bills = g.querySelectorAll(".bill");
      if (!arr || window.innerWidth <= 900) { setLines([]); return; }
      const ex = arr.offsetLeft, ey = arr.offsetTop + arr.offsetHeight / 2;
      setLines([...bills].map((b) => {
        // Clean right-angle connector: out of the card, along a shared rail, into the arrow.
        const sx = b.offsetLeft + b.offsetWidth, sy = b.offsetTop + b.offsetHeight / 2, rx = sx + Math.min(26, (ex - sx) / 2);
        return `M${sx} ${sy} H${rx} V${ey} H${ex}`;
      }));
    };
    measure();
    const ro = "ResizeObserver" in window ? new ResizeObserver(measure) : null;
    ro?.observe(g);
    window.addEventListener("resize", measure);
    return () => { ro?.disconnect(); window.removeEventListener("resize", measure); };
  }, [lang, !!meta?.sample]);
  const x = SITE[lang], ap = AP[lang];
  const guide = x.guide;
  const hp = meta?.sample;
  const resume = lead && lead.step > 1 && lead.step < 10;
  const faqs = FAQ_PICK.map((i) => x.faq[i]);
  // The sample plan reports ranges (honest estimates); render them as a range and
  // size the "est. total paid" bar off the upper end.
  const rng = (v) => (Array.isArray(v) ? v : [v, v]);
  const cost = rng(hp?.estTotalCost), term = rng(hp?.termMonths);
  const costText = hp ? (cost[0] === cost[1] ? usd(cost[0]) : `${usd(cost[0])} – ${usd(cost[1])}`) : "";
  const termText = hp ? (term[0] === term[1] ? `${term[0]}` : `${term[0]}–${term[1]}`) : "";
  const payW = hp ? Math.max(12, Math.min(100, Math.round((cost[1] / hp.enrolledDebt) * 100))) : 0;
  const start = (range) => {
    if (range) setUi({ debtRange: range });
    nav("/apply");
  };

  useEffect(() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans } })) });
    document.head.appendChild(el);
    return () => el.remove();
  }, [lang]);

  return (
    <SiteLayout>
      <div className="heroband">
        <section className="hero">
          <div className="hero-copy">
            <p className="s-eyebrow">{x.eyebrow}</p>
            <h1 className="s-h1">{x.h1}</h1>
            <p className="s-sub">{x.heroSub}</p>
            <div className="s-ctas">
              <button className="s-btn" onClick={() => start()}>{resume ? a.continueApp : ap.start}</button>
              <Link className="s-btn ghostbtn" to="/#how">{x.cta2}</Link>
            </div>
            <p className="hero-meta">{resume ? a.stepOf(lead.step, fx.stepNames[lead.step]) : ap.meta}</p>
            <ul className="trust">
              {x.chips.map((c) => (
                <li key={c}><Html as="span" className="ic" html={TICK} />{c}</li>
              ))}
            </ul>
            <div className="people-strip">
              <div className="ppl-stack">{PHOTOS.map((p) => <img key={p} src={`/testimonials/${p}.jpg`} alt="" width="40" height="40" decoding="async" />)}</div>
              <p>{x.peopleCap}</p>
            </div>
          </div>
          <div className="hv">
            <div className="hv-art"><img src="/testimonials/romario.jpg" alt="" width="640" height="640" fetchPriority="high" decoding="async" /></div>
            <span className="hv-float c"><i>☎</i>{x.f3}</span>
            <span className="hv-float b"><i>✓</i>{x.f1}</span>
          <div className={"plan" + (hp ? "" : " plan-wait")} aria-busy={!hp}>
            {!hp && <><span className="sk w40" /><span className="sk w100" /><span className="sk w100" /><span className="sk box" /></>}
            {hp && (
              <>
                <div className="plan-top"><span className="plan-tag">{ap.planTag}</span><span>{ap.planWhere}</span></div>
                <div className="plan-bars">
                  <div className="pbar">
                    <span>{ap.owe}</span>
                    <div className="track"><div className="fill owe" style={{ width: "100%" }}>{usd(hp.enrolledDebt)}</div></div>
                  </div>
                  <div className="pbar">
                    <span>{ap.pay}</span>
                    <div className="track"><div className="fill pay" style={{ width: `${payW}%` }}>{costText}</div></div>
                  </div>
                </div>
                <div className="plan-dep">
                  <span className="k">{ap.dep}</span>
                  <span className="v">{usd(hp.monthlyDeposit)}</span>
                  <small>{ap.depSub(termText)}</small>
                </div>
                <ul className="plan-steps">
                  {ap.planSteps.map((z, k) => (
                    <li key={z} className={k < 2 ? "ok" : ""}><span className="d">{k < 2 ? "✓" : 3}</span>{z}</li>
                  ))}
                </ul>
                <p className="plan-note">{ap.planNote}</p>
              </>
            )}
          </div>
          </div>
        </section>
      </div>

      <div className="trustrail-wrap">
        <section className="trustrail reveal" aria-label={x.howE}>
          <div className="tr-track">
            {[0, 1].map((k) => (
              <div className="tr-set" key={k} aria-hidden={k === 1}>
                {x.trustbar.map(([icon, label, sub], i) => (
                  <div className="tr-item" key={label} style={{ "--i": i }}>
                    <span className="tr-ic" aria-hidden="true">{icon}</span>
                    <div>
                      <p className="tr-h">{label}</p>
                      <p className="tr-p">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="s-sec reveal center-sec" id="glance">
        <p className="s-eyebrow">{x.glE}</p>
        <h2 className="s-h2">{x.glH}</h2>
        <div className={"glance " + (glanceIn ? "in" : "pre")} ref={glanceRef}>
          <div className="bills">
            <p className="cap">{x.glCap(hp?.includedTlIds?.length ?? BILLS.length, usd(hp?.enrolledDebt ?? BILLS.reduce((s, n) => s + n, 0)))}</p>
            {x.bills.map((b, i) => (
              <div key={i} className="bill" style={{ "--c": BILL_COLORS[i], "--i": i }}>
                <span>{b}</span><b><CountUsd to={BILLS[i]} go={glanceIn} delay={i * 90} /></b>
              </div>
            ))}
          </div>
          {lines.length > 0 && (
            <div className="gl-lines" aria-hidden="true">
              <svg>{lines.map((d, i) => <path key={i} d={d} pathLength="1" className="gl-line" style={{ "--i": i }} />)}</svg>
              {lines.map((d, i) => <span key={i} className="gl-dot" style={{ offsetPath: `path("${d}")`, "--i": i }} />)}
            </div>
          )}
          <div className="flow"><div className="arr" /><div className="badge">{x.glFlow}</div></div>
          <div className="acct">
            <div className="acct-top"><span className="lk" aria-hidden="true">🔒</span><div>{x.glAcct}</div></div>
            <div className="num">{hp ? <CountUsd to={hp.monthlyDeposit} go={glanceIn} delay={700} /> : "—"} <small>{x.glPer}</small></div>
            <p className="mo">{x.glMonths(termText || "36–42")}</p>
            <div className="prog"><i /></div>
            <p>{x.glProg}</p>
          </div>
        </div>
        <p className="gnote">{x.glSkip}</p>
      </section>

      <section className="s-sec reveal" id="how">
        <p className="s-eyebrow">{x.howE}</p>
        <h2 className="s-h2 how-h"><span className="nw"><span className="go">{x.howGo}</span><span className="arr" aria-hidden="true">→</span></span> <span>{x.howRest}</span></h2>
        <ol className="journey reveal">
          {x.how.map(([h], i) => (
            <li className="jn-step" key={h} style={{ "--i": i }}>
              <span className="jn-node">{i + 1}</span>
              <div className="jn-card">
                <Html as="span" className="jn-ic" html={HOW_ICONS[i]} />
                <h3>{h}</h3>
                <p>{x.howShort[i]}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="jn-guide">
          <span className="jn-avatar"><Html as="span" html={AVATAR} /></span>
          <div className="jn-bubble">
            <p className="gi-kicker">{guide.kicker} <span className="typing" aria-hidden="true"><i /><i /><i /></span></p>
            <p className="gi-blurb">{guide.blurb}</p>
          </div>
        </div>
      </section>

      <StoryJourney />

      <section className="s-sec tint security-sec reveal" id="security">
        <p className="s-eyebrow">{x.secE}</p>
        <h2 className="s-h2">{x.secH}</h2>
        <div className="sec-grid reveal-stagger">
          {x.security.map(([ic, h, p], i) => (
            <div className="sec-card" key={h} style={{ "--i": i }}>
              <Html className="sec-ic" html={SEC_ICON[ic]} />
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="s-sec reveal center-sec" id="stories">
        <p className="s-eyebrow">{x.storiesE}</p>
        <h2 className="s-h2">{x.storiesH}</h2>
        <Testimonials items={x.stories} />
        <Link className="s-btn stories-cta" to="/apply">{x.cta}</Link>
      </section>

      <section className="s-sec reveal center-sec" id="costs">
        <p className="s-eyebrow">{x.costE}</p>
        <h2 className="s-h2">{x.costH}</h2>
        <div className="cost-two">
          <div className="cost-benefit">
            <div className="cost-big">{x.cBig}</div>
            <p className="cost-sub">{x.cBigSub}</p>
            <ul className="cost-list">
              {x.cList.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <p className="cost-note">{x.cNote}</p>
          </div>
          <div className="cost-qual">
            <h3>{x.qTitle}</h3>
            <p className="lbl">{x.qCan}</p>
            <div className="qy">{x.qY.map((t) => <span key={t} className="tg y">{t}</span>)}</div>
            <p className="lbl">{x.qCant}</p>
            <div className="qy">{x.qN.map((t) => <span key={t} className="tg n">{t}</span>)}</div>
            <p className="qnote">{x.qNote}</p>
          </div>
        </div>
      </section>

      <section className="s-sec tint reveal" id="risks">
        <p className="s-eyebrow">{x.riskE}</p>
        <h2 className="s-h2">{x.riskH}</h2>
        <div className="risk-marquee">
          <div className="risk-set">
            {RISKS.map((r) => <div className="rcard risk-card" key={r.id}><Html html={viz(r.viz, lang)} /><h3>{r.title[lang]}</h3><p>{r.body[lang]}</p></div>)}
          </div>
        </div>
        <Link className="small-link" to="/legal/disclosures">{x.knowLink}</Link>
      </section>

      <section className="s-sec reveal" id="faq">
        <p className="s-eyebrow">{x.faqE}</p>
        <h2 className="s-h2">{x.faqH}</h2>
        <div className="faq">{faqs.map(([qq, ans]) => <details key={qq}><summary>{qq}</summary><p>{ans}</p></details>)}</div>
        <p className="posture">{x.posture || BRAND.posture}</p>
      </section>

      <section className="s-end">
        <img className="fside l" src="/footer/footer-1.png" alt="" width="800" height="522" loading="lazy" decoding="async" />
        <img className="fside r" src="/footer/footer-2.png" alt="" width="740" height="458" loading="lazy" decoding="async" />
        <h2 className="s-h2">{x.endH}</h2>
        <p>{x.endP}</p>
        <ul className="end-reassure">
          {x.endReassure.map((r) => <li key={r}><Html as="span" className="ic" html={TICK} />{r}</li>)}
        </ul>
        <Link className="s-btn" to="/apply">{x.cta}</Link>
      </section>
    </SiteLayout>
  );
}
