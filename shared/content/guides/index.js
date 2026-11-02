import { guide as credit } from "./does-debt-settlement-hurt-your-credit.js";
import { guide as bankruptcy } from "./debt-settlement-vs-bankruptcy.js";
import { guide as stopPaying } from "./what-happens-if-you-stop-paying-your-credit-card.js";
import { guide as tax } from "./debt-settlement-tax-consequences-1099-c.js";
import { guide as sued } from "./can-creditors-sue-you-during-debt-settlement.js";
import { guide as twentyK } from "./how-to-get-out-of-20000-credit-card-debt.js";
const CLUSTERS = [
  {
    id: "problem",
    title: "When the payments stop fitting your income",
    blurb: "What actually happens, in what order, and what the cheap interventions are before anything drastic. Start here if you have missed a payment or are about to."
  },
  {
    id: "risk",
    title: "The risks and the objections",
    blurb: "The questions worth asking before you enrol in anything: what it does to your credit, whether you can still be sued, what the IRS does with forgiven debt, and how it compares with filing."
  },
  {
    id: "amount",
    title: "By amount and by state",
    blurb: "The arithmetic at specific balances, and what the rules in your state mean for you \u2014 including the states where we have nothing to offer."
  },
  {
    id: "core",
    title: "Debt settlement, from the beginning",
    blurb: "How the mechanism works, who provides it, what it costs, and the parts the industry tends not to put in the brochure."
  }
];
const GUIDES = [
  stopPaying,
  credit,
  sued,
  bankruptcy,
  tax,
  twentyK
];
const guideBySlug = (slug) => GUIDES.find((g) => g.slug === slug);
const guideSlugs = () => GUIDES.map((g) => g.slug);
function guidesInCluster(id) {
  return GUIDES.filter((g) => g.cluster === id);
}
function relatedGuides(g) {
  return g.related.map(guideBySlug).filter((x) => x !== void 0 && x.slug !== g.slug);
}
function guidesByReviewDate() {
  return [...GUIDES].sort((a, b) => b.lastReviewedISO.localeCompare(a.lastReviewedISO));
}
export {
  CLUSTERS,
  GUIDES,
  guideBySlug,
  guideSlugs,
  guidesByReviewDate,
  guidesInCluster,
  relatedGuides
};
