function tocOf(guide) {
  return guide.blocks.filter((b) => b.kind === "h2").map((b) => ({ id: b.id, text: b.text }));
}
function wordCountOf(guide) {
  let n = guide.summary.split(/\s+/).length;
  for (const b of guide.blocks) {
    switch (b.kind) {
      case "p":
        n += b.text.split(/\s+/).length;
        break;
      case "h2":
      case "h3":
        n += b.text.split(/\s+/).length;
        break;
      case "ul":
      case "ol":
        n += b.items.join(" ").split(/\s+/).length;
        break;
      case "note":
        n += b.body.join(" ").split(/\s+/).length;
        break;
      case "table":
        n += b.rows.flat().join(" ").split(/\s+/).length;
        break;
      case "definition":
        n += b.text.split(/\s+/).length;
        break;
    }
  }
  for (const f of guide.faqs) n += (f.q + " " + f.a).split(/\s+/).length;
  return n;
}
function readingMinutesOf(guide) {
  return Math.max(1, Math.round(wordCountOf(guide) / 220));
}
function formatReviewDate(iso) {
  return (/* @__PURE__ */ new Date(`${iso}T00:00:00Z`)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}
export {
  formatReviewDate,
  readingMinutesOf,
  tocOf,
  wordCountOf
};
