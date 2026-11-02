import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Empty, Notice, PageHeader, Pill, RateBar, Section, Stat, Stats, Table, int, pct, usd } from "./staff/ui.jsx";

// Admin dashboard: funnel, unit economics, clearance sensitivity, consent health,
// comprehension, drop-off summary — all re-derived live from the records.
export default function Admin({ go }) {
  const [samples, setSamples] = useState(true);
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => api.stats(samples).then((r) => alive && (setD(r), setErr(null))).catch((e) => alive && setErr(e.message));
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [samples]);

  if (err && !d) return <Notice tone="stop" title="Could not load stats">{err}</Notice>;
  if (!d) return <p className="small">Loading…</p>;
  const e = d.economics, c = d.consents, comp = d.comprehension, s = d.sensitivity, drops = d.drops;
  const inProg = d.outcomes.find((o) => o.outcome === "in_progress")?.count || 0;

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        sub={`Funnel, unit economics and compliance health, derived live from the records. ${d.store === "mongodb" ? "MongoDB" : "In-memory store"} · ${int(d.demoCount)} real files · refreshes every 5 s.`}
        right={<div className="row-wrap">
          <label className="toggle"><input type="checkbox" checked={samples} onChange={(ev) => setSamples(ev.target.checked)} /> Include {int(d.sampleCount || 181)} sample files</label>
          {d.sampleCount > 0 && <button className="mini danger" onClick={async () => {
            if (!window.confirm(`Permanently delete ${d.sampleCount} seeded sample files? Real and demo files are not touched.`)) return;
            try { await api.purgeSamples(); setSamples(false); } catch (e2) { setErr(e2.message); }
          }}>Clear sample data</button>}
        </div>}
      />

      <Section title="Files" note="Outcome mix across every application.">
        <Stats>
          <Stat label="Total files" value={int(e.totalFiles)} />
          <Stat label="Funded (enrolled)" value={int(e.fundedFiles)} sub={e.totalFiles ? `${pct(e.fundedFiles / e.totalFiles)} of files` : null} />
          <Stat label="Exited" value={int(drops.totalExits)} sub="Declined, referred out, diverted, abandoned or cancelled" />
          <Stat label="In progress" value={int(inProg)} />
          <Stat label="Sessions in Spanish" value={`${d.spanishShare}%`} />
          <Stat label="Clawback rate" value={`${d.fees.clawbackRate}%`} />
        </Stats>
        <div className="row-wrap">{d.outcomes.map((o) => <Pill key={o.outcome} tone={o.outcome === "enrolled" ? "good" : o.outcome === "in_progress" ? "info" : "warn"}>{o.outcome.replace("_", " ")}: {o.count}</Pill>)}</div>
      </Section>

      <Section title="Phase funnel" note="Reached = got into the phase. Advanced = got past it. Open files are still live and are not counted as drops.">
        {e.totalFiles === 0 ? <Empty title="Nothing in the funnel yet">Run an application and this fills in.</Empty> : (
          <Table>
            <thead><tr><th>Phase</th><th>Steps</th><th className="r">Reached</th><th className="r">Advanced</th><th className="r">Open</th><th className="r">Dropped</th><th>Advance rate</th><th className="r">Drop rate</th></tr></thead>
            <tbody>{d.phases.map((p) => (
              <tr key={p.phase}><td><b>{p.phase}. {p.label}</b></td><td className="small">{p.firstStep} → {p.lastStep} ({p.stepCount})</td><td className="r">{int(p.reached)}</td><td className="r">{int(p.advanced)}</td><td className="r">{int(p.open)}</td><td className="r">{int(p.dropped)}</td><td><RateBar value={p.advanceRate} /></td><td className="r">{pct(p.dropRate)}</td></tr>
            ))}</tbody>
          </Table>
        )}
        <details><summary className="small">Step-by-step funnel</summary>
          <Table><thead><tr><th>#</th><th>Step</th><th className="r">Reached</th><th className="r">Advanced</th><th className="r">Open</th><th className="r">Dropped</th><th>Advance</th></tr></thead>
            <tbody>{d.funnel.map((f) => <tr key={f.step}><td>{f.step}</td><td>{f.name}</td><td className="r">{f.reached}</td><td className="r">{f.advanced}</td><td className="r">{f.open}</td><td className="r">{f.dropped}</td><td><RateBar value={f.advanceRate} /></td></tr>)}</tbody></Table>
        </details>
      </Section>

      <Section title="Unit economics" note={`Debtify's fee is ${pct(e.feePct, 0)} of enrolled debt, invoiced when payment 1 clears and released when payment 2 clears. Everything that doesn't clear payment 2 is a clawback, so the reserve is the whole risk in one line.`}>
        <Stats>
          <Stat label="Funded files" value={int(e.fundedFiles)} sub={e.fundedFiles ? `Avg enrolled debt ${usd(e.avgEnrolledDebt)}` : "No funded files yet"} />
          <Stat label={`Gross fee @ ${pct(e.feePct, 0)}`} value={usd(e.grossFee)} sub={`On ${usd(e.enrolledDebtTotal)} enrolled`} />
          <Stat label="Clawback reserve" value={usd(e.clawbackReserve)} sub={`Assumes ${pct(e.clearanceRate, 0)} payment-2 clearance`} tone="warn" />
          <Stat label="Drop-off revenue" value={usd(e.dropoffRevenue)} sub={`Band ${usd(e.dropoffRevenueLow)}–${usd(e.dropoffRevenueHigh)}, consented files only`} />
        </Stats>
        <Table><tbody>
          <tr><th>Gross fee</th><td className="r">{usd(e.grossFee)}</td></tr>
          <tr><th>Less clawback reserve at {pct(e.clearanceRate, 0)} clearance</th><td className="r neg">{usd(-e.clawbackReserve)}</td></tr>
          <tr><th>Net fee retained</th><td className="r">{usd(e.netFee)}</td></tr>
          <tr><th>Plus drop-off resale (consented, midpoint)</th><td className="r">{usd(e.dropoffRevenue)}</td></tr>
          <tr><th><b>Net revenue</b></th><td className="r"><b>{usd(e.netRevenue)}</b></td></tr>
          <tr><th>Contribution per funded file</th><td className="r">{usd(e.contributionPerFundedFile)}</td></tr>
          <tr><th>Contribution per file worked</th><td className="r">{usd(e.contributionPerFile)}</td></tr>
        </tbody></Table>
      </Section>

      <Section title="Payment-2 clearance sensitivity" note={`At ${int(s.filesPerMonth)} files/month and ${usd(s.monthlyFixedCost)}/month fixed cost (planning inputs). Clearance is the one variable the model turns on.`}>
        <Notice tone={s.basis === "observed" ? "info" : "warn"}>{s.basis === "observed" ? <>Average enrolled debt of <b>{usd(s.avgEnrolledDebt)}</b> is observed from funded files.</> : <><b>Planning assumption, not observed data.</b> No funded file to average yet, so this uses {usd(s.avgEnrolledDebt)}.</>}</Notice>
        <Table>
          <thead><tr><th>Clearance</th><th className="r">Gross / file</th><th className="r">Clawback / file</th><th className="r">Retained / file</th><th className="r">Resale / file</th><th className="r">Contribution / file</th><th className="r">Monthly</th><th className="r">Annual operating profit</th><th className="r">Break-even files/mo</th></tr></thead>
          <tbody>{s.rows.map((r) => (
            <tr key={r.clearanceRate}><td><b>{pct(r.clearanceRate, 0)}</b> {r.clearanceRate === 0.75 && <Pill tone="info">assumed</Pill>}</td><td className="r">{usd(r.grossFeePerFile)}</td><td className="r neg">{usd(-r.clawbackPerFile)}</td><td className="r">{usd(r.retainedFeePerFile)}</td><td className="r">{usd(r.dropoffRevenuePerFile)}</td><td className="r"><b>{usd(r.contributionPerFile)}</b></td><td className="r">{usd(r.monthlyContribution)}</td><td className={"r" + (r.annualOperatingProfit < 0 ? " neg" : "")}><b>{usd(r.annualOperatingProfit)}</b></td><td className="r">{int(r.breakEvenFilesPerMonth)}</td></tr>
          ))}</tbody>
        </Table>
      </Section>

      <Section title="Consent health" note="Latest decision per file. The optional contact consent is broken out: its decline rate is the evidence it is genuinely optional.">
        <Table>
          <thead><tr><th>Consent</th><th>Required</th><th className="r">Decided</th><th className="r">Granted</th><th className="r">Declined</th><th>Grant rate</th></tr></thead>
          <tbody>{c.keys.map((k) => <tr key={k.key}><td><code>{k.key}</code><div className="small">{k.plain}</div></td><td>{k.required ? <Pill tone="warn">required</Pill> : <Pill tone="good">optional</Pill>}</td><td className="r">{k.decided}</td><td className="r">{k.granted}</td><td className="r">{k.declined}</td><td><RateBar value={k.grantRate} /></td></tr>)}</tbody>
        </Table>
        <Notice tone={c.coercionWarning ? "stop" : "info"} title={`Optional contact consent declined on ${c.contactDeclined} of ${c.contactDecided} files — ${pct(c.contactDeclineShare)}`}>
          The contact consent never gates the program. A healthy decline share proves it.{c.coercionWarning && <b> Zero declines across {c.contactDecided} files is not plausible for a genuinely optional consent. Review the consent screen for pressure before this becomes a UDAAP finding.</b>}
        </Notice>
        <p className="small">{int(c.totalRecords)} append-only consent records on file. <button className="linkish" onClick={() => go("consents")}>View records</button></p>
      </Section>

      <Section title="Comprehension check (credit impact)" note="Two attempts, then the file diverts to alternatives. It never loops until someone guesses right.">
        {comp.attempted === 0 ? <Empty title="No files have reached the comprehension check" /> : (
          <Stats>
            <Stat label="First-attempt pass rate" value={pct(comp.firstAttemptPassRate)} sub={`${comp.firstAttemptPasses} of ${comp.attempted}`} />
            <Stat label="Overall pass rate" value={pct(comp.overallPassRate)} sub={`${comp.retryPasses} passed on the 2nd attempt`} />
            <Stat label="Diverted" value={int(comp.diverted)} sub={`${pct(comp.divertRate)} sent to alternatives`} tone={comp.divertRate > 0.05 ? "warn" : null} />
            <Stat label="Pending" value={int(comp.pending)} />
          </Stats>
        )}
        <p className="small">A first-attempt pass rate near 100% means the questions are too easy to be evidence. A divert rate past a few percent means the disclosure isn't doing its job.</p>
      </Section>

      <Section title="Compliance clarity" note='Every disclosure has a "Clear / Explain simpler" answer. A high "explain simpler" share means the wording needs work before launch.'>
        <Table>
          <thead><tr><th>Point</th><th className="r">Answers</th><th className="r">Clear</th><th className="r">Explain simpler</th></tr></thead>
          <tbody>{d.clarity.map((r) => <tr key={r.id}><td>{r.name}</td><td className="r">{r.n}</td><td className="r">{r.n ? Math.round((r.clear / r.n) * 100) : 0}%</td><td className="r">{r.n ? Math.round((r.simpler / r.n) * 100) : 0}% {r.n && r.simpler / r.n > 0.25 ? <Pill tone="warn">review wording</Pill> : null}</td></tr>)}</tbody>
        </Table>
      </Section>

      <div className="cols">
        <Section title="Drop-off reasons">
          <Table><thead><tr><th>Reason</th><th className="r">Files</th></tr></thead>
            <tbody>{d.dropReasons.length ? d.dropReasons.map((r) => <tr key={r.code}><td>{r.label}<div className="small">{r.code}</div></td><td className="r">{r.count}</td></tr>) : <tr><td colSpan={2} className="small">None yet.</td></tr>}</tbody></Table>
        </Section>
        <Section title="Drop-off inventory" note="Resale requires the optional contact consent. No consent is a hard stop.">
          <Stats>
            <Stat label="Resalable" value={int(drops.resalableCount)} sub={`${usd(drops.resalableValueLow)}–${usd(drops.resalableValueHigh)}`} />
            <Stat label="Blocked on consent" value={int(drops.consentBlockedCount)} tone={drops.consentBlockedCount ? "warn" : null} />
          </Stats>
          <button className="linkish" onClick={() => go("dropoffs")}>Open drop-offs →</button>
        </Section>
      </div>

      <div className="cols">
        <Section title="By provider">
          <Table><thead><tr><th>Provider</th><th className="r">Enrolled</th><th className="r">Debt</th><th className="r">P1 cleared</th><th className="r">Clawbacks</th></tr></thead>
            <tbody>{d.byProvider.length ? d.byProvider.map((b) => <tr key={b.id}><td>{b.name}</td><td className="r">{b.enrolled}</td><td className="r">{usd(b.debt)}</td><td className="r">{b.p1}</td><td className="r">{b.clawbacks}</td></tr>) : <tr><td colSpan={5} className="small">No enrollments yet.</td></tr>}</tbody></Table>
        </Section>
        <Section title={`Exception desk (${d.exceptions.length})`} note="Failed verification calls, booked calls, fraud reviews and requests for a person.">
          <Table><thead><tr><th>File</th><th>Name</th><th>Why</th></tr></thead>
            <tbody>{d.exceptions.length ? d.exceptions.slice(0, 12).map((x) => <tr key={x.leadId} className="clickable" onClick={() => go("apps", x.leadId)}><td className="small">{x.leadId.slice(-8)}</td><td>{x.first || "–"}</td><td><Pill tone="warn">{x.why}</Pill></td></tr>) : <tr><td colSpan={3} className="small">Nothing waiting.</td></tr>}</tbody></Table>
        </Section>
      </div>

      <p className="small">Ruleset {Object.values(d.rulesetVersions || {})[0]} · exploration slice {pct(d.explorationSlice, 0)} (permanent).</p>
    </div>
  );
}
