import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { SiteLayout } from "../components/Layout.jsx";
import { NotFound } from "./Legal.jsx";
import { BRAND } from "@shared/config/brand.js";
import { DISCLOSURES } from "@shared/config/disclosures.js";
import { CONSENTS } from "@shared/config/consents.js";
import { CONSENTS_ES, DISCLOSURES_ES } from "@shared/config/es.js";
import { OPTIONS, AUTOMATIC_STAY_NOTE } from "@shared/content/alternatives.js";
import { CLUSTERS, GUIDES, guideBySlug, guidesInCluster, relatedGuides } from "@shared/content/guides/index.js";
import { tocOf, readingMinutesOf, formatReviewDate } from "@shared/content/types.js";
import { allStateProfiles, stateProfile, GARNISHMENT_LABEL, STATE_LAW_CAVEAT } from "@shared/content/states.js";
import { HOW_PHASES, HOW_FAQS, ALT_FAQS, STATES_FAQS, buildStateFaqs, feeCapLabel, PAGE_META } from "@shared/content/pages.js";

function useMeta(title, description) {
  useEffect(() => {
    document.title = `${title} · ${BRAND.name}`;
    const m = document.querySelector('meta[name="description"]');
    if (m && description) m.setAttribute("content", description);
  }, [title, description]);
}

const EnglishOnly = () => {
  const { lang } = useApp();
  return lang === "es" ? <p className="alert info">Esta página está en inglés por ahora. La solicitud y tu panel están en español.</p> : null;
};

export function FAQ({ items, title = "Questions" }) {
  return (
    <section className="c-sec">
      <h2>{title}</h2>
      <div className="faq one">{items.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
    </section>
  );
}

function CTA({ title = "See your real options", sub = "About five minutes. No sales call. Nothing pre-checked." }) {
  return (
    <section className="s-end c-end">
      <h2 className="s-h2">{title}</h2>
      <p>{sub}</p>
      <div className="row-wrap center-row">
        <Link className="s-btn" to="/apply">Start the check</Link>
        <Link className="s-btn ghostbtn-dark" to="/alternatives">Compare all options first</Link>
      </div>
    </section>
  );
}

const Posture = () => <p className="posture">{BRAND.posture}</p>;

// Renders typed article blocks. There is no raw-HTML path: the renderer owns the markup.
function Prose({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.kind) {
      case "p": return <p key={i}>{b.text}</p>;
      case "h2": return <h2 key={i} id={b.id}>{b.text}</h2>;
      case "h3": return <h3 key={i}>{b.text}</h3>;
      case "ul": return <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>;
      case "ol": return <ol key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ol>;
      case "note": return <div key={i} className={"note note-" + b.tone}>{b.title && <b>{b.title}</b>}{b.body.map((t, j) => <p key={j}>{t}</p>)}</div>;
      case "definition": return <p key={i} className="definition"><b>{b.term}.</b> {b.text}</p>;
      case "table":
        return (
          <figure key={i} className="tbl"><table>
            {b.caption && <caption>{b.caption}</caption>}
            <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
          </table></figure>
        );
      default: return null;
    }
  });
}

// ------------------------------------------------------------------ how it works
export function HowItWorks() {
  const m = PAGE_META.how;
  useMeta(m.title, m.description);
  return (
    <SiteLayout>
      <article className="page doc content">
        <p className="s-eyebrow">How it works</p>
        <h1>{m.title}</h1>
        <p className="lede">{m.description}</p>
        <EnglishOnly />
        <Posture />
        <ol className="phase-list reveal-stagger">
          {HOW_PHASES.map((p) => {
            const [lead, ...rest] = p.body;
            const hasMore = rest.length > 0 || p.points.length > 0 || p.exit;
            return (
              <li key={p.n} className="card phase">
                <div className="row-between"><h2>{p.n}. {p.name}</h2><span className="chip c-info">{p.minutes}</span></div>
                <p>{lead}</p>
                {hasMore && (
                  <details className="more">
                    <summary>What happens in this step</summary>
                    <div className="more-body">
                      {rest.map((t, i) => <p key={i}>{t}</p>)}
                      {p.points.length > 0 && <ul>{p.points.map((t, i) => <li key={i}>{t}</li>)}</ul>}
                      {p.exit && <p className="note note-warn"><b>Where it can stop:</b> {p.exit}</p>}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
        <FAQ items={HOW_FAQS} />
      </article>
      <CTA />
    </SiteLayout>
  );
}

// ------------------------------------------------------------------ alternatives
export function Alternatives() {
  const m = PAGE_META.alternatives;
  useMeta(m.title, m.description);
  // Lead with the three things people actually compare on; the rest stays one tap away.
  const rows = [["What it is", "what"], ["What it costs", "cost"], ["Credit", "credit"]];
  const moreRows = [["Timeline", "timeline"], ["Tends to suit", "suits"], ["The downside", "downside"], ["Where to go", "where"]];
  return (
    <SiteLayout>
      <article className="page doc content wide">
        <p className="s-eyebrow">Your options</p>
        <h1>{m.title}</h1>
        <p className="lede">{m.description}</p>
        <EnglishOnly />
        <div className="note note-stop"><b>The one difference that matters most</b><p>{AUTOMATIC_STAY_NOTE}</p></div>
        <div className="opt-grid reveal-stagger">
          {OPTIONS.map((o, i) => (
            <section key={o.id} className="card opt" id={o.id}>
              <span className="chip c-info">{i + 1} of {OPTIONS.length}</span>
              <h2>{o.name}</h2>
              <dl>{rows.map(([label, k]) => <div key={k}><dt>{label}</dt><dd>{o[k]}</dd></div>)}</dl>
              <details className="more">
                <summary>Timeline, trade-offs and where to go</summary>
                <dl>{moreRows.map(([label, k]) => <div key={k}><dt>{label}</dt><dd>{o[k]}</dd></div>)}</dl>
              </details>
            </section>
          ))}
        </div>
        <FAQ items={ALT_FAQS} />
      </article>
      <CTA />
    </SiteLayout>
  );
}

// ------------------------------------------------------------------ guides
export function GuidesIndex() {
  const m = PAGE_META.guides;
  useMeta(m.title, m.description);
  return (
    <SiteLayout>
      <article className="page doc content">
        <p className="s-eyebrow">Guides</p>
        <h1>{m.title}</h1>
        <p className="lede">{m.description}</p>
        <EnglishOnly />
        {CLUSTERS.map((c) => {
          const gs = guidesInCluster(c.id);
          if (!gs.length) return null;
          return (
            <section key={c.id} className="c-sec">
              <h2>{c.title}</h2>
              <p className="small">{c.blurb}</p>
              <div className="guide-grid reveal-stagger">
                {gs.map((g) => (
                  <Link key={g.slug} to={`/guides/${g.slug}`} className="card guide-card">
                    <h3>{g.title}</h3>
                    <p className="small">{g.summary}</p>
                    <span className="small">{readingMinutesOf(g)} min read · Reviewed {formatReviewDate(g.lastReviewedISO)}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </article>
    </SiteLayout>
  );
}

function Byline({ g }) {
  return (
    <div className="byline">
      <p><b>{g.author.name}</b>, {g.author.role}{g.reviewedBy ? <> · Reviewed by <b>{g.reviewedBy.name}</b>, {g.reviewedBy.role}</> : null}</p>
      <p className="small">Published {formatReviewDate(g.publishedISO)} · Last reviewed {formatReviewDate(g.lastReviewedISO)} · {readingMinutesOf(g)} min read</p>
    </div>
  );
}

export function GuidePage() {
  const { slug } = useParams();
  const g = guideBySlug(slug);
  useMeta(g ? g.metaTitle : "Not found", g?.metaDescription);
  useEffect(() => {
    if (!g) return;
    // Article + FAQ structured data for search engines.
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.text = JSON.stringify([
      { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.metaDescription, datePublished: g.publishedISO, dateModified: g.lastReviewedISO, author: { "@type": "Person", name: g.author.name } },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ]);
    document.head.appendChild(el);
    return () => el.remove();
  }, [g]);
  if (!g) return <NotFound />;
  const toc = tocOf(g);
  return (
    <SiteLayout>
      <article className="page doc content guide">
        <nav className="crumbs"><Link to="/guides">Guides</Link> / <span>{CLUSTERS.find((c) => c.id === g.cluster)?.title}</span></nav>
        <h1>{g.title}</h1>
        <p className="lede">{g.summary}</p>
        <Byline g={g} />
        <EnglishOnly />
        {toc.length > 2 && (
          <nav className="toc card"><b>On this page</b><ol>{toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol></nav>
        )}
        <div className="prose"><Prose blocks={g.blocks} /></div>
        {g.faqs.length > 0 && <FAQ items={g.faqs} />}
        <section className="c-sec">
          <h2>How we can stand behind this page</h2>
          <ul className="small">{g.substantiation.map((s, i) => <li key={i}>{s}</li>)}</ul>
          {g.sources.length > 0 && <><h3>Sources</h3><ul className="small">{g.sources.map((s) => <li key={s.href}><a href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul></>}
        </section>
        <section className="c-sec author-box card">
          <b>{g.author.name}</b><p className="small">{g.author.bio}</p>
          {g.reviewedBy && <><b>{g.reviewedBy.name}</b><p className="small">{g.reviewedBy.bio}</p></>}
        </section>
        {relatedGuides(g).length > 0 && (
          <section className="c-sec">
            <h2>Read next</h2>
            <div className="guide-grid reveal-stagger">{relatedGuides(g).map((r) => <Link key={r.slug} to={`/guides/${r.slug}`} className="card guide-card"><h3>{r.title}</h3><p className="small">{r.summary}</p></Link>)}</div>
          </section>
        )}
        <Posture />
      </article>
      <CTA />
    </SiteLayout>
  );
}

// ------------------------------------------------------------------ states
export function StatesIndex() {
  const m = PAGE_META.states;
  useMeta(m.title, m.description);
  const all = allStateProfiles();
  const open = all.filter((s) => s.open), closed = all.filter((s) => !s.open);
  const Grid = ({ list }) => (
    <div className="state-grid reveal-stagger">{list.map((s) => (
      <Link key={s.code} to={`/states/${s.code.toLowerCase()}`} className={"card state-card" + (s.open ? "" : " closed")}>
        <b>{s.name}</b>
        <span className="small">{s.open ? `${s.providers.length} partner${s.providers.length === 1 ? "" : "s"} · fee ${feeCapLabel(s)}` : "No partner on our panel"}</span>
      </Link>
    ))}</div>
  );
  return (
    <SiteLayout>
      <article className="page doc content wide">
        <p className="s-eyebrow">By state</p>
        <h1>{m.title}</h1>
        <p className="lede">{m.description}</p>
        <EnglishOnly />
        <section className="c-sec"><h2>Where a licensed partner is available ({open.length})</h2><Grid list={open} /></section>
        <section className="c-sec"><h2>Where we have nothing to offer ({closed.length})</h2><p className="small">We say so here rather than collecting your details. Each page still explains your state's rules.</p><Grid list={closed} /></section>
        <FAQ items={STATES_FAQS} />
      </article>
    </SiteLayout>
  );
}

export function StatePage() {
  const { code } = useParams();
  const p = stateProfile(String(code || "").toUpperCase());
  useMeta(p ? `Debt settlement in ${p.name}` : "Not found", p ? `Whether a licensed partner serves ${p.name}, the fee cap, the limitation period on credit card debt and what a judgment can reach in ${p.name}.` : "");
  if (!p) return <NotFound />;
  const { name, facts, open, providers } = p;
  const garn = facts.wageGarnishment === "prohibited"
    ? `${name} does not permit wage garnishment for ordinary consumer debt, which makes a judgment less dangerous here than in most states. It is not harmless: a judgment can still reach your bank accounts and attach as a lien to property you own.`
    : facts.wageGarnishment === "stricter"
      ? `${name} permits wage garnishment after judgment but limits it more tightly than federal law. That reduces the monthly bite without removing the risk, and a bank levy or a property lien is still available to a judgment creditor.`
      : `${name} permits wage garnishment after judgment at the federal ceiling, which is the most exposed position. If you are considering stopping payments, this is the risk to weigh most heavily.`;
  const sol = facts.solYears <= 3 ? "at the short end of the national range" : facts.solYears >= 8 ? "at the long end of the national range" : "in the middle of the national range";
  return (
    <SiteLayout>
      <article className="page doc content">
        <nav className="crumbs"><Link to="/states">States</Link> / <span>{name}</span></nav>
        <div className="row-wrap"><h1>Debt settlement in {name}</h1><span className={"chip " + (open ? "c-good" : "c-warn")}>{open ? "Partner available" : "Not available"}</span></div>
        <EnglishOnly />
        {open ? (
          <div className="note note-info"><p>At least one provider on our panel is licensed to contract with a {name} resident. The fee is <b>{feeCapLabel(p)}</b>, charged on the debt you enroll rather than on anything a negotiation achieves. Nothing is payable until a debt has been settled, you have agreed to it and you have paid on it.</p></div>
        ) : (
          <div className="note note-stop"><b>There is no program here for you</b><p>No provider on our panel holds the licence or registration required to offer a settlement program to a {name} resident. We tell you that here rather than collecting your details.</p>{facts.closedNote && <p>{facts.closedNote}</p>}<p>The rest of this page still applies to you.</p></div>
        )}
        <section className="c-sec">
          <h2>What {name} law means for you</h2>
          <figure className="tbl"><table><tbody>
            <tr><th scope="row">Licensed partner on our panel</th><td>{open ? `Yes (${providers.length})` : "No"}</td></tr>
            <tr><th scope="row">Statutory fee cap</th><td>{feeCapLabel(p)}</td></tr>
            <tr><th scope="row">Limitation period on an unpaid card</th><td>About {facts.solYears} years{facts.solNote ? ` — ${facts.solNote}` : ""}</td></tr>
            <tr><th scope="row">Wage garnishment after judgment</th><td><b>{GARNISHMENT_LABEL[facts.wageGarnishment]}</b>. {facts.garnishmentNote}</td></tr>
            <tr><th scope="row">Where a collection suit is heard</th><td>Typically the {facts.court}.</td></tr>
            <tr><th scope="row">Who to check a licence with</th><td>{facts.regulator}</td></tr>
          </tbody></table></figure>
          <p>{facts.context}</p>
          <div className="note note-warn"><p>{STATE_LAW_CAVEAT}</p></div>
        </section>
        <section className="c-sec">
          <h2>What that adds up to</h2>
          <ul>
            <li><b>Lawsuit exposure.</b> {garn}</li>
            <li><b>Old debts.</b> At about {facts.solYears} years, {name} sits {sol}. In most states a partial payment or a written acknowledgement restarts the clock, so check the date of last activity before making a goodwill payment on an old account.</li>
          </ul>
        </section>
        {open && (
          <section className="c-sec">
            <h2>Partners licensed in {name}</h2>
            <figure className="tbl"><table><thead><tr><th>Provider (your counterparty)</th><th>Account administrator</th><th className="r">Fee you'd pay</th></tr></thead>
              <tbody>{providers.map(({ provider, feePct }) => <tr key={provider.id}><td>{provider.legalName}</td><td>{provider.administrator}</td><td className="r">{Math.round(feePct * 100)}%</td></tr>)}</tbody></table></figure>
          </section>
        )}
        <FAQ items={buildStateFaqs(p)} />
        <Posture />
      </article>
      {open ? <CTA /> : <CTA title="Your other options" sub="Nonprofit credit counselling, a consolidation loan or a bankruptcy attorney may fit better." />}
    </SiteLayout>
  );
}

// ------------------------------------------------------------------ public disclosures
export function LegalDisclosures() {
  const m = PAGE_META.disclosures;
  useMeta(m.title, m.description);
  const { lang } = useApp();
  return (
    <SiteLayout>
      <article className="page doc content">
        <p className="s-eyebrow">Disclosures</p>
        <h1>{m.title}</h1>
        <p className="lede">{m.description}</p>
        <Posture />
        <p className="small">These are read from the same registry the application screens render, so the two cannot say different things. Each version is hashed and the hash is recorded when you acknowledge it.</p>
        {Object.values(DISCLOSURES).map((d) => {
          const t = lang === "es" ? { ...d, ...DISCLOSURES_ES[d.key] } : d;
          return (
            <section key={d.key} className="card c-card" id={d.key}>
              <h2>{t.title}</h2>
              {t.body.map((b, i) => <p key={i}>{b}</p>)}
              {t.acknowledgement && <p className="small"><b>{lang === "es" ? "Confirmas:" : "You confirm:"}</b> {t.acknowledgement}</p>}
              <p className="reg-meta">Version {d.version}{d.tsr ? ` · ${d.tsr}` : ""}{d.key === "credit_impact" ? " · confirmed by a comprehension check, not a checkbox" : ""}</p>
            </section>
          );
        })}
        <section className="c-sec">
          <h2>{lang === "es" ? "Permisos que te pedimos" : "Permissions we ask for"}</h2>
          {CONSENTS.map((c) => {
            const t = lang === "es" ? CONSENTS_ES[c.key] : c;
            return <div key={c.key} className="card c-card"><b>{t.plain}</b> <span className={"chip " + (c.required ? "c-warn" : "c-good")}>{c.required ? (lang === "es" ? "obligatorio" : "required") : (lang === "es" ? "opcional" : "optional")}</span><p className="small">{t.legal}</p></div>;
          })}
        </section>
      </article>
    </SiteLayout>
  );
}
