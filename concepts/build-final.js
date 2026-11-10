// Builds homepage-final.html as one standalone file:
//  - embeds the testimonial photos as data URIs
//  - embeds estimates computed by the real server function (quickEstimate) for every served state and debt band,
//    so the page shows exactly what the live flow would show.
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "";

(async () => {
  const root = path.resolve(__dirname, "..");
  const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
  const { PROVIDERS, CLOSED_STATES } = await imp("shared/config/providers.js");
  const { DEBT_RANGES } = await imp("shared/config/flow.js");
  const { quickEstimate } = await imp("server/src/routes/leads.js");

  const served = [...new Set(PROVIDERS.flatMap((p) => p.licensedStates))].filter((c) => !CLOSED_STATES.includes(c)).sort();
  const bands = Object.entries(DEBT_RANGES).map(([id, r]) => ({ id, label: r.label.replace(/\s+/g, " "), mid: r.mid }));
  const est = {};
  for (const st of served) {
    est[st] = {};
    for (const b of bands) {
      const e = quickEstimate(st, b.id);
      est[st][b.id] = {
        resolve: [e.resolveLow, e.resolveHigh],
        dep: [e.depositLow, e.depositHigh],
        months: [e.monthsLow, e.monthsHigh],
        fee: [Math.round(e.feeLow * 100), Math.round(e.feeHigh * 100)],
      };
    }
  }

  let html = fs.readFileSync(path.join(__dirname, "homepage-final.template.html"), "utf8");
  for (const name of ["cris", "martin", "marina", "hellen", "romario", "marrie"]) {
    const b64 = fs.readFileSync(path.join(root, "client", "public", "testimonials", `${name}.jpg`)).toString("base64");
    html = html.split(`__IMG_${name}__`).join(`data:image/jpeg;base64,${b64}`);
  }
  for (let i = 1; i <= 4; i++) {
    const b64 = fs.readFileSync(path.join(__dirname, "story", `story-${i}.webp`)).toString("base64");
    html = html.split(`__STORY_${i}__`).join(`data:image/webp;base64,${b64}`);
  }
  html = html.replace("__BANDS__", JSON.stringify(bands)).replace("__ESTIMATES__", JSON.stringify(est));
  if (html.includes("__STORY_") || html.includes("__IMG_") || html.includes("__BANDS__") || html.includes("__ESTIMATES__")) throw new Error("a placeholder was not replaced");
  fs.writeFileSync(path.join(__dirname, "homepage-final.html"), html);
  console.log("homepage-final.html", Math.round(html.length / 1024) + " KB", "states:", served.length, "bands:", bands.length);

  // Same page in the live site's palette: deep spruce, teal, marigold, spruce-tinted canvas, Bricolage Grotesque + Public Sans.
  const swap = [
    // fonts
    ["family=Plus+Jakarta+Sans:wght@400;500;600;700;800", "family=Bricolage+Grotesque:wght@600;700;800&family=Public+Sans:wght@400;500;600;700;800"],
    ["--font:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;", "--font:'Public Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--display:'Bricolage Grotesque','Public Sans',system-ui,sans-serif;"],
    ["font-family=\"Plus Jakarta Sans,sans-serif\"", "font-family=\"Bricolage Grotesque,Public Sans,sans-serif\""],
    // surfaces and text
    ["--navy:#0B1E3F; --navy2:#12306B; --ink:#0E1A2B; --soft:#52627A; --paper:#F5F8FC; --card:#fff; --line:#E1E8F2;", "--navy:#0F2A2E; --navy2:#0E3834; --ink:#0F2A2E; --soft:#3E5458; --paper:#F3F7F5; --card:#fff; --line:#D9E4E0;"],
    ["--emerald:#10B981; --emerald-ink:#047857; --emerald-tint:#E7F8F1; --sun:#FF8A3D; --sun-ink:#1A0E03; --gold:#F2A93B;", "--emerald:#2BB5A0; --emerald-ink:#0B7A6E; --emerald-tint:#DFF1EC; --sun:#F2A93B; --sun-ink:#231704; --gold:#F2A93B;"],
    ["--brand:#047857; --accent:#F2A93B; --good:#10B981;", "--brand:#0B7A6E; --accent:#F2A93B; --good:#1E7B4F;"],
    // dark-surface text and highlights
    ["#7ee7c0", "#8FE0D2"], ["#cfe0ff", "#B9CCC8"], ["#c7d6f2", "#B9CCC8"], ["#a9bfe6", "#9FB8B3"], ["#dbe7ff", "#D7E6E2"], ["#9db8ff", "#F5B84F"],
    ["#07142C", "#0B1D20"], ["#9fb3d6", "#9FB8B3"],
    // accents and neutrals
    ["#10B981", "#2BB5A0"], ["#047857", "#0B7A6E"], ["#4f6eff", "#F2A93B"], ["#4F6EFF", "#0B7A6E"], ["#8B5CF6", "#8F5F00"], ["#F0745B", "#B3261E"],
    ["#0ea5a0", "#0B7A6E"], ["#E7F8F1", "#DFF1EC"], ["#b7ead7", "#BFE3DA"], ["#DDF5EC", "#DFF1EC"], ["#D9E4FF", "#FDF0D9"],
    ["#12306B", "#0E3834"], ["#0B1E3F", "#0F2A2E"], ["#0E1A2B", "#0F2A2E"], ["#0F6E5C", "#0B7A6E"], ["#0F2A2E", "#0F2A2E"],
    ["#64748B", "#5C7377"], ["#EEF2F8", "#EAF1EE"], ["#CBD5E1", "#C9D8D5"], ["#cbd5e5", "#C9D8D5"], ["#b8c6de", "#B9CCC8"], ["#C9D7EE", "#C9D8D5"],
    ["#FF8A3D", "#F2A93B"], ["#1A0E03", "#231704"], ["#3FB58B", "#2BB5A0"], ["#B7E3D2", "#BFE3DA"],
    // rgba shadows/glows
    ["rgba(255,138,61,", "rgba(242,169,59,"], ["rgba(11,30,63,", "rgba(15,42,46,"], ["rgba(16,185,129,", "rgba(60,194,174,"], ["rgba(79,110,255,.30)", "rgba(11,122,110,.45)"],
    // titles
    ["<title>Debtify Homepage Draft</title>", "<title>Debtify Site Colour Draft</title>"],
  ];
  let themed = html;
  for (const [a, b] of swap) themed = themed.split(a).join(b);
  // headings and numbers in the display face, as on the live site
  themed = themed.replace("</style>", "h1,h2,h3,.brand,.big,.num,.dep .v,.glance .bill b,.cf-card blockquote{font-family:var(--display)}\nh1.hl{letter-spacing:-.025em;line-height:1.05}\n.btn{font-weight:800}\n</style>");
  fs.writeFileSync(path.join(__dirname, "homepage-final-site-colours.html"), themed);
  console.log("homepage-final-site-colours.html", Math.round(themed.length / 1024) + " KB");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
