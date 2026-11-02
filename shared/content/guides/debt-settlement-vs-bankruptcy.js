import { AUTHORS } from "../people.js";
const guide = {
  slug: "debt-settlement-vs-bankruptcy",
  cluster: "risk",
  targetQuery: "debt settlement vs bankruptcy",
  title: "Debt settlement vs bankruptcy: an honest comparison",
  metaTitle: "Debt Settlement vs Bankruptcy: The Real Differences, Compared",
  metaDescription: "Bankruptcy stops lawsuits and garnishment immediately; debt settlement does not. A side-by-side comparison of cost, credit impact, timeline and who each one actually suits.",
  summary: "For a large number of people asking this question, bankruptcy is the better answer. We run a settlement platform and we will still say that, because the one thing bankruptcy does that settlement cannot do is stop collection the day you file.",
  author: AUTHORS.dkessler,
  reviewedBy: AUTHORS.rvance,
  publishedISO: "2026-08-21",
  lastReviewedISO: "2026-10-18",
  blocks: [
    { kind: "note", tone: "stop", title: "The difference that decides most cases", body: [
      "Filing bankruptcy triggers an automatic stay under 11 U.S.C. \xA7362. Collection calls, lawsuits, wage garnishments and bank levies stop by operation of law the moment the case is filed.",
      "A debt settlement programme has no equivalent and never will. You can be sued in month two of a programme and nothing about being enrolled will help you. If what you need is for the pressure to stop now, that points to a bankruptcy attorney, not to us."
    ] },
    { kind: "p", text: "These two things get compared as if they were competing products. They are not. One is a federal court process with statutory protections and a defined end point. The other is a private negotiation with counterparties who are under no obligation to negotiate. They solve overlapping problems by completely different means, and the right choice turns on a handful of specific facts about your situation." },
    { kind: "h2", id: "side-by-side", text: "Side by side" },
    {
      kind: "table",
      head: ["", "Debt settlement", "Chapter 7 bankruptcy", "Chapter 13 bankruptcy"],
      rows: [
        [
          "What it is",
          "Private negotiation with each creditor to accept less than the full balance, funded from money you save.",
          "Court-supervised liquidation. Non-exempt assets are sold; qualifying unsecured debts are discharged.",
          "Court-supervised repayment plan over three or five years, with the remaining qualifying balance discharged at the end."
        ],
        [
          "Stops collection calls",
          "No. Creditors may keep contacting you throughout.",
          "Yes, immediately on filing, by operation of law.",
          "Yes, immediately on filing, by operation of law."
        ],
        [
          "Stops lawsuits and garnishment",
          "No. A creditor can sue at any point during the programme.",
          "Yes. Pending suits are stayed and most garnishments must stop.",
          "Yes, and the plan can address a judgment already entered."
        ],
        [
          "Who decides the outcome",
          "Each creditor, individually. Some negotiate; some never do.",
          "The court, applying the Bankruptcy Code.",
          "The court, on confirmation of your plan."
        ],
        [
          "Cost",
          "A provider fee as a percentage of enrolled debt, capped by statute in many states, payable only after a debt settles and you have paid on it. Plus an administrator account fee. Plus possible tax on forgiven amounts.",
          "Court filing fee, a required counselling course, and attorney\u2019s fees commonly in the low thousands for a straightforward case. Fee waivers exist at low incomes.",
          "Court filing fee plus attorney\u2019s fees, a substantial part of which is usually paid through the plan rather than up front."
        ],
        [
          "Credit file",
          "Delinquencies, charge-offs and settled-for-less notations on each enrolled account; seven years from first delinquency.",
          "The filing is reportable for ten years from the filing date.",
          "The filing is reportable for seven years from the filing date."
        ],
        [
          "Timeline",
          "Panel providers estimate programme terms in the range of thirty to forty-eight months. Individual accounts settle when a creditor is willing, or not at all.",
          "Commonly a few months from filing to discharge.",
          "Three or five years, fixed by the confirmed plan."
        ],
        [
          "Assets at risk",
          "Nothing is taken by the process, but a creditor who sues and wins can reach non-exempt assets and bank accounts.",
          "Non-exempt assets may be sold by the trustee. Exemptions vary substantially by state.",
          "You keep your property and pay its value through the plan."
        ],
        [
          "Public record",
          "No.",
          "Yes.",
          "Yes."
        ],
        [
          "Certainty",
          "Low. No creditor is obliged to settle and the number is never known in advance.",
          "High once eligibility is established. The discharge is a court order.",
          "High once the plan is confirmed, provided you make the payments."
        ]
      ]
    },
    { kind: "h2", id: "where-bankruptcy-wins", text: "Where bankruptcy is clearly the better answer" },
    { kind: "p", text: "There are situations where the comparison is not close, and a provider who enrols you anyway is taking your money for something that will not help. If any of these describe you, see a bankruptcy attorney before you do anything else." },
    { kind: "ul", items: [
      "You have already been sued, or served with a summons, or a judgment has been entered against you.",
      "Your wages are being garnished or your bank account has been levied.",
      "Your unsecured balances are so far beyond your income that no realistic monthly deposit would fund settlements on all of them.",
      "You are facing foreclosure or repossession and need time. Chapter 13 can cure an arrears over a plan; settlement cannot touch secured debt at all.",
      "The debts are largely medical and the amounts are very large relative to income.",
      "Your income is low enough that you would likely qualify for a filing fee waiver, which is also a signal that the means test will not be a problem."
    ] },
    { kind: "h2", id: "where-settlement-can-make-sense", text: "Where settlement can make sense" },
    { kind: "p", text: "A narrower set of circumstances, honestly stated. Settlement is plausible when all of the following are true, and weak when any one of them is not." },
    { kind: "ol", items: [
      "The debts are unsecured \u2014 credit cards, store cards, personal loans, some collection accounts.",
      "You have been through nonprofit credit counselling and a debt management plan does not fit, either because you were declined or because you cannot afford the consolidated payment.",
      "You have specifically considered bankruptcy and have a concrete reason against it, not a vague reluctance. A security clearance, a professional licensing condition, a non-exempt asset you would lose, or failing the Chapter 7 means test while being unable to fund a Chapter 13 plan are concrete reasons.",
      "You can fund a monthly deposit consistently for years. A programme that you abandon halfway can leave you having paid fees on the accounts that settled while still owing the ones that did not.",
      "You can absorb the risk of being sued on an account that has not settled yet."
    ] },
    { kind: "note", tone: "warn", title: '"Bankruptcy will ruin my life" is usually wrong', body: [
      "The most common reason people choose settlement over bankruptcy is a belief about bankruptcy that does not survive contact with a lawyer. It is not a public shaming, most filers keep their home and their car, exemptions protect far more than people expect in many states, and the ten-year reporting period often matters less in practice than four years of accumulating delinquencies does.",
      "Most consumer bankruptcy attorneys give a free initial consultation, and legal aid offices often provide one at no cost. Have the conversation before you rule it out."
    ] },
    { kind: "h2", id: "the-tax-asymmetry", text: "The tax asymmetry nobody mentions" },
    { kind: "p", text: "Debt forgiven in a settlement may be treated by the IRS as ordinary income, and the creditor may issue a Form 1099-C for the written-off amount. Exclusions exist \u2014 insolvency is the common one \u2014 but they have to be claimed and documented on your return." },
    { kind: "p", text: "Debt discharged in bankruptcy is excluded from gross income under section 108(a)(1)(A) of the Internal Revenue Code. No insolvency computation, no worksheet, no argument with the IRS about the fair market value of your assets on a particular date. For someone with large balances and some assets, this difference alone can be worth more than everything else in the comparison. Talk to a tax professional about your own position \u2014 we cannot advise you on it." },
    { kind: "h2", id: "what-neither-one-fixes", text: "What neither one fixes" },
    { kind: "ul", items: [
      "Most federal student loans. These are not dischargeable in bankruptcy absent a hardship showing, and they are not settled in a commercial programme. Federal income-driven repayment and forgiveness routes are separate and usually better.",
      "Child support and spousal maintenance. Not dischargeable, not settleable.",
      "Recent tax debt. Some older taxes can be discharged on strict conditions; current ones cannot. The IRS has its own instalment and offer-in-compromise programmes.",
      "Secured debt where you want to keep the asset. You keep paying it, or you lose it.",
      "An income that does not cover your living costs. Neither process creates income. If the shortfall is structural, the shortfall is the problem to solve."
    ] },
    { kind: "h2", id: "how-to-decide", text: "How to decide, in order" },
    { kind: "ol", items: [
      "Ask each card issuer what hardship programme they run. It is free, it is rarely advertised, and it sometimes solves the whole problem.",
      "Get free counselling from an NFCC-accredited nonprofit agency and find out whether a debt management plan fits.",
      "Get a free consultation with a consumer bankruptcy attorney. Ask specifically whether you pass the means test and what you would lose.",
      "Only then compare what a settlement programme would cost you against what those two said, with the fee percentage in writing and the state cap checked."
    ] },
    { kind: "p", text: "If that order means you never reach step four, the process worked. We would rather you ended up somewhere cheaper than pay us a fee for something that was the wrong instrument for your situation." }
  ],
  faqs: [
    {
      q: "Is debt settlement better than bankruptcy?",
      a: "Usually not, for the people asking. Bankruptcy triggers an automatic stay that stops collection calls, lawsuits and garnishment immediately, gives a court-ordered outcome rather than a negotiation, and excludes discharged debt from taxable income. Settlement does none of those things. Settlement is worth considering mainly when the debts are unsecured, a nonprofit debt management plan does not fit, and you have a concrete reason against filing."
    },
    {
      q: "Does bankruptcy stop a wage garnishment?",
      a: "Yes. The automatic stay under 11 U.S.C. \xA7362 takes effect when the case is filed and most garnishments for consumer debt must stop. A debt settlement programme does not stop a garnishment."
    },
    {
      q: "Which is worse for your credit, settlement or bankruptcy?",
      a: "A bankruptcy filing is reportable for longer: ten years for Chapter 7 and seven for Chapter 13, against seven years from first delinquency for each settled account. But bankruptcy stops new derogatory information from being added on the filing date, while a settlement programme keeps adding it for years, so recovery often begins sooner after a discharge."
    },
    {
      q: "Is forgiven debt taxable in bankruptcy?",
      a: "No. Debt discharged in a bankruptcy case is excluded from gross income under IRC section 108(a)(1)(A). Debt forgiven in a private settlement may be taxable, and an exclusion such as insolvency has to be claimed and documented."
    },
    {
      q: "Can I do debt settlement and then file bankruptcy if it does not work?",
      a: "You can file afterwards, but you will have spent months or years of payments and any fees charged on accounts that settled, and the accounts that never settled will still be there. That is a reason to get the bankruptcy consultation first rather than last."
    },
    {
      q: "Will I lose my house or car if I file Chapter 7?",
      a: "Often not, but it depends entirely on your state\u2019s exemptions and on whether you are current on the secured payments. This is the question to put to a bankruptcy attorney about your own facts; general information cannot answer it."
    }
  ],
  substantiation: [
    "The automatic stay and its effect on collection, litigation and garnishment are set out in 11 U.S.C. \xA7362.",
    "The exclusion of debt discharged in bankruptcy from gross income is IRC \xA7108(a)(1)(A). The insolvency exclusion available outside bankruptcy is \xA7108(a)(1)(B).",
    "Credit reporting durations: ten years for a bankruptcy filing and seven years for most other adverse items under the Fair Credit Reporting Act, 15 U.S.C. \xA71681c.",
    "Programme term ranges are stated as the estimates recorded by providers on our panel in config/providers.ts, attributed as estimates and not as outcomes.",
    "Attorney fee levels are described qualitatively because they vary by district and complexity, and no figure could be substantiated nationally.",
    "No claim is made about the proportion of accounts that settle, the amounts creditors accept, or how either process will turn out for an individual."
  ],
  sources: [
    { label: "11 U.S.C. \xA7362 \u2014 the automatic stay", href: "https://www.law.cornell.edu/uscode/text/11/362" },
    { label: "IRC \xA7108 \u2014 income from discharge of indebtedness", href: "https://www.law.cornell.edu/uscode/text/26/108" },
    { label: "US Courts: bankruptcy basics", href: "https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics" },
    { label: "IRS Topic 431 \u2014 canceled debt", href: "https://www.irs.gov/taxtopics/tc431" }
  ],
  related: [
    "does-debt-settlement-hurt-your-credit",
    "can-creditors-sue-you-during-debt-settlement",
    "debt-settlement-tax-consequences-1099-c"
  ]
};
export {
  guide
};
