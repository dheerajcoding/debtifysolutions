// Small building blocks for the staff console.
export const usd = (n) => (n == null ? "–" : (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US"));
export const pct = (v, d = 1) => `${((v || 0) * 100).toFixed(d)}%`;
export const int = (n) => (n || 0).toLocaleString("en-US");
export const when = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "–");

export const PageHeader = ({ title, sub, right }) => (
  <div className="adm-head"><div><h1>{title}</h1>{sub && <p className="small">{sub}</p>}</div>{right}</div>
);
export const Section = ({ title, note, children, id }) => (
  <section className="panel adm-sec" id={id}>
    <h3>{title}</h3>
    {note && <p className="small">{note}</p>}
    {children}
  </section>
);
export const Stat = ({ label, value, sub, tone }) => (
  <div className={"kpi" + (tone ? " kpi-" + tone : "")}><div className="v">{value}</div><div className="k">{label}</div>{sub && <div className="small">{sub}</div>}</div>
);
export const Stats = ({ children }) => <div className="kpis">{children}</div>;
export const Empty = ({ title, children }) => <div className="empty"><b>{title}</b>{children && <p className="small">{children}</p>}</div>;
export const Notice = ({ tone = "info", title, children }) => <div className={"note note-" + tone}>{title && <b>{title}</b>}<div>{children}</div></div>;
export const RateBar = ({ value }) => (
  <div className="ratebar"><i style={{ width: `${Math.min(100, (value || 0) * 100)}%` }} /><span>{pct(value)}</span></div>
);
export const Pill = ({ tone = "info", children }) => <span className={"chip c-" + tone}>{children}</span>;
export const Table = ({ children }) => <div className="tbl"><table>{children}</table></div>;
export const Hash = ({ v }) => <code className="hash" title={v}>{v ? String(v).slice(0, 12) + "…" : "–"}</code>;
export const outcomeTone = (o) => (o === "enrolled" ? "good" : o === "in_progress" ? "info" : o === "declined" || o === "cancelled" ? "bad" : "warn");
