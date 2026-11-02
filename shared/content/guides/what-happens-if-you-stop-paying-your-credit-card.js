import { AUTHORS } from "../people.js";
const guide = {
  slug: "what-happens-if-you-stop-paying-your-credit-card",
  cluster: "problem",
  targetQuery: "what happens if you stop paying your credit card",
  title: "What happens if you stop paying your credit card",
  metaTitle: "What Happens If You Stop Paying Your Credit Card: A Month-by-Month Timeline",
  metaDescription: "Day 1 to year seven: late fees, penalty APR, credit reporting, charge-off at around 180 days, sale to a debt buyer, and the lawsuit window. What actually happens, in order.",
  summary: "This is the question people search at two in the morning, and it deserves a timeline rather than a sales pitch. Here is what happens month by month when a credit card goes unpaid \u2014 including the parts that arrive long after you have stopped expecting post.",
  author: AUTHORS.mokafor,
  reviewedBy: AUTHORS.rvance,
  publishedISO: "2026-07-30",
  lastReviewedISO: "2026-10-18",
  blocks: [
    { kind: "p", text: "Nothing dramatic happens on the day you miss a payment. That is part of what makes this difficult: the consequences are real but they arrive slowly, in a sequence most people have never had described to them, and the worst of them arrive late enough that it is easy to believe they are not coming." },
    { kind: "p", text: "The timeline below is the standard shape for an unsecured credit card account with a US issuer. Individual issuers vary at the margins and state law varies considerably at the end of it, but the spine is consistent because it is driven by federal banking classification rules rather than by individual collections strategy." },
    { kind: "h2", id: "days-1-29", text: "Days 1 to 29: fees and phone calls" },
    { kind: "p", text: "A late fee is assessed after the due date, subject to the cap the CARD Act imposes on the first and subsequent late fees. Many agreements also allow a penalty APR, which can be applied to the existing balance after you are sixty days late and to new transactions sooner. Your minimum payment next month will therefore be higher than it was this month, on a balance that is also higher." },
    { kind: "p", text: "The calls start in this window, usually from the issuer\u2019s own in-house team rather than an agency. Nothing has been reported to the credit bureaus yet. This is the cheapest point at which to act, and the point at which almost nobody does, because the credit file is still clean and the problem still feels survivable." },
    { kind: "note", tone: "info", title: "Ask for the hardship programme by name", body: [
      'Most large issuers run a hardship or forbearance programme: a temporarily reduced interest rate, a reduced or deferred payment, or a fixed-payment workout that closes the account and repays it over several years. They are rarely advertised and they cost nothing to ask about. Call the number on the back of the card and use the words "hardship programme".'
    ] },
    { kind: "h2", id: "day-30", text: "Day 30: the first credit bureau report" },
    { kind: "p", text: "At thirty days past due the delinquency is reported to the credit bureaus. Payment history is the heaviest-weighted input in common scoring models, and the first reported late payment is normally the single sharpest drop a file experiences. This is also the date that matters most later: the date of first delinquency sets the seven-year clock for how long the whole episode remains on your credit report, and it does not reset when the account is sold, settled or sued on." },
    { kind: "p", text: "Other lenders see this. Card issuers review existing customers, and cards you are still paying on time may be closed or have their limits cut because of a delinquency on a different account." },
    { kind: "h2", id: "days-60-150", text: "Days 60 to 150: escalation" },
    { kind: "ul", items: [
      "Each billing cycle adds another reported delinquency stage: 60, 90, 120, 150 days.",
      "The account is usually closed to new purchases somewhere in this window.",
      "Interest continues to accrue, now often at the penalty rate, and late fees continue each cycle. The balance grows every month.",
      "Collection contact intensifies and may move to an external agency working on the issuer\u2019s behalf.",
      "Settlement offers sometimes appear from the issuer itself in this window, particularly as the charge-off date approaches."
    ] },
    { kind: "p", text: "Two legal protections are worth knowing here. Under the Fair Debt Collection Practices Act, third-party collectors cannot call you at unreasonable hours, cannot call you at work after you tell them not to, and must stop contacting you if you send a written request to cease \u2014 which does not extinguish the debt but does end the calls. And if you dispute the debt in writing within thirty days of their first notice, they must verify it before continuing collection." },
    { kind: "h2", id: "day-180", text: "Around day 180: charge-off" },
    { kind: "p", text: "At roughly 180 days past due, the issuer charges the account off. The word causes more confusion than any other term in this area, so: a charge-off is an accounting event. The bank moves the balance off its performing assets and books it as a loss. It does not mean the debt is forgiven, cancelled or gone. You still owe every cent of it." },
    { kind: "p", text: "A charge-off is reported to the bureaus and is among the most damaging single entries a consumer file can carry. After it, one of three things normally happens: the issuer keeps the account and continues collecting internally; it places the account with a contingency collection agency; or it sells the account outright to a debt buyer for a fraction of the face value." },
    { kind: "h2", id: "after-charge-off", text: "After charge-off: the debt buyer" },
    { kind: "p", text: "If the account is sold, the buyer now owns the debt and will collect in its own name. It may report a separate collection account to the bureaus, which can mean two entries on your file arising from one debt \u2014 legitimately, provided the original tradeline shows a zero balance and the dates are right." },
    { kind: "p", text: "Whether interest keeps accruing after a sale depends on the original agreement and on state law, and buyers\u2019 practices differ. What matters to you is that the buyer paid very little for the account, which is why a charged-off, sold account is where most negotiation actually happens. It is also where the documentation is weakest, which is the single most useful fact a consumer can know at this stage." },
    { kind: "note", tone: "warn", title: "Never pay a collector without validation in writing", body: [
      "Debts are sold in bulk spreadsheets, and the underlying account documents often do not travel with them. Request validation in writing within thirty days of the collector\u2019s first communication. Ask for the original creditor, the account number, the amount claimed and the chain of assignment. And never make a small goodwill payment on an old debt before you have checked your state\u2019s limitation period \u2014 in many states a partial payment restarts the clock on a debt that was no longer suable."
    ] },
    { kind: "h2", id: "the-lawsuit-window", text: "The lawsuit window" },
    { kind: "p", text: "A creditor or debt buyer can file suit at any point while the debt is within your state\u2019s limitation period, which runs from roughly three to ten years depending on the state and on which statutory clock the court applies. There is no requirement to wait, and no stage at which you are safe because nothing has happened yet." },
    { kind: "p", text: "If you are served, the worst thing you can do is nothing. Most consumer debt judgments are default judgments entered because the defendant did not respond. Answering the complaint within the deadline puts the plaintiff to proof, and in a bought-debt case proof is often the plaintiff\u2019s weakest point. With a judgment entered, a creditor can in most states garnish wages, levy a bank account, or attach a lien to property \u2014 though a handful of states, Texas, Pennsylvania, North Carolina and South Carolina among them, do not permit wage garnishment for ordinary consumer debt at all." },
    { kind: "h2", id: "the-tax-letter", text: "The tax letter you were not expecting" },
    { kind: "p", text: "If a creditor cancels part of what you owe \u2014 through a negotiated settlement, or sometimes on its own initiative \u2014 it may issue a Form 1099-C for the cancelled amount, and the IRS may treat that amount as ordinary income. People who have put a bad year behind them are routinely surprised by this in the following January. Exclusions exist, insolvency being the common one, but they must be claimed on your return and documented." },
    { kind: "h2", id: "seven-years", text: "Seven years from the first missed payment" },
    { kind: "p", text: "Most adverse information drops off your credit report seven years from the date of first delinquency. Note what that means: the clock started on day thirty of this story, not when the account was charged off, sold, settled or sued on. A collector that reports a later date of first delinquency is re-ageing the debt, which is a violation, and it is worth checking your report for exactly that." },
    { kind: "h2", id: "what-to-do", text: "What to do, in the order that costs least" },
    { kind: "ol", items: [
      "Work out the actual monthly shortfall. Not a feeling \u2014 a number. Income in, essentials out, minimum payments out, and see what is left.",
      "Call each issuer and ask about a hardship programme. Free, quick, and it works more often than people expect.",
      "Get free counselling from an NFCC-accredited nonprofit agency. They will tell you whether a debt management plan at concessionary interest rates would close the gap.",
      "Protect the secured debts. Keep paying the car and the mortgage, whatever else happens. Never put a secured account into a settlement programme.",
      "If you are already being sued, or garnished, see a consumer bankruptcy attorney. Most give a free first consultation. That is the situation bankruptcy is designed for.",
      "Only then look at settlement, and only with the fee percentage in writing and your state\u2019s cap checked."
    ] },
    { kind: "note", tone: "stop", title: "If you are considering stopping payments deliberately", body: [
      "Some people arrive here looking for permission to stop paying because they have read that creditors negotiate once an account is delinquent. That is true, and the price of the leverage is everything described above: years of credit damage, a growing balance, collection contact, a real possibility of being sued, and a possible tax bill. Go into it with your eyes open or do not go into it."
    ] }
  ],
  faqs: [
    {
      q: "What happens if you stop paying your credit card?",
      a: "A late fee and possibly a penalty interest rate apply immediately. At thirty days the delinquency is reported to the credit bureaus. Further delinquency stages are reported each cycle, and at around 180 days the issuer charges the account off and may sell it to a debt buyer. The debt remains owed throughout, interest and fees usually keep accruing, and a creditor can sue at any point within your state\u2019s limitation period."
    },
    {
      q: "How long before a credit card debt is charged off?",
      a: "Typically around 180 days past due. The timing is consistent across issuers because it follows federal banking classification policy rather than individual collections practice."
    },
    {
      q: "Does a charge-off mean the debt is forgiven?",
      a: "No. A charge-off is an accounting entry: the bank books the balance as a loss. You still owe the full amount, and the account may be placed with a collection agency or sold to a debt buyer who will continue to pursue it."
    },
    {
      q: "Can a credit card company sue you for not paying?",
      a: "Yes, at any point while the debt is within your state\u2019s limitation period, which ranges from about three to ten years. If you are served with a complaint, respond before the deadline: most consumer debt judgments are default judgments entered because nobody answered."
    },
    {
      q: "Will my credit recover after I stop paying a credit card?",
      a: "Adverse entries drop off seven years from the date of first delinquency, and their effect on a score diminishes as they age. Recovery begins once no new adverse information is being added, which is why resolving the accounts matters more than the order in which you resolve them."
    },
    {
      q: "Should I make a small payment on an old debt to show good faith?",
      a: "Check your state\u2019s limitation period first. In many states a partial payment or a written acknowledgement restarts the clock on a debt that was no longer suable, which can convert an unenforceable balance into an enforceable one."
    }
  ],
  substantiation: [
    "The 180-day charge-off convention reflects the federal banking agencies\u2019 Uniform Retail Credit Classification and Account Management Policy.",
    "Late fee limits and the conditions for applying a penalty APR to an existing balance derive from the Credit CARD Act of 2009 and Regulation Z.",
    "Collector contact restrictions, the cease-communication right and the thirty-day validation right are from the Fair Debt Collection Practices Act, 15 U.S.C. \xA71692c and \xA71692g.",
    "The seven-year reporting period measured from the date of first delinquency is 15 U.S.C. \xA71681c.",
    "The four states named as not permitting wage garnishment for ordinary consumer debt are Texas, Pennsylvania, North Carolina and South Carolina; narrow exceptions such as child support and taxes apply in each.",
    "Form 1099-C and the insolvency exclusion are described at IRS Topic 431 and in IRC \xA7108. No advice is given on applying either.",
    "The statement that most consumer debt judgments are default judgments is a widely reported characteristic of consumer collection dockets; the page states it as a reason to respond rather than as a statistic."
  ],
  sources: [
    { label: "CFPB: what is a charge-off?", href: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-charge-off-en-1343/" },
    { label: "Fair Debt Collection Practices Act", href: "https://www.law.cornell.edu/uscode/text/15/chapter-41/subchapter-V" },
    { label: "CFPB: debt collection sample letters", href: "https://www.consumerfinance.gov/consumer-tools/debt-collection/" },
    { label: "IRS Topic 431 \u2014 canceled debt", href: "https://www.irs.gov/taxtopics/tc431" }
  ],
  related: [
    "does-debt-settlement-hurt-your-credit",
    "can-creditors-sue-you-during-debt-settlement",
    "how-to-get-out-of-20000-credit-card-debt"
  ]
};
export {
  guide
};
