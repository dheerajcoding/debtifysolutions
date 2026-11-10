// Checks homepage-final.html against the live site's own copy and config. Run: node parity-check.js
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "";

(async () => {
  const root = path.resolve(__dirname, "..");
  const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
  const html = fs.readFileSync(path.join(__dirname, "homepage-final.html"), "utf8");
  // the page stores text inside JS strings, so compare against the same text with quotes unescaped
  const norm = (s) => s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ");
  const page = norm(html);
  const has = (s) => page.includes(norm(s).replace(/"/g, '"'));

  const { SITE, RISKS } = await imp("client/src/lib/copy.js");
  const { BRAND } = await imp("shared/config/brand.js");
  const checks = [];
  const add = (name, ok, detail = "") => checks.push({ name, ok, detail });

  for (const lang of ["en", "es"]) {
    const x = SITE[lang];
    const miss = [];
    const must = (label, s) => { if (!has(s)) miss.push(`${label}: ${s.slice(0, 60)}`); };
    must("h1", x.h1.replace(/ on your own terms| a tu manera/, ""));
    x.faq.forEach(([q, a]) => { must("faq-q", q); must("faq-a", a); });
    x.how.forEach(([h]) => must("how", h));
    x.howShort.forEach((s) => must("howShort", s));
    x.security.forEach(([, h, p]) => { must("sec-h", h); must("sec-p", p); });
    x.trustbar.forEach(([, h, p]) => { must("trust-h", h); must("trust-p", p); });
    x.stories.forEach(([line, who]) => { must("story", line); must("story-who", who); });
    x.costP.forEach((p) => must("cost", p));
    x.endReassure.forEach((p) => must("reassure", p));
    must("legal", x.legal); must("endH", x.endH); must("endP", x.endP);
    must("guide", x.guide.blurb); must("peopleCap", x.peopleCap);
    add(`${lang.toUpperCase()} copy matches site`, miss.length === 0, miss.join(" | "));
  }
  const risks = [];
  RISKS.forEach((r) => ["en", "es"].forEach((l) => { if (!has(r.title[l])) risks.push(r.title[l]); if (!has(r.body[l])) risks.push(r.body[l]); }));
  add("Downside cards match site (EN+ES)", risks.length === 0, risks.join(" | "));
  add("Posture line matches BRAND.posture", has(BRAND.posture), "");

  const { PROVIDERS, CLOSED_STATES } = await imp("shared/config/providers.js");
  const { DEBT_RANGES } = await imp("shared/config/flow.js");
  const { quickEstimate } = await imp("server/src/routes/leads.js");
  const served = [...new Set(PROVIDERS.flatMap((p) => p.licensedStates))].filter((c) => !CLOSED_STATES.includes(c)).sort();
  const est = JSON.parse(html.match(/var EST=(\{.*?\});\n/s)[1]);
  const bands = JSON.parse(html.match(/var BANDS=(\[.*?\]);\n/s)[1]);
  add("Served states = live served states (24)", JSON.stringify(Object.keys(est).sort()) === JSON.stringify(served), `${Object.keys(est).length}`);
  add("Closed states never offered", CLOSED_STATES.every((c) => !est[c]), "");
  add("Debt bands = live DEBT_RANGES", JSON.stringify(bands.map((b) => b.id)) === JSON.stringify(Object.keys(DEBT_RANGES)), "");
  let bad = 0;
  for (const st of served) for (const b of Object.keys(DEBT_RANGES)) {
    const e = quickEstimate(st, b), p = est[st][b];
    if (p.dep[0] !== e.depositLow || p.dep[1] !== e.depositHigh || p.months[0] !== e.monthsLow || p.months[1] !== e.monthsHigh || p.resolve[0] !== e.resolveLow || p.resolve[1] !== e.resolveHigh) bad++;
  }
  add("All 120 state x band estimates equal server quickEstimate", bad === 0, `${bad} differ`);
  add("Estimates are ranges, never a point value", Object.values(est).every((s) => Object.values(s).every((e) => e.dep[0] < e.dep[1] && e.resolve[0] < e.resolve[1])), "");

  let fails = 0;
  for (const c of checks) { console.log((c.ok ? "PASS " : "FAIL ") + c.name + (c.ok ? "" : "  -> " + c.detail)); if (!c.ok) fails++; }
  console.log(`\n${checks.length - fails}/${checks.length} checks pass`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
