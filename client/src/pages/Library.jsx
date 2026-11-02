import { useEffect, useState } from "react";
import { CONSENTS, QUIZ, RISKS, disclosures } from "../lib/copy.js";
import { api } from "../lib/api.js";
import { F, G as GUIDE } from "../lib/flowCopy.js";
const STEP_EN = F.en.stepNames;
import { viz } from "../lib/viz.js";
import { Html } from "../components/ui.jsx";

const P = { clientFeePct: 0.25, termMonths: 36, monthlyDeposit: 608, enrolledDebt: 29150, estTotalCost: 21863, estSavings: 7287 };

function Card({ title, vk, en, es, pen, pes }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {vk && <Html html={viz(vk, "en", { p: P, inc: 4200, exp: 3300 })} />}
      <div className="pair">
        <div>
          <p className="lbl">English</p>
          <p>{en}</p>
          {pen && <p className="plain" style={{ marginTop: 6 }}>{pen}</p>}
        </div>
        <div>
          <p className="lbl">Español</p>
          <p>{es}</p>
          {pes && <p className="plain" style={{ marginTop: 6 }}>{pes}</p>}
        </div>
      </div>
    </div>
  );
}

// Every guide message, consent and compliance point in both languages, for counsel review.
export default function Library() {
  const [ans, setAns] = useState(null);
  useEffect(() => { api.adminDisclosures().then((r) => setAns(r.quizAnswers)).catch(() => setAns({})); }, []);
  const D = { en: disclosures(P, "en"), es: disclosures(P, "es") };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="toolbar"><h1 style={{ fontSize: 22 }}>Explainer library</h1></div>
      <p className="small">Every guide message, consent and compliance point in both languages, with its picture and plain-words version. Example numbers use a $29,150 program. For counsel and native-speaker review before launch.</p>
      <h2>Plan points (screens 6–8)</h2>
      <div className="lib">
        {D.en.map((d, i) => <Card key={d.id} title={`${d.title} / ${D.es[i].title}`} vk={d.viz} en={d.body} es={D.es[i].body} pen={d.plain} pes={D.es[i].plain} />)}
        {RISKS.map((r) => <Card key={r.id} title={`${r.title.en} / ${r.title.es}`} vk={r.viz} en={r.body.en} es={r.body.es} pen={r.plain.en} pes={r.plain.es} />)}
      </div>
      <p className="small">The operative, version-hashed disclosure and consent text lives in the Disclosure registry. Below are the plain-language explainers and picture aids shown around it.</p>
      <h2>Permissions (explainers)</h2>
      <div className="lib">
        {CONSENTS.map((c) => <Card key={c.type} title={`${c.label.en} / ${c.label.es} (${c.req ? "required" : "optional"})`} en={c.text.en} es={c.text.es} pen={c.plain.en} pes={c.plain.es} />)}
      </div>
      <h2>Comprehension check (answers resolved server-side)</h2>
      <div className="lib">
        {QUIZ.map((q) => <Card key={q.id} title={`${q.q.en} / ${q.q.es}`} en={`Answer: ${ans?.[q.id] != null ? q.o.en[ans[q.id]] : "…"}. ${q.ex.en}`} es={`Respuesta: ${ans?.[q.id] != null ? q.o.es[ans[q.id]] : "…"}. ${q.ex.es}`} />)}
      </div>
      <h2>Jay's guidance, screen by screen</h2>
      <div className="lib">
        {Object.entries(GUIDE).map(([s, g]) => (
          <Card key={s} title={`${s}. ${STEP_EN[s]}`} en={g.en.join(" ")} es={g.es.join(" ")} pen={"Prompts: " + g.q.en.join(" · ")} pes={"Preguntas: " + g.q.es.join(" · ")} />
        ))}
      </div>
    </div>
  );
}
