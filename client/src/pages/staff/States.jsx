import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { Empty, Notice, PageHeader, Pill, Section, Stat, Stats, Table, int } from "./ui.jsx";

// Served states: which states a licensed partner can enrol in, editable at runtime.
// A state is "served" only when it is not closed AND at least one provider is licensed
// there — so opening a state means assigning it to a provider, not just flipping a flag.
export default function States() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");

  // Quick add form state
  const [addState, setAddState] = useState("");
  const [addProvider, setAddProvider] = useState("");
  const [addErr, setAddErr] = useState("");

  const load = () => api.panel().then((r) => { setD(r); setErr(null); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const save = async (patch) => {
    setBusy("saving");
    try { const r = await api.savePanel(patch); setD(r); setErr(null); return r; }
    catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  };

  if (err && !d) return <Notice tone="stop" title="Could not load the panel">{err}</Notice>;
  if (!d) return <p className="small">Loading…</p>;

  // ── Quick add ──────────────────────────────────────────────────────────────
  const unservedStates = d.states.filter((s) => !s.open && !s.closed);

  const handleAdd = async () => {
    setAddErr("");
    if (!addState) { setAddErr("Pick a state first."); return; }
    if (!addProvider) { setAddErr("Pick a provider first."); return; }
    const prov = d.providers.find((p) => p.id === addProvider);
    if (!prov) return;
    const next = [...new Set([...prov.licensedStates, addState])];
    const r = await save({ licensedStates: { [addProvider]: next } });
    if (r) { setAddState(""); setAddProvider(""); }
  };

  // ── Quick remove ───────────────────────────────────────────────────────────
  const handleRemove = async (stateCode, providerId) => {
    const prov = d.providers.find((p) => p.id === providerId);
    if (!prov) return;
    const next = prov.licensedStates.filter((s) => s !== stateCode);
    save({ licensedStates: { [providerId]: next } });
  };

  // Remove state from ALL providers at once
  const handleRemoveAll = async (stateCode) => {
    if (!window.confirm(`Remove ${stateCode} from all providers? Consumers there will no longer be accepted.`)) return;
    const patch = {};
    for (const prov of d.providers) {
      if (prov.licensedStates.includes(stateCode)) {
        patch[prov.id] = prov.licensedStates.filter((s) => s !== stateCode);
      }
    }
    if (Object.keys(patch).length) save({ licensedStates: patch });
  };

  // ── Table ──────────────────────────────────────────────────────────────────
  const toggleClosed = (code, closed) => {
    const next = new Set(d.states.filter((s) => s.closed).map((s) => s.code));
    if (closed) next.add(code); else next.delete(code);
    save({ closedStates: [...next] });
  };

  const toggleProvider = (code, providerId, on) => {
    const prov = d.providers.find((p) => p.id === providerId);
    const next = new Set(prov.licensedStates);
    if (on) next.add(code); else next.delete(code);
    save({ licensedStates: { [providerId]: [...next] } });
  };

  const term = q.trim().toLowerCase();
  const rows = d.states.filter((s) => !term || s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term));
  const custom = d.customised.closedStates || d.customised.feeCaps > 0 || d.customised.providers > 0;

  // Served state chips (grouped by state, list providers)
  const servedStates = d.states.filter((s) => s.open);

  return (
    <div className="stack">
      <PageHeader
        title="Served states"
        sub="Turn a state on by licensing a provider there. Changes apply immediately to the application, the website and the decision engine, and are written to the access log."
        right={custom ? <button className="mini danger" disabled={!!busy} onClick={() => save({ reset: true })}>Reset to defaults</button> : null}
      />
      <Notice tone="info" title="How a state becomes available">
        A consumer can only enrol where a licensed partner can contract with them. Tick a provider for
        that state to open it. "Closed" is an override that blocks a state even if a provider is licensed.
      </Notice>
      {err && <Notice tone="stop" title="Could not save">{err}</Notice>}

      {/* ── Stats ── */}
      <Section title="Summary">
        <Stats>
          <Stat label="States served" value={int(d.servedCount)} />
          <Stat label="Closed by override" value={int(d.states.filter((s) => s.closed).length)} />
          <Stat label="No provider licensed" value={int(d.states.filter((s) => !s.closed && !s.providers.length).length)} />
          <Stat label="Providers on panel" value={int(d.providers.length)} />
        </Stats>
      </Section>

      {/* ── Quick Add ── */}
      <Section title="Add a state" note="Assign a state to a provider to start accepting applicants there immediately.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="small" style={{ fontWeight: 700 }}>State</label>
            <select
              className="field slim"
              value={addState}
              onChange={(e) => setAddState(e.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="">— pick a state —</option>
              {d.states
                .filter((s) => !s.closed)
                .map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code}){s.open ? " ✓ already serving" : ""}
                  </option>
                ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="small" style={{ fontWeight: 700 }}>Provider</label>
            <select
              className="field slim"
              value={addProvider}
              onChange={(e) => setAddProvider(e.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="">— pick a provider —</option>
              {d.providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button
            className="mini"
            disabled={!!busy || !addState || !addProvider}
            onClick={handleAdd}
            style={{ background: "var(--brand)", color: "var(--on-brand)", height: 36, alignSelf: "flex-end" }}
          >
            {busy === "saving" ? "Saving…" : "+ Add state"}
          </button>
        </div>
        {addErr && <p className="small" style={{ color: "var(--bad)", marginTop: 6 }}>{addErr}</p>}
      </Section>

      {/* ── Currently served — chips with remove ── */}
      <Section title="Currently served states" note="Click Remove to stop accepting new applicants from that state.">
        {servedStates.length === 0 ? (
          <Empty title="No states are being served yet" />
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {servedStates.map((s) => (
              <div
                key={s.code}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: "var(--card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minWidth: 160,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name} <span className="small" style={{ color: "var(--muted)" }}>{s.code}</span></span>
                  <Pill tone="good">live</Pill>
                </div>
                <div className="small" style={{ color: "var(--muted)" }}>
                  {s.providers.map((p) => p.name).join(", ")}
                </div>
                {s.providers.length === 1 ? (
                  <button
                    className="mini danger"
                    disabled={!!busy}
                    onClick={() => handleRemove(s.code, s.providers[0].id)}
                    style={{ fontSize: 11, padding: "3px 8px" }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="mini danger"
                    disabled={!!busy}
                    onClick={() => handleRemoveAll(s.code)}
                    style={{ fontSize: 11, padding: "3px 8px" }}
                  >
                    Remove all
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Full table ── */}
      <Section title="All states — detailed view" note="Tick a provider to license it in that state. Closing a state overrides every provider.">
        <input className="field slim" placeholder="Search a state…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search states" />
        {rows.length === 0 ? <Empty title="No state matches that search" /> : (
          <Table>
            <thead>
              <tr>
                <th>State</th>
                <th>Status</th>
                {d.providers.map((p) => <th key={p.id}>{p.name}</th>)}
                <th>Fee cap</th>
                <th>Closed override</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.code}>
                  <td><b>{s.name}</b> <span className="small">{s.code}</span></td>
                  <td>{s.closed ? <Pill tone="bad">closed</Pill> : s.open ? <Pill tone="good">serving</Pill> : <Pill tone="warn">no provider</Pill>}</td>
                  {d.providers.map((p) => (
                    <td key={p.id}>
                      <input
                        type="checkbox"
                        aria-label={`${p.name} licensed in ${s.name}`}
                        disabled={!!busy}
                        checked={p.licensedStates.includes(s.code)}
                        onChange={(e) => toggleProvider(s.code, p.id, e.target.checked)}
                      />
                    </td>
                  ))}
                  <td className="small">{s.feeCap == null ? "no cap" : `${Math.round(s.feeCap * 100)}%`}</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Close ${s.name}`}
                      disabled={!!busy}
                      checked={s.closed}
                      onChange={(e) => toggleClosed(s.code, e.target.checked)}
                    />
                  </td>
                  <td>
                    {s.open && (
                      <button
                        className="mini danger"
                        style={{ fontSize: 11, padding: "2px 7px" }}
                        disabled={!!busy}
                        onClick={() => handleRemoveAll(s.code)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </div>
  );
}
