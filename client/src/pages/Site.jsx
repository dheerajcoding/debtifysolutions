import { useApp } from "../context/AppContext.jsx";
import { AP, GUIDE, PERSONAS, RISKS, SITE } from "../lib/copy.js";
import { HOW_ICONS, LOGO, viz } from "../lib/viz.js";
import { suggestDate, usd } from "../lib/format.js";
import Html from "../components/Html.jsx";
import { Screen } from "../components/Screens.jsx";

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
};

export function LangSwitch() {
  const { lang, setLang } = useApp();
  return (
    <div className="lang" role="group" aria-label="Language">
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      <button aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
    </div>
  );
}

const noop = new Proxy({}, { get: () => () => {} });

// Static previews of all 12 screens using the sample Texas profile.
function Tour({ sample }) {
  const { x, lang } = useApp();
  if (!sample?.tourProgram) return null;
  const tradelines = sample.tourDebts.map((t) => (t.type === "OTHER" ? { ...t, confirmed: "MEDICAL" } : t));
  const lead = { first: "Maria", state: "TX", debt: 30000, tradelines, program: sample.tourProgram, clarity: { fee: "simpler" }, feeStatus: "NOT_EARNED", bankLinked: true, depositAccountLinked: true };
  const ui = {
    debt: 30000, state: "TX", hardship: { reason: 1, goal: 0, timing: 0 }, form: { ...PERSONAS[0].p },
    consents: { CREDIT_PULL: true, ESIGN: true, CALLS_TEXTS: true, SHARING: true }, tls: null, inc: 4200, exp: 3300,
    ack: true, answers: { fee: 2, credit: 0, sue: 1 }, wrong: [], draft: suggestDate(), call: [], err: null,
  };
  return (
    <div className="tour">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
        <figure className="tcard" key={s}>
          <div className="mini-frame">
            <div className="mini-screen" ref={(el) => el && el.setAttribute("inert", "")}>
              <div className="app">
                <div className="apphead">
                  <div className="row"><b>Debtify</b><span>{x.step} {s} {x.of} 12</span></div>
                  <div className="bar"><i style={{ width: `${(s / 12) * 100}%` }} /></div>
                  <span className="eyebrow">{x.steps[s]}</span>
                </div>
                <Screen step={s} x={x} lang={lang} lead={{ ...lead, step: s }} ui={ui} setUi={() => {}} act={noop} />
              </div>
            </div>
          </div>
          <figcaption>
            <b>{s}. {x.steps[s]}</b>
            <span>{GUIDE[s][lang][0].split(". ")[0]}.</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function Site() {
  const { lang, lead, meta, addLog } = useApp();
  const x = SITE[lang], a = AP[lang];
  const hp = meta?.sample?.hero;
  const served = meta?.served || [];
  const s = lead?.step || 1;
  const startLabel = lead && s > 1 && s < 12 && !lead.dropReason ? a.resume(s) : a.start;
  const apply = () => { addLog("UX", "CTA: check my options"); location.hash = "apply"; };

  return (
    <div id="site">
      <header className="sitehead">
        <div className="in">
          <div className="brandmark"><Html as="span" html={LOGO} style={{ display: "contents" }} /><b>Debtify</b></div>
          <nav id="siteNav" aria-label="Sections">
            {x.nav.map(([id, t]) => <button key={id} onClick={() => scrollToId(id)}>{t}</button>)}
          </nav>
          <div className="right">
            <span className="pill" id="stagePill">{x.staging}</span>
            <LangSwitch />
            <button id="siteCta" onClick={apply}>{x.cta}</button>
          </div>
        </div>
      </header>

      <div className="heroband">
        <section className="hero">
          <div className="hero-copy">
            <p className="s-eyebrow">{x.eyebrow}</p>
            <h1 className="s-h1">{x.h1}</h1>
            <p className="s-sub">{x.sub}</p>
            <div className="s-ctas">
              <button className="s-btn" onClick={apply}>{startLabel}</button>
              <button className="s-btn ghostbtn" onClick={() => scrollToId("how")}>{x.cta2}</button>
            </div>
            <p className="hero-meta">{a.meta}</p>
            <ul className="trust">
              {x.chips.map((c) => (
                <li key={c}>
                  <Html as="span" style={{ display: "contents" }} html={'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" class="v-g"/><path d="M6 10l3 3 5-6" stroke="var(--on-accent)" stroke-width="2" fill="none"/></svg>'} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="plan">
            {hp ? (
              <>
                <div className="plan-top"><span className="plan-tag">{a.planTag}</span><span>{a.planWhere}</span></div>
                <div className="plan-bars">
                  <div className="pbar"><span>{a.owe}</span><div className="track"><div className="fill owe" style={{ width: "100%" }}>{usd(hp.enrolledDebt)}</div></div></div>
                  <div className="pbar"><span>{a.pay}</span><div className="track"><div className="fill pay" style={{ width: `${Math.round((hp.estTotalCost / hp.enrolledDebt) * 100)}%` }}>{usd(hp.estTotalCost)}</div></div></div>
                </div>
                <div className="plan-dep"><span className="k">{a.dep}</span><span className="v">{usd(hp.monthlyDeposit)}</span><small>{a.depSub(hp.termMonths)}</small></div>
                <ul className="plan-steps">
                  {a.planSteps.map((z, k) => (
                    <li key={z} className={k < 2 ? "ok" : ""}><span className="d">{k < 2 ? "✓" : 3}</span>{z}</li>
                  ))}
                </ul>
                <p className="plan-note">{a.planNote}</p>
              </>
            ) : (
              <p className="small">{meta?.offline ? "API not reachable. Start the server on port 5000." : "Loading example plan…"}</p>
            )}
          </div>
        </section>
      </div>

      <div id="siteBody">
        <section className="s-sec" id="how">
          <p className="s-eyebrow">{x.howE}</p>
          <h2 className="s-h2">{x.howH}</h2>
          <ol className="steps4">
            {x.how.map(([h, p], i) => (
              <li key={h}><Html className="ic" html={HOW_ICONS[i]} /><span className="n">{i + 1}</span><h3>{h}</h3><p>{p}</p></li>
            ))}
          </ol>
        </section>
        <section className="s-sec split2">
          <div><p className="s-eyebrow">{x.qualE}</p><h2 className="s-h2">{x.qualH}</h2><p className="s-p">{x.qualP}</p></div>
          <Html className="figure" html={viz("debtTypes", lang)} />
        </section>
        <section className="s-sec split2 tint" id="costs">
          <div><p className="s-eyebrow">{x.costE}</p><h2 className="s-h2">{x.costH}</h2>{x.costP.map((p) => <p className="s-p" key={p}>{p}</p>)}</div>
          <Html className="figure" html={viz("feeTimeline", lang) + viz("moneyFlow", lang)} />
        </section>
        <section className="s-sec" id="compare">
          <p className="s-eyebrow">{x.cmpE}</p>
          <h2 className="s-h2">{x.cmpH}</h2>
          <div className="tbl s-table">
            <table>
              <thead><tr>{x.cmpCols.map((c, i) => <th key={i} className={i === 1 ? "hl" : undefined}>{c}</th>)}</tr></thead>
              <tbody>
                {x.cmpRows.map((r) => (
                  <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th scope="row" key={i}>{c}</th> : <td key={i} className={i === 1 ? "hl" : undefined}>{c}</td>))}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small">{x.cmpNote}</p>
        </section>
        <section className="s-sec" id="risks">
          <p className="s-eyebrow">{x.riskE}</p>
          <h2 className="s-h2">{x.riskH}</h2>
          <div className="risk4">
            {RISKS.map((r) => (
              <div className="rcard" key={r.id}><Html html={viz(r.viz, lang)} /><h3>{r.title[lang]}</h3><p>{r.body[lang]}</p></div>
            ))}
          </div>
        </section>
        <section className="s-sec tint" id="tour">
          <p className="s-eyebrow">{x.tourE}</p>
          <h2 className="s-h2">{x.tourH}</h2>
          <p className="s-p">{x.tourP}</p>
          <Tour sample={meta?.sample} />
        </section>
        <section className="s-sec" id="states">
          <p className="s-eyebrow">{x.statesE}</p>
          <h2 className="s-h2">{x.statesH}</h2>
          <ul className="states">{served.map((st) => <li key={st}>{st}</li>)}</ul>
          <p className="small">{x.statesP}</p>
        </section>
        <section className="s-sec" id="faq">
          <p className="s-eyebrow">{x.faqE}</p>
          <h2 className="s-h2">{x.faqH}</h2>
          <div className="faq">
            {x.faq.map(([q, ans]) => <details key={q}><summary>{q}</summary><p>{ans}</p></details>)}
          </div>
        </section>
        <section className="s-end">
          <h2 className="s-h2">{x.endH}</h2>
          <p>{x.endP}</p>
          <button className="s-btn" onClick={apply}>{x.cta}</button>
        </section>
        <footer className="s-foot">
          <div className="s-footin">
            <div className="brandmark"><Html as="span" html={LOGO} style={{ display: "contents" }} /><b>Debtify</b></div>
            <p>{x.legal}</p>
            <p className="demo-note">{x.stageNote}</p>
            <button className="linkbtn" onClick={() => (location.hash = "ops")}>{x.staff}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

