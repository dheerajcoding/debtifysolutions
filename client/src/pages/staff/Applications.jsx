import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import { clock } from "../../lib/format.js";
import { Empty, Hash, Notice, PageHeader, Pill, Section, Stat, Stats, Table, int, outcomeTone, usd, when } from "./ui.jsx";
import { STEP_NAMES } from "@shared/config/flow.js";

export function Log({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div className="log" ref={ref} aria-live="polite">
      {logs.map((l, i) => <div key={i}><span className="t">{clock(l.at)}</span><span className={"tag-" + l.tag}>{l.tag}</span><span>{l.text}</span></div>)}
    </div>
  );
}

const OUTCOMES = ["in_progress", "enrolled", "declined", "referred_out", "diverted", "abandoned", "cancelled"];

export function Applications({ openId, setOpenId }) {
  const [f, setF] = useState({ q: "", outcome: "", step: "", tier: "" });
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const load = () => api.adminLeads(Object.fromEntries(Object.entries(f).filter(([, v]) => v))).then((r) => setRows(r.leads)).catch((e) => setErr(e.message));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [f]); // eslint-disable-line react-hooks/exhaustive-deps
  if (openId) return <FileDetail id={openId} back={() => { setOpenId(null); load(); }} />;
  return (
    <div className="stack">
      <PageHeader title="Applications" sub="Every real and demo file (samples excluded). Open one for its full audit trail." />
      <Section title="Filter">
        <div className="row-wrap">
          <input className="field slim" placeholder="Search name, email, phone, ID, state, provider" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search" />
          <select className="field slim" value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })} aria-label="Outcome"><option value="">All outcomes</option>{OUTCOMES.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="field slim" value={f.step} onChange={(e) => setF({ ...f, step: e.target.value })} aria-label="Furthest step"><option value="">Any step</option>{STEP_NAMES.slice(1).map((n, i) => <option key={n} value={i + 1}>{i + 1}. {n}</option>)}</select>
          <select className="field slim" value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })} aria-label="Tier"><option value="">Any tier</option>{["A", "B", "C", "none"].map((t) => <option key={t}>{t}</option>)}</select>
        </div>
      </Section>
      {err && <Notice tone="stop">{err}</Notice>}
      <Section title={rows ? `${rows.length} file${rows.length === 1 ? "" : "s"}` : "Loading…"}>
        {rows && !rows.length ? <Empty title="No files match this filter" /> : rows && (
          <Table>
            <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>State</th><th>Furthest step</th><th>Phase</th><th>Outcome</th><th>Tier</th><th className="r">Enrolled debt</th><th>Created</th></tr></thead>
            <tbody>{rows.map((l) => (
              <tr key={l.leadId} className="clickable" onClick={() => setOpenId(l.leadId)}>
                <td className="small">{l.leadId.slice(-8)} {l.source === "demo" && <Pill>demo</Pill>} {l.flagged && <Pill tone="warn">needs action</Pill>}</td>
                <td>{l.first ? `${l.first} ${l.last || ""}` : "Guest"}</td><td className="small">{l.email || l.phone || "–"}</td><td>{l.state}</td><td className="small">{l.furthest}. {l.stepName}</td><td>{l.phase}</td>
                <td><Pill tone={outcomeTone(l.outcome)}>{l.reason || l.outcome}</Pill></td><td>{l.tier}</td><td className="r">{usd(l.enrolledDebt)}</td><td className="small">{when(l.createdAt)}</td>
              </tr>
            ))}</tbody>
          </Table>
        )}
      </Section>
    </div>
  );
}

// Correcting contact details and leaving an internal note. Consents, gate artifacts and
// the decision log are append-only evidence and are deliberately not editable anywhere.
function EditFile({ lead, notes, onSaved, onError }) {
  const blank = { first: lead.first || "", last: lead.last || "", email: lead.email || "", phone: lead.phone || "" };
  const [f, setF] = useState(blank);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  useEffect(() => { setF(blank); }, [lead.leadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = Object.keys(blank).some((k) => (f[k] || "") !== (blank[k] || ""));
  const run = async (patch, done) => {
    setBusy(true); setOk("");
    try { await api.editLead(lead.leadId, patch); setOk(done); onError(null); await onSaved(); } catch (e) { onError(e.message); } finally { setBusy(false); }
  };

  return (
    <Section title="Correct details and notes" note="Only contact details can be corrected. Consent records, gate artifacts and the decision log are append-only evidence and can never be edited or deleted. Every change here is written to the access log.">
      <div className="row-wrap">
        {[["first", "First name"], ["last", "Last name"], ["email", "Email"], ["phone", "Phone"]].map(([k, label]) => (
          <label key={k} className="f small">{label}
            <input className="field slim" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={label} />
          </label>
        ))}
        <button className="mini" disabled={!dirty || busy} onClick={() => run(f, "Contact details updated.")}>Save details</button>
        {dirty && <button className="mini" disabled={busy} onClick={() => setF(blank)}>Cancel</button>}
      </div>
      <p className="small">Changing the phone number clears its verified flag, so the consumer re-verifies by code.</p>
      <div className="row-wrap">
        <input className="field slim grow" placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Internal note" />
        <button className="mini" disabled={!note.trim() || busy} onClick={async () => { await run({ note: note.trim() }, "Note added."); setNote(""); }}>Add note</button>
      </div>
      {ok && <p className="small">{ok}</p>}
      {notes.length > 0 && (
        <Table>
          <thead><tr><th>When</th><th>By</th><th>Note</th></tr></thead>
          <tbody>{notes.slice().reverse().map((n, i) => <tr key={i}><td className="small">{when(n.at)}</td><td className="small">{n.by}</td><td>{n.text}</td></tr>)}</tbody>
        </Table>
      )}
    </Section>
  );
}

function FileDetail({ id, back }) {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = () => api.adminLead(id).then(setD).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (fn) => { try { await fn(); await load(); setMsg(null); } catch (e) { setMsg(e.message); } };
  if (!d) return <p className="small">{msg || "Loading…"}</p>;
  const l = d.lead, q = l.quote;
  return (
    <div className="stack">
      <PageHeader title={`${l.first || "Guest"} ${l.last || ""}`} sub={`${l.leadId} · ${l.source} · ${String(l.lang).toUpperCase()} · ${l.email || "no contact details yet"}`} right={<button className="mini" onClick={back}>← All applications</button>} />
      <Notice tone="stop">You are viewing real consumer data. This view has been recorded in the access log.</Notice>
      {msg && <Notice tone="stop">{msg}</Notice>}
      <Section title="Summary">
        <Stats>
          <Stat label="Outcome" value={<Pill tone={outcomeTone(d.summary.outcome)}>{d.summary.outcome}</Pill>} sub={d.summary.reason} />
          <Stat label="Furthest step" value={`${d.summary.furthest}. ${d.summary.furthestName}`} />
          <Stat label="Enrolled debt" value={usd(q?.enrolledDebt)} sub={q ? `${q.providerName} · ${usd(q.monthlyDeposit)}/mo` : null} />
          <Stat label="Drop-off tier" value={d.summary.tier} />
        </Stats>
        <Table><tbody>
          <tr><th>Name</th><td>{l.first} {l.last}</td><th>Email</th><td>{l.email || "–"}</td></tr>
          <tr><th>Phone</th><td>{d.pii.phone || "–"} {l.phoneVerified ? "✓ verified" : ""}</td><th>SSN</th><td>{d.pii.ssnLast4 ? `•••-••-${d.pii.ssnLast4}` : "–"} (full number never stored)</td></tr>
          <tr><th>Date of birth</th><td>{d.pii.dob || "–"}</td><th>Address</th><td>{d.pii.address ? `${d.pii.address.address}, ${d.pii.address.city} ${d.pii.address.state} ${d.pii.address.zip}` : "–"}</td></tr>
          <tr><th>Payment status</th><td>{l.paymentStatus}{l.heightenedCredit ? " (heightened credit disclosure)" : ""}</td><th>Income verified</th><td>{l.incomeVerified ? "Yes (bank link)" : l.skippedBankLink ? "No, skipped" : "–"}</td></tr>
          <tr><th>Comprehension attempts</th><td>{l.comprehensionAttempts || 0}</td><th>Fraud score</th><td>{l.fraudScore != null ? l.fraudScore.toFixed(2) : "–"}{l.manualReview ? " · manual review" : ""}</td></tr>
          <tr><th>Call</th><td>{l.callResult || "–"}{l.callBooking ? ` (${l.callBooking.slot})` : ""}</td><th>Fee status</th><td>{l.feeStatus}</td></tr>
          <tr><th>Created</th><td>{when(l.createdAt)}</td><th>Updated</th><td>{when(l.updatedAt)}</td></tr>
        </tbody></Table>
        <div className="row-wrap">
          {l.step === 9 && l.status === "SIGNED" && <>
            <span className="small">Verification call result:</span>
            <button className="mini" onClick={() => act(() => api.callResult(id, true, "Scored by QA"))}>Mark call passed → enroll</button>
            <button className="mini danger" onClick={() => act(() => api.callResult(id, false, "Failed QA"))}>Mark call failed</button>
          </>}
          {l.deposits?.length > 0 && ["PAYMENT1_CLEARED", "PAYMENT2_CLEARED", "PAYMENT2_FAILED", "DEBT_SETTLED"].map((t) => <button key={t} className="mini" onClick={() => act(() => api.backendEvent(id, t))}>{t.replace(/_/g, " ").toLowerCase()}</button>)}
          {(l.person || l.manualReview || l.callResult === "FAILED" || l.callResult === "BOOKED") && !l.resolved && <button className="mini" onClick={() => act(() => api.resolve(id))}>Mark exception resolved</button>}
        </div>
      </Section>

      <EditFile lead={l} notes={d.staffNotes || []} onSaved={load} onError={setMsg} />

      <Section title="Step timeline" note="A step can't be passed until its gate artifact exists server-side.">
        <Table>
          <thead><tr><th>#</th><th>Step</th><th>Phase</th><th>Status</th><th>Gates written on this step</th></tr></thead>
          <tbody>{d.timeline.map((t) => (
            <tr key={t.step}><td>{t.step}</td><td>{t.name}</td><td>{t.phase}</td><td><Pill tone={t.status === "passed" ? "good" : t.status === "current" ? "info" : t.status === "exited" ? "bad" : "warn"}>{t.status}</Pill></td>
              <td>{t.gates.length ? t.gates.map((g) => <span key={g.gate} className={"gate " + (g.satisfied ? "ok" : "no")}>{g.satisfied ? "✓" : "○"} {g.gate}</span>) : <span className="small">–</span>}</td></tr>
          ))}</tbody>
        </Table>
      </Section>

      <Section title={`Consent records (${d.consents.length})`} note="Append-only. A change of mind is a new record.">
        {!d.consents.length ? <Empty title="No consent records on this file" /> : (
          <Table><thead><tr><th>Key</th><th>Decision</th><th>Lang</th><th>Version hash</th><th>Partner list hash</th><th>IP</th><th>Render→grant</th><th>Source</th><th>Time</th></tr></thead>
            <tbody>{d.consents.map((c) => <tr key={c.recId}><td><code>{c.key}</code></td><td>{c.granted ? <Pill tone="good">granted</Pill> : <Pill tone="warn">declined</Pill>}</td><td>{c.lang}</td><td><Hash v={c.versionHash} /></td><td><Hash v={c.partnerListHash} /></td><td className="small">{c.ip}</td><td className="small">{c.renderToGrantMs ? `${(c.renderToGrantMs / 1000).toFixed(1)} s` : "–"}</td><td className="small">{c.source}</td><td className="small">{when(c.at)}</td></tr>)}</tbody></Table>
        )}
      </Section>

      <Section title={`Gate artifacts (${d.artifacts.length})`} note="Proof each gate was met, in the order written.">
        {!d.artifacts.length ? <Empty title="No gate artifacts on this file" /> : (
          <Table><thead><tr><th>Gate</th><th>Written</th><th>Detail</th></tr></thead>
            <tbody>{[...d.artifacts].reverse().map((a) => (
              <tr key={a.recId}>
                <td><code>{a.gate}</code></td>
                <td className="small">{when(a.at)}</td>
                <td className="small">
                  {a.detail && Object.keys(a.detail).length > 0
                    ? <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "1px 8px" }}>
                        {Object.entries(a.detail).map(([k, v]) => (
                          <><dt key={k + "_k"} style={{ fontWeight: 600, whiteSpace: "nowrap", color: "var(--fg-muted)" }}>{k.replace(/_/g, " ")}</dt>
                          <dd key={k + "_v"} style={{ margin: 0, wordBreak: "break-all" }}>{typeof v === "boolean" ? (v ? "yes" : "no") : typeof v === "number" ? v : String(v)}</dd></>
                        ))}
                      </dl>
                    : <span style={{ color: "var(--fg-muted)" }}>—</span>}
                </td>
              </tr>
            ))}</tbody></Table>
        )}
      </Section>

      <Section title="Decision log" note="Immutable. Every rule evaluated is recorded, pass or fail.">
        {!d.decisions.length ? <Empty title="No decision has been made on this file" /> : d.decisions.map((x) => (
          <div key={x.recId} className="stack">
            <Table><tbody>
              <tr><th>File snapshot hash</th><td><Hash v={x.fileSnapshotHash} /></td><th>Outcome</th><td>{x.outcome}</td></tr>
              <tr><th>Bound provider</th><td>{x.providerId || "–"}</td><th>Fallback chain</th><td>{(x.fallbackChain || []).join(" → ") || "–"}</td></tr>
              <tr><th>Exploration slice</th><td>{x.explore ? "Yes — routed off top score" : "No"}</td><th>Ruleset</th><td className="small">{Object.entries(x.rulesetVersions || {}).map(([k, v]) => `${k} ${v}`).join(" · ")}</td></tr>
            </tbody></Table>
            <Table><thead><tr><th>#</th><th>Stage</th><th>Rule</th><th>Result</th><th>Detail</th></tr></thead>
              <tbody>{x.rules.map((r, i) => <tr key={i}><td>{i + 1}</td><td>{r.stage}</td><td><code>{r.ruleId}</code></td><td>{r.passed ? <Pill tone="good">pass</Pill> : <Pill tone="bad">fail</Pill>}</td><td className="small">{r.detail || ""}</td></tr>)}</tbody></Table>
          </div>
        ))}
      </Section>

      <Section title={`Tradelines (${(l.tradelines || []).length})`} note="Bureau and consumer balances are kept separately. The consumer is the truth on balance; the bureau on existence and status.">
        {!(l.tradelines || []).length ? <Empty title="No tradelines on this file" /> : (
          <Table><thead><tr><th>Creditor</th><th>Type</th><th className="r">DPD</th><th className="r">Bureau</th><th className="r">Confirmed</th><th className="r">Correction</th><th>Source</th><th>Enrolled</th><th>Excluded</th></tr></thead>
            <tbody>{l.tradelines.map((t) => {
              const corr = t.balanceConfirmed != null && t.balanceBureau != null ? t.balanceConfirmed - t.balanceBureau : null;
              return <tr key={t.tlId}><td>{t.creditor}</td><td className="small">{t.type}</td><td className="r">{t.dpd}</td><td className="r">{usd(t.balanceBureau)}</td><td className="r">{usd(t.balanceConfirmed)}</td><td className="r">{corr ? usd(corr) : "–"}</td><td className="small">{t.source}</td><td>{t.selected && !t.excludedReason ? "✓" : ""}</td><td className="small">{t.excludedReason || ""}</td></tr>;
            })}</tbody></Table>
        )}
      </Section>

      {l.signature && <Section title="Signature"><p className="small">Signed by <b>{l.signature.name}</b> at {when(l.signature.at)} · audit hash <Hash v={l.signature.auditHash} /></p></Section>}
      {l.deposits?.length > 0 && <Section title="Deposits"><Table><thead><tr><th>#</th><th>Date</th><th className="r">Amount</th><th>Status</th></tr></thead><tbody>{l.deposits.slice(0, 6).map((x) => <tr key={x.n}><td>{x.n}</td><td>{x.date}</td><td className="r">{usd(x.amount)}</td><td>{x.status}</td></tr>)}</tbody></Table><p className="small">{int(l.deposits.length)} scheduled in total.</p></Section>}
      <Section title="Activity"><Log logs={d.events} /></Section>
    </div>
  );
}
