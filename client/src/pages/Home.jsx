import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { AP, RISKS, SITE } from "../lib/copy.js";
import { AVATAR, EXITDOOR, HOW_ICONS, LOCK, SCALE, SHIELD, avatarVariant, viz } from "../lib/viz.js";

const SEC_ICON = { lock: LOCK, shield: SHIELD, scale: SCALE, exit: EXITDOOR };
import { usd } from "../lib/format.js";
import { Html } from "../components/ui.jsx";
import { SiteLayout } from "../components/Layout.jsx";
import { CONSEQUENCES, COST_FACTS } from "@shared/content/consequences.js";
import { OPTIONS, AUTOMATIC_STAY_NOTE } from "@shared/content/alternatives.js";
import { guidesByReviewDate } from "@shared/content/guides/index.js";
import { HOME_FAQS } from "@shared/content/pages.js";
import { BRAND } from "@shared/config/brand.js";

const NEED = {
  en: { h: "What you'll need", items: ["About 5 minutes", "Your monthly income and expenses", "Your Social Security number (for a soft check that won't hurt your score)", "Your bank login, if you decide to enroll"] },
  es: { h: "Lo que necesitas", items: ["Unos 5 minutos", "Tus ingresos y gastos mensuales", "Tu número de Seguro Social (para una consulta suave que no afecta tu puntaje)", "Los datos de tu banco, si decides inscribirte"] },
};

export default function Home() {
  const { lang, meta, lead, setUi, a, x: fx } = useApp();
  const nav = useNavigate();
  const x = SITE[lang], ap = AP[lang], need = NEED[lang];
  const guide = x.guide;
  const hp = meta?.sample;
  const resume = lead && lead.step > 1 && lead.step < 10;
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

  return (
    <SiteLayout>
      <div className="heroband">
        <section className="hero">
          <div className="hero-copy">
            <p className="s-eyebrow">{x.eyebrow}</p>
            <h1 className="s-h1">{x.h1}</h1>
            <p className="s-sub">{x.sub}</p>
            <div className="s-ctas">
              <button className="s-btn" onClick={() => start()}>{resume ? a.continueApp : ap.start}</button>
              <Link className="s-btn ghostbtn" to="/how-it-works">{x.cta2}</Link>
            </div>
            <p className="hero-meta">{resume ? a.stepOf(lead.step, fx.stepNames[lead.step]) : ap.meta}</p>
            <ul className="trust">
              {x.chips.map((c) => (
                <li key={c}><Html as="span" className="ic" html={'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" class="v-g"/><path d="M6 10l3 3 5-6" stroke="var(--on-accent)" stroke-width="2" fill="none"/></svg>'} />{c}</li>
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

      <section className="trustbar reveal-stagger">
        {x.trustbar.map(([icon, label, sub]) => (
          <div className="trust-tile" key={label}>
            <span className="tt-ic" aria-hidden="true">{icon}</span>
            <p className="tt-h">{label}</p>
            <p className="tt-p">{sub}</p>
          </div>
        ))}
      </section>

      <section className="people-row reveal">
        <div className="ppl-avatars">
          {[0, 1, 2, 3].map((i) => <Html key={i} html={avatarVariant(i)} />)}
        </div>
        <p className="ppl-cap">{x.peopleCap}</p>
      </section>

      <section className="s-sec help-sec tint reveal" id="help">
        <div className="help-head">
          <p className="s-eyebrow">{x.helpE}</p>
          <h2 className="s-h2">{x.helpH}</h2>
          <p className="s-p">{x.helpP}</p>
          <div className="guide-intro inline">
            <Html html={AVATAR} />
            <div>
              <p className="gi-kicker">{guide.kicker}</p>
              <p className="gi-blurb">{guide.blurb}</p>
            </div>
          </div>
        </div>
        <div className="help-wrap">
          <Html className="help-art" html={viz("journey", lang)} />
          <ol className="help-steps reveal-stagger">
            {x.helpSteps.map(([h, p], i) => (
              <li key={h}><span className="hs-n">{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="s-sec reveal" id="consequences">
        <p className="s-eyebrow">{lang === "es" ? "Lo primero que debes saber" : "The downsides, first"}</p>
        <h2 className="s-h2">{lang === "es" ? "Cinco cosas que te pasarán en un programa de liquidación" : "Five things that will happen to you in a settlement program"}</h2>
        <p className="s-p">{lang === "es" ? "No son letra pequeña: son cómo funciona. Cada una es también una pantalla que no puedes saltar en la solicitud." : "These are not risks or disclaimers. They are the mechanism. Every one is also a screen you can't click past inside the application, with the same wording as "}{lang !== "es" && <Link to="/legal/disclosures">our disclosures page</Link>}.</p>
        <ol className="cons-grid reveal-stagger">
          {CONSEQUENCES.map((c, i) => (
            <li key={c.key + i} className="rcard cons">
              <span className="chip c-bad">{i + 1} of {CONSEQUENCES.length}</span>
              <h3>{c.headline}</h3>
              <p>{c.detail}</p>
              <Link to={`/guides/${c.guide}`} className="small-link">Read the detail →</Link>
            </li>
          ))}
        </ol>
        <div className="note note-warn"><b>And one thing that will not happen</b><p>{AUTOMATIC_STAY_NOTE}</p></div>
      </section>

      <section className="s-sec reveal" id="how">
        <p className="s-eyebrow">{x.howE}</p>
        <h2 className="s-h2">{x.howH}</h2>
        <ol className="steps4">
          {x.how.map(([h, p], i) => (
            <li key={h}><Html className="ic" html={HOW_ICONS[i]} /><span className="n">{i + 1}</span><h3>{h}</h3><p>{p}</p></li>
          ))}
        </ol>
      </section>

      <section className="s-sec stack-figure tint reveal">
        <div>
          <p className="s-eyebrow">{x.qualE}</p>
          <h2 className="s-h2">{x.qualH}</h2>
          <p className="s-p">{x.qualP}</p>
        </div>
        <div className="figure stack">
          <Html html={viz("debtTypes", lang)} />
          <div>
            <h3>{need.h}</h3>
            <ul className="checklist">{need.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="s-sec security-sec reveal" id="security">
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
      </section>

      <section className="s-sec split2 reveal" id="costs">
        <div>
          <p className="s-eyebrow">{x.costE}</p>
          <h2 className="s-h2">{x.costH}</h2>
          {x.costP.map((p) => <p className="s-p" key={p}>{p}</p>)}
        </div>
        <Html className="figure" html={viz("feeTimeline", lang) + viz("moneyFlow", lang)} />
      </section>

      <section className="s-sec reveal" id="compare">
        <p className="s-eyebrow">{x.cmpE}</p>
        <h2 className="s-h2">{x.cmpH}</h2>
        <div className="tbl s-table">
          <table>
            <thead><tr>{x.cmpCols.map((c, i) => <th key={i} className={i === 1 ? "hl" : undefined}>{c}</th>)}</tr></thead>
            <tbody>{x.cmpRows.map((r) => <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th scope="row" key={i}>{c}</th> : <td key={i} className={i === 1 ? "hl" : undefined}>{c}</td>))}</tr>)}</tbody>
          </table>
        </div>
        <p className="small">{x.cmpNote}</p>
      </section>

      <section className="s-sec tint reveal" id="risks">
        <p className="s-eyebrow">{x.riskE}</p>
        <h2 className="s-h2">{x.riskH}</h2>
        <div className="risk4">
          {RISKS.map((r) => <div className="rcard" key={r.id}><Html html={viz(r.viz, lang)} /><h3>{r.title[lang]}</h3><p>{r.body[lang]}</p></div>)}
        </div>
      </section>

      <section className="s-sec reveal" id="states">
        <p className="s-eyebrow">{x.statesE}</p>
        <h2 className="s-h2">{x.statesH}</h2>
        <ul className="states">{(meta?.served || []).map((s) => <li key={s}>{s}</li>)}</ul>
        <p className="small">{x.statesP}</p>
      </section>

      <section className="s-sec reveal" id="faq">
        <p className="s-eyebrow">{x.faqE}</p>
        <h2 className="s-h2">{x.faqH}</h2>
        <div className="faq">{x.faq.map(([qq, ans]) => <details key={qq}><summary>{qq}</summary><p>{ans}</p></details>)}</div>
      </section>

      <section className="s-sec reveal">
        <p className="s-eyebrow">{lang === "es" ? "Costos" : "What it costs, stated as a cost"}</p>
        <ul className="cost-facts">{COST_FACTS.map((f, i) => <li key={i}>{f}</li>)}</ul>
        <Link className="small-link" to="/states">Fee caps by state →</Link>
      </section>

      <section className="s-sec tint reveal">
        <p className="s-eyebrow">{lang === "es" ? "Tus opciones" : "Your options"}</p>
        <h2 className="s-h2">{lang === "es" ? "Las cinco opciones, de la que menos cuesta a la que más" : "The five options, in the order that costs you least"}</h2>
        <ol className="opt-list reveal-stagger">{OPTIONS.map((o, i) => <li key={o.id}><span className="chip c-info">{i + 1}</span> <b>{o.name}.</b> {o.what}</li>)}</ol>
        <Link className="s-btn ghostbtn as-link" to="/alternatives">{lang === "es" ? "Ver la comparación completa" : "See the full comparison"}</Link>
      </section>

      <section className="s-sec reveal">
        <p className="s-eyebrow">{lang === "es" ? "Guías" : "Read before you decide"}</p>
        <div className="guide-grid reveal-stagger">
          {guidesByReviewDate().slice(0, 4).map((g) => (
            <Link key={g.slug} to={`/guides/${g.slug}`} className="card guide-card"><h3>{g.title}</h3><p className="small">{g.summary}</p></Link>
          ))}
        </div>
        <Link className="small-link" to="/guides">All guides →</Link>
      </section>

      <section className="s-sec reveal">
        <h2 className="s-h2">{lang === "es" ? "Preguntas sobre Debtify" : "About Debtify"}</h2>
        <div className="faq">{HOME_FAQS.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        <p className="posture">{BRAND.posture}</p>
      </section>

      <section className="s-end">
        <h2 className="s-h2">{x.endH}</h2>
        <p>{x.endP}</p>
        <ul className="end-reassure">
          {x.endReassure.map((r) => <li key={r}><Html as="span" className="ic" html={'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" class="v-g"/><path d="M6 10l3 3 5-6" stroke="var(--on-accent)" stroke-width="2" fill="none"/></svg>'} />{r}</li>)}
        </ul>
        <Link className="s-btn" to="/apply">{x.cta}</Link>
      </section>
    </SiteLayout>
  );
}
