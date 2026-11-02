import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { Empty, Hash, Notice, PageHeader, Pill, Section, Stat, Stats, Table, int, pct, usd, when } from "./ui.jsx";

function useLoad(fn, deps = []) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const load = () => fn().then((r) => { setD(r); setErr(null); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { d, err, load };
}

// ---------------------------------------------------------------- consents
export function Consents({ openFile }) {
  const [f, setF] = useState({ key: "", granted: "" });
  const { d, err } = useLoad(() => api.adminConsents(Object.fromEntries(Object.entries(f).filter(([, v]) => v))), [f.key, f.granted]);
  return (
    <div className="stack">
      <PageHeader title="Consent records" sub="Append-only evidence of exactly what each consumer agreed to." />
      <Notice tone="info" title="What makes a record evidence">The version hash over the exact words rendered (in the language shown), the time, IP and device, and — on the optional contact consent — the hash of the published partner list. A screenshot proves nothing; this does. Records can't be edited or deleted.</Notice>
      <Section title="Filter">
        <div className="row-wrap">
          <select className="field slim" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })}><option value="">All keys</option><option>fcra</option><option>esign</option><option>contact_partners</option></select>
          <select className="field slim" value={f.granted} onChange={(e) => setF({ ...f, granted: e.target.value })}><option value="">Granted or declined</option><option value="true">Granted</option><option value="false">Declined</option></select>
        </div>
      </Section>
      {err && <Notice tone="stop">{err}</Notice>}
      <Section title={d ? `${int(d.records.length)} of ${int(d.total)} records` : "Loading…"}>
        {d && !d.records.length ? <Empty title="No consent records yet">They're written on the identity screen of the application.</Empty> : d && (
          <Table><thead><tr><th>Time</th><th>File</th><th>Key</th><th>Decision</th><th>Lang</th><th>Version hash</th><th>Partner list</th><th>IP</th><th>Source</th><th>Text shown</th></tr></thead>
            <tbody>{d.records.map((c) => <tr key={c.recId}><td className="small">{when(c.at)}</td><td><button className="linkish small" onClick={() => openFile(c.leadId)}>{c.leadId.slice(-8)}</button></td><td><code>{c.key}</code></td><td>{c.granted ? <Pill tone="good">granted</Pill> : <Pill tone="warn">declined</Pill>}</td><td>{c.lang}</td><td><Hash v={c.versionHash} /></td><td><Hash v={c.partnerListHash} /></td><td className="small">{c.ip}</td><td className="small">{c.source}</td><td className="small clamp">{c.textShown}</td></tr>)}</tbody></Table>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- disclosures
export function Disclosures() {
  const { d, err } = useLoad(() => api.adminDisclosures());
  const [lang, setLang] = useState("en");
  if (err) return <Notice tone="stop">{err}</Notice>;
  if (!d) return <p className="small">Loading…</p>;
  return (
    <div className="stack">
      <PageHeader title="Disclosure registry" sub="Every disclosure is version-hashed. The screens render only what's here." right={<div className="lang"><button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button><button aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button></div>} />
      <Notice tone="warn" title="Placeholder text">All disclosure and consent text is plain-language placeholder. US regulatory counsel supplies the operative wording; bump the version on every edit.</Notice>
      <Notice tone="info" title="How a disclosure becomes a gate">The consumer is shown the text, ticks the acknowledgement, and the browser sends back the hash it was shown. The server recomputes the hash for the current version; if they match, it writes the gate artifact with version, hash and dwell time. A stale hash is refused.</Notice>
      <Section title="Registry">
        <Table><thead><tr><th>Key</th><th>Version</th><th>Hash ({lang})</th><th>Gate</th><th>TSR citation</th><th className="r">Files acknowledged</th></tr></thead>
          <tbody>{d.disclosures.map((x) => <tr key={x.key}><td><code>{x.key}</code></td><td>{x.version}</td><td><Hash v={x[lang].hash} /></td><td><code>{x.gate}</code></td><td>{x.tsr || "–"}</td><td className="r">{x.acknowledged}</td></tr>)}</tbody></Table>
      </Section>
      <Section title="Full text, as it renders" note="Exactly the strings the screens put in front of a consumer.">
        {d.disclosures.map((x) => (
          <div key={x.key} className="card reg-card">
            <h3>{x[lang].title}</h3>
            {x[lang].body.map((b, i) => <p key={i} className="small">{b}</p>)}
            {x[lang].acknowledgement ? <p className="small"><b>Acknowledgement:</b> {x[lang].acknowledgement}</p> : <p className="small"><b>Confirmed by the comprehension check</b> (2 attempts, then divert).</p>}
          </div>
        ))}
      </Section>
      <Section title="Consents">
        {d.consents.map((c) => <div key={c.key} className="card reg-card"><h3>{c[lang].plain} {c.required ? <Pill tone="warn">required</Pill> : <Pill tone="good">optional · never gates</Pill>}</h3><p className="small">{c[lang].legal}</p><p className="small">hash <Hash v={c[lang].hash} /></p></div>)}
      </Section>
      <Section title="Comprehension check answers" note="Resolved on the server; never shipped to the consumer's browser.">
        <p className="small mono">{JSON.stringify(d.quizAnswers)}</p>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- suppression
export function Suppression() {
  const { d, err, load } = useLoad(() => api.suppressions());
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [res, setRes] = useState(null);
  const [test, setTest] = useState("");
  const [testRes, setTestRes] = useState(null);
  const add = async (e) => {
    e.preventDefault();
    try { const r = await api.addSuppression(phone, note); setRes(r); setPhone(""); setNote(""); load(); } catch (e2) { setRes({ ok: false, reason: e2.message }); }
  };
  return (
    <div className="stack">
      <PageHeader title="Suppression list" sub="TCPA opt-outs. Append-only, never expiring, checked by every outbound text — including OTP codes and partner contact." />
      <Notice tone="info">Recognised keywords: STOP, UNSUBSCRIBE, REVOKE, OPT OUT, CANCEL, QUIT, END (exact, or a message starting with one). Internal target: honour within 24 hours; legal limit 10 business days. Inbound texts arrive at <code>POST /api/webhooks/sms</code> (Twilio-signed).</Notice>
      {err && <Notice tone="stop">{err}</Notice>}
      <Section title="Summary">
        <Stats>
          <Stat label="Numbers suppressed" value={int(d?.total)} />
          <Stat label="Most recent" value={d?.suppressions[0] ? when(d.suppressions[0].at) : "–"} />
          <Stat label="Sources" value={d ? [...new Set(d.suppressions.map((s) => s.source))].join(", ") || "–" : "–"} />
        </Stats>
      </Section>
      <Section title="Add a number manually" note="For a revocation received by phone, email or letter. Any reasonable means counts.">
        <form className="row-wrap" onSubmit={add}>
          <input className="field slim" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="field slim" placeholder="How it was received (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="mini">Suppress</button>
        </form>
        {res && <Notice tone={res.ok ? "info" : "warn"}>{res.ok ? `Added ${res.e164} to the suppression list.` : res.reason === "already" ? `${res.e164} is already suppressed.` : res.reason === "unparseable" ? "That isn't a readable phone number." : res.reason}</Notice>}
        <div className="row-wrap">
          <input className="field slim" placeholder="Test an inbound message…" value={test} onChange={(e) => setTest(e.target.value)} />
          <button type="button" className="mini" onClick={async () => setTestRes((await api.testRevocation(test)).revocation)}>Would this opt out?</button>
          {testRes != null && <Pill tone={testRes ? "bad" : "good"}>{testRes ? "Yes — revocation" : "No"}</Pill>}
        </div>
      </Section>
      <Section title={`${int(d?.total)} suppressed number${d?.total === 1 ? "" : "s"}`}>
        {d && !d.suppressions.length ? <Empty title="The suppression list is empty" /> : d && (
          <Table><thead><tr><th>Phone (E.164)</th><th>Source</th><th>Raw message / note</th><th>By</th><th>Suppressed at</th></tr></thead>
            <tbody>{d.suppressions.map((s) => <tr key={s.recId}><td className="mono">{s.phoneE164}</td><td>{s.source}</td><td className="small">{s.rawMessage || "–"}</td><td className="small">{s.by || "–"}</td><td className="small">{when(s.at)}</td></tr>)}</tbody></Table>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- providers
export function Providers() {
  const { d, err } = useLoad(() => api.providers());
  if (err) return <Notice tone="stop">{err}</Notice>;
  if (!d) return <p className="small">Loading…</p>;
  return (
    <div className="stack">
      <PageHeader title="Provider panel" sub="Licensed partner providers, their underwriting rules and the state fee-cap matrix the decision engine reads." />
      <Section title="Panel summary">
        <Stats>
          <Stat label="Providers" value={d.providers.length} />
          <Stat label="Monthly capacity" value={int(d.providers.reduce((s, p) => s + p.monthlyCapacity, 0))} sub={`${int(d.providers.reduce((s, p) => s + p.capacityUsed, 0))} used this month`} />
          <Stat label="Rates over a state cap" value={d.flags} sub="Capped by effectiveFeePct(), so a signal, not an overcharge" tone={d.flags ? "warn" : null} />
          <Stat label="Licensed states with no cap on file" value={d.noCap} tone={d.noCap ? "warn" : null} />
        </Stats>
        {d.conflicts.length > 0 && <Notice tone="stop" title="Config contradiction">{d.conflicts.join("; ")}</Notice>}
      </Section>
      {d.providers.map((p) => (
        <Section key={p.id} title={p.displayName} id={p.id}>
          <Table><tbody>
            <tr><th>Legal name (counterparty)</th><td>{p.legalName}</td><th>Administrator</th><td>{p.administrator}</td></tr>
            <tr><th>Monthly capacity (R5)</th><td>{p.capacityUsed} / {p.monthlyCapacity}</td><th>Base preference score (R4)</th><td>{p.baseScore}{p.rewardsIncomeVerification ? " (+8 with verified income)" : ""}</td></tr>
            <tr><th>Enrolled debt (R1)</th><td>{usd(p.underwriting.minEnrolledDebt)} – {usd(p.underwriting.maxEnrolledDebt)}</td><th>Min disposable income (R1)</th><td>{usd(p.underwriting.minDisposableIncome)}</td></tr>
            <tr><th>Min days past due (R3)</th><td>{p.underwriting.minDaysPastDue}</td><th>Accepts current accounts</th><td>{p.underwriting.acceptsCurrentAccounts ? "Yes" : "No"}</td></tr>
            <tr><th>Excluded creditors</th><td>{p.underwriting.excludedCreditors.join(", ") || "–"}</td><th>Excluded account types</th><td>{p.underwriting.excludedAccountTypes.join(", ")}</td></tr>
            <tr><th>Raw consumer fee</th><td>{pct(p.underwriting.feePctOfEnrolledDebt, 0)}</td><th>Estimated term</th><td>{p.underwriting.estimatedTermMonths.join("–")} months · handoff {p.handoff}</td></tr>
          </tbody></Table>
          <Table><thead><tr><th>State</th><th className="r">Raw rate</th><th className="r">State cap</th><th className="r">Effective fee</th><th className="r">On {usd(p.underwriting.minEnrolledDebt)}</th><th>Flag</th></tr></thead>
            <tbody>{p.states.map((s) => <tr key={s.state}><td>{s.state}</td><td className="r">{pct(s.rawRate, 0)}</td><td className="r">{s.cap == null ? "–" : pct(s.cap, 0)}</td><td className="r"><b>{pct(s.effective, 0)}</b></td><td className="r">{usd(s.onMin)}</td><td>{s.flag === "over_cap" ? <Pill tone="warn">raw rate over cap</Pill> : s.flag === "no_cap" ? <Pill tone="info">no cap on file</Pill> : ""}</td></tr>)}</tbody></Table>
        </Section>
      ))}
      <Section title="State fee caps" note="Placeholder values. Counsel supplies the real matrix; it's maintained by compliance, not engineering.">
        <Table><thead><tr><th>State</th><th className="r">Cap</th><th>Providers licensed</th><th>Raw rate over the cap</th></tr></thead>
          <tbody>{d.caps.map((c) => <tr key={c.state}><td>{c.state}</td><td className="r">{pct(c.cap, 0)}</td><td className="small">{c.providers.join(", ") || "–"}</td><td className="small">{c.overCap.join(", ") || "–"}</td></tr>)}</tbody></Table>
      </Section>
      <Section title={`Closed states (${d.closedStates.length})`} note="No licensed provider. The application stops at step 1 and points to alternatives, rather than collecting personal data it can't use.">
        <div className="row-wrap">{d.closedStates.map((s) => <Pill key={s.code} tone="warn">{s.code} · {s.name}</Pill>)}</div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- drop-offs
const TIER_WHAT = { A: "Reached a bound plan or later — the most qualification work done", B: "Failed underwriting or the comprehension check", C: "Gave personal data but never reached a plan" };
const TIER_COLOR = { A: "good", B: "warn", C: "bad", none: null };

function DropoffDetail({ item, onClose, openFull }) {
  const [detail, setDetail] = useState(null);
  const [detailErr, setDetailErr] = useState(null);
  const real = !item.leadId.startsWith("sample");

  useEffect(() => {
    if (!real) { setDetail(null); return; }
    api.adminLead(item.leadId)
      .then(setDetail)
      .catch((e) => setDetailErr(e.message));
  }, [item.leadId, real]);

  const L = detail;
  return (
    <div style={{ border: "1px solid var(--brand)", borderRadius: 14, background: "var(--card)", padding: "20px 22px", margin: "8px 0" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 17 }}>{item.name || "Guest"}</h3>
            <Pill tone={TIER_COLOR[item.tier]}>Tier {item.tier === "none" ? "—" : item.tier}</Pill>
            <Pill tone="bad">{item.outcome}</Pill>
            {item.resalable && <Pill tone="good">resalable</Pill>}
          </div>
          <p className="small" style={{ color: "var(--muted)", margin: "4px 0 0" }}>
            {item.leadId} · State: {item.state} · Exited step {item.exitStep} ({item.exitStepName})
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {real && <button className="mini" onClick={openFull}>Open full file →</button>}
          <button className="mini" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      {/* key facts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          ["Email", item.email || "–"],
          ["Phone", item.phone || "–"],
          ["Exit reason", item.reason || "–"],
          ["Contact consent", item.contactConsentGranted ? "✓ Granted" : "✗ Not granted"],
          ["Resale value", item.resalable ? `${usd(item.priceLow)} – ${usd(item.priceHigh)}` : "Not resalable"],
          ["Enrolled debt", item.enrolledDebt ? usd(item.enrolledDebt) : "–"],
          ["Exited", when(item.exitedAt)],
          ["Created", when(item.createdAt)],
        ].map(([k, v]) => (
          <div key={k} style={{ background: "var(--paper)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* deep data — only available for real leads */}
      {!real && (
        <Notice tone="info" title="Sample file">This is seeded test data. No real record exists — toggle off "Include samples" to see real drop-offs only.</Notice>
      )}
      {real && detailErr && <Notice tone="stop">{detailErr}</Notice>}
      {real && !detail && !detailErr && <p className="small">Loading full record…</p>}
      {real && L && (
        <div className="stack" style={{ marginTop: 8 }}>
          {/* Identity */}
          <details open>
            <summary style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "6px 0" }}>Identity collected</summary>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
              {[
                ["Name", [L.first, L.last].filter(Boolean).join(" ") || "–"],
                ["Email", L.email || "–"],
                ["Phone", L.phone || "–"],
                ["DOB", L.dob || (L.dobEnc ? "(encrypted)" : "–")],
                ["State", L.state || "–"],
                ["Language", L.lang || "–"],
                ["Phone verified", L.phoneVerified ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "var(--paper)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>
          </details>

          {/* Debts */}
          {L.debts?.length > 0 && (
            <details open>
              <summary style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "6px 0" }}>Debts listed ({L.debts.length})</summary>
              <Table style={{ marginTop: 8 }}>
                <thead><tr><th>Creditor</th><th>Type</th><th className="r">Balance</th><th>Status</th></tr></thead>
                <tbody>{L.debts.map((d2, i) => (
                  <tr key={i}><td>{d2.creditor || "–"}</td><td>{d2.type || "–"}</td><td className="r">{d2.balance ? usd(d2.balance) : "–"}</td><td>{d2.status || "–"}</td></tr>
                ))}</tbody>
              </Table>
            </details>
          )}

          {/* Quote/plan */}
          {L.quote && (
            <details open>
              <summary style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "6px 0" }}>Program offer bound</summary>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
                {[
                  ["Provider", L.quote.providerName || L.quote.providerId || "–"],
                  ["Enrolled debt", L.quote.enrolledDebt ? usd(L.quote.enrolledDebt) : "–"],
                  ["Monthly deposit", L.quote.monthlyDeposit ? usd(L.quote.monthlyDeposit) : "–"],
                  ["Term", L.quote.termMonths ? (Array.isArray(L.quote.termMonths) ? L.quote.termMonths.join("–") : L.quote.termMonths) + " months" : "–"],
                  ["Fee %", L.quote.feePct ? (L.quote.feePct * 100).toFixed(0) + "%" : "–"],
                  ["Debtify fee", L.quote.debtifyFee ? usd(L.quote.debtifyFee) : "–"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--paper)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13 }}>{v}</div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Consents */}
          {L.consents?.length > 0 && (
            <details>
              <summary style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "6px 0" }}>Consents ({L.consents.length})</summary>
              <Table style={{ marginTop: 8 }}>
                <thead><tr><th>Key</th><th>Decision</th><th>Time</th></tr></thead>
                <tbody>{L.consents.map((c, i) => (
                  <tr key={i}><td><code>{c.key || c.type}</code></td><td>{c.granted ? <Pill tone="good">granted</Pill> : <Pill tone="warn">declined</Pill>}</td><td className="small">{when(c.at)}</td></tr>
                ))}</tbody>
              </Table>
            </details>
          )}

          {/* Staff notes */}
          {L.staffNotes?.length > 0 && (
            <details>
              <summary style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "6px 0" }}>Staff notes ({L.staffNotes.length})</summary>
              <div style={{ marginTop: 8 }} className="stack">
                {L.staffNotes.map((n, i) => (
                  <div key={i} style={{ background: "var(--paper)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>{when(n.at)} · {n.by}</span>
                    <p style={{ margin: "4px 0 0" }}>{n.text}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Raw decision trace */}
          {L.events?.length > 0 && (
            <details>
              <summary style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "6px 0" }}>Event timeline ({L.events.length} events)</summary>
              <Table style={{ marginTop: 8 }}>
                <thead><tr><th>Time</th><th>Event</th><th>Detail</th></tr></thead>
                <tbody>{L.events.slice(-30).map((e, i) => (
                  <tr key={i}><td className="small">{when(e.at || e.ts)}</td><td><code>{e.type || e.action || e.step}</code></td><td className="small">{e.detail || e.note || JSON.stringify(e).slice(0, 80)}</td></tr>
                ))}</tbody>
              </Table>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function Dropoffs({ openFile }) {
  const [samples, setSamples] = useState(false);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const { d, err, load } = useLoad(() => api.dropoffs(samples), [samples]);

  const seedData = async () => {
    setSeeding(true);
    try { await api.seedSamples(); setSamples(true); load(); } catch (e) { alert(e.message); } finally { setSeeding(false); }
  };

  if (err) return <Notice tone="stop">{err}</Notice>;
  if (!d) return <p className="small">Loading…</p>;
  const term = q.trim().toLowerCase();
  const filtered = d.items.slice(0, 300).filter((i) => !term || `${i.leadId} ${i.name || ""} ${i.email || ""} ${i.phone || ""} ${i.state || ""} ${i.reason || ""}`.toLowerCase().includes(term));
  return (
    <div className="stack">
      <PageHeader
        title="Drop-off inventory"
        sub="Every file that left without enrolling. Click any row to inspect all data collected — debts, consents, plan details, events."
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="mini" disabled={seeding} onClick={seedData} title="Load 181 test applications into the database">
              {seeding ? "Seeding…" : "🧪 Seed test data"}
            </button>
            <label className="toggle"><input type="checkbox" checked={samples} onChange={(e) => { setSamples(e.target.checked); setOpenId(null); }} /> Include samples</label>
          </div>
        }
      />
      <Section title="Summary">
        <Stats>
          <Stat label="Exited files" value={int(d.totalExits)} />
          <Stat label="Resalable" value={int(d.resalableCount)} />
          <Stat label="Resale value range" value={`${usd(d.resalableValueLow)} – ${usd(d.resalableValueHigh)}`} sub={`Midpoint ${usd(d.resalableValueMid)}`} />
          <Stat label="Blocked on consent" value={int(d.consentBlockedCount)} tone={d.consentBlockedCount ? "warn" : null} />
        </Stats>
      </Section>

      <Section title="Price bands" note="Later exits carry more value. Failed ID checks are never resold.">
        <Table><thead><tr><th>Tier</th><th className="r">Band</th><th className="r">Files</th><th className="r">Resalable</th><th className="r">Resalable value</th><th>What it means</th></tr></thead>
          <tbody>{d.tiers.map((t) => <tr key={t.tier}><td><b>{t.tier}</b></td><td className="r">{usd(t.band[0])}–{usd(t.band[1])}</td><td className="r">{t.count}</td><td className="r">{t.resalableCount}</td><td className="r">{usd(t.resalableValueLow)}–{usd(t.resalableValueHigh)}</td><td className="small">{TIER_WHAT[t.tier]}</td></tr>)}</tbody></Table>
        <p className="small">{d.untiered} exits had no personal data yet — listed for completeness, not inventory.</p>
      </Section>

      <Section title={`${int(d.totalExits)} exited files`} note="Click any row to see everything collected. Toggle 'Include samples' above to see test data.">
        <input className="field slim" placeholder="Search name, email, phone, ID, state, reason…" value={q} onChange={(e) => { setQ(e.target.value); setOpenId(null); }} aria-label="Search drop-offs" />

        {!filtered.length && !d.items.length && (
          <Empty title="No drop-offs yet">
            {samples ? "No files have exited." : 'Toggle "Include samples" above to see seeded test data, or click "Seed test data" to load 181 test applications.'}
          </Empty>
        )}
        {!filtered.length && d.items.length > 0 && <Empty title="No matches for that search" />}

        {filtered.map((i) => {
          const isOpen = openId === i.leadId;
          const real = !i.leadId.startsWith("sample");
          return (
            <div key={i.leadId}>
              <div
                className="clickable"
                onClick={() => setOpenId(isOpen ? null : i.leadId)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 110px 130px 60px 180px 80px 90px 40px",
                  gap: "0 10px",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: isOpen ? "1px solid var(--brand)" : "1px solid var(--line)",
                  background: isOpen ? "var(--brand-tint)" : "var(--card)",
                  marginBottom: 4,
                  cursor: "pointer",
                  fontSize: 13,
                }}
                title="Click to expand / collapse"
              >
                <span>
                  <b>{i.name || "Guest"}</b>{" "}
                  <span className="small" style={{ color: "var(--muted)" }}>{i.email || i.phone || i.leadId.slice(-8)}</span>
                  {!real && <Pill style={{ marginLeft: 6 }}>sample</Pill>}
                </span>
                <span>{i.state || "–"}</span>
                <span className="small">{i.exitStep}. {i.exitStepName}</span>
                <span><Pill tone={TIER_COLOR[i.tier]}>{i.tier === "none" ? "–" : i.tier}</Pill></span>
                <span className="small" style={{ color: "var(--muted)" }}>{i.reason || "–"}</span>
                <span>{i.resalable ? <Pill tone="good">resalable</Pill> : <Pill tone="bad">no</Pill>}</span>
                <span className="small" style={{ color: "var(--muted)" }}>{when(i.exitedAt)}</span>
                <span style={{ textAlign: "right", color: "var(--brand)", fontWeight: 700 }}>{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <DropoffDetail
                  item={i}
                  onClose={() => setOpenId(null)}
                  openFull={() => { openFile(i.leadId); setOpenId(null); }}
                />
              )}
            </div>
          );
        })}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- access log
export function AccessLog() {
  const { d, err } = useLoad(() => api.accessLog());
  if (err) return <Notice tone="stop">{err}</Notice>;
  return (
    <div className="stack">
      <PageHeader title="Staff access log" sub="Immutable record of who viewed consumer files and who changed what. Admins only." />
      <Section title={d ? `${d.entries.length} entries` : "Loading…"}>
        {d && !d.entries.length ? <Empty title="No access recorded yet" /> : d && (
          <Table><thead><tr><th>Time</th><th>Staff</th><th>Role</th><th>Action</th><th>File</th><th>Detail</th><th>IP</th></tr></thead>
            <tbody>{d.entries.map((e) => <tr key={e.recId}><td className="small">{when(e.at)}</td><td>{e.email}</td><td>{e.role}</td><td><code>{e.action}</code></td><td className="small">{e.leadId ? e.leadId.slice(-8) : "–"}</td><td className="small">{e.detail || ""}</td><td className="small">{e.ip}</td></tr>)}</tbody></Table>
        )}
      </Section>
    </div>
  );
}
