import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { AP, RISKS, SITE } from "../lib/copy.js";
import { AVATAR, HOW_ICONS, LOCK, SCALE, SHIELD, EXITDOOR, avatarVariant, viz } from "../lib/viz.js";
import { usd } from "../lib/format.js";
import { Html } from "../components/ui.jsx";
import { SiteLayout } from "../components/Layout.jsx";
import Testimonials from "../components/Testimonials.jsx";
import { BRAND } from "@shared/config/brand.js";

const SEC_ICON = { lock: LOCK, shield: SHIELD, scale: SCALE, exit: EXITDOOR };
const ico = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const TRUST_ICONS = [
  ico('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>'),
  ico('<path d="M12 3l7 3v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'),
  ico('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  ico('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>'),
];
const FAQ_PICK =[1, 2, 3, 4, 6, 7];
const TICK = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" class="v-g"/><path d="M6 10l3 3 5-6" stroke="var(--on-accent)" stroke-width="2" fill="none"/></svg>';

export default function Home() {
  const { lang, meta, lead, setUi, a, x: fx } = useApp();
  const nav = useNavigate();
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
          </div>
          <div className="plan">
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
        </section>
      </div>

      <div className="trustrail-wrap">
        <section className="trustrail reveal" aria-label={x.howE}>
          <div className="tr-track">
            {[0, 1].map((k) => (
              <div className="tr-set" key={k} aria-hidden={k === 1}>
                {x.trustbar.map(([, label, sub], i) => (
                  <div className="tr-item" key={label} style={{ "--i": i }}>
                    <Html as="span" className="tr-ic" html={TRUST_ICONS[i]} />
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

      <section className="s-sec tint security-sec reveal" id="security">
        <p className="s-eyebrow">{x.secE}</p>
        <h2 className="s-h2">{x.secH}</h2>
        <div className="sec-grid reveal-stagger">
          {x.security.map(([ic, h, p]) => (
            <div className="sec-card" key={h}>
              <Html className="sec-ic" html={SEC_ICON[ic]} />
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
        <div className="people-row">
          <div className="ppl-avatars">
            {[0, 1, 2, 3].map((i) => <Html key={i} html={avatarVariant(i)} />)}
          </div>
          <p className="ppl-cap">{x.peopleCap}</p>
        </div>
      </section>

      <section className="s-sec reveal" id="stories">
        <h2 className="s-h2">{x.storiesH}</h2>
        <Testimonials items={x.stories} />
      </section>

      <section className="s-sec tint reveal" id="risks">
        <p className="s-eyebrow">{x.riskE}</p>
        <h2 className="s-h2">{x.riskH}</h2>
        <div className="risk4">
          {RISKS.map((r) => <div className="rcard" key={r.id}><Html html={viz(r.viz, lang)} /><h3>{r.title[lang]}</h3><p>{r.body[lang]}</p></div>)}
        </div>
        <Link className="small-link" to="/legal/disclosures">{x.knowLink}</Link>
      </section>

      <section className="s-sec reveal" id="faq">
        <p className="s-eyebrow">{x.faqE}</p>
        <h2 className="s-h2">{x.faqH}</h2>
        <div className="faq">{faqs.map(([qq, ans]) => <details key={qq}><summary>{qq}</summary><p>{ans}</p></details>)}</div>
        <p className="posture">{BRAND.posture}</p>
      </section>

      <section className="s-end">
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
