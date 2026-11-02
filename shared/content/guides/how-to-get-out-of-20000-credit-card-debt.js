import { AUTHORS } from "../people.js";
const guide = {
  slug: "how-to-get-out-of-20000-credit-card-debt",
  cluster: "amount",
  targetQuery: "how to get out of $20,000 debt",
  title: "How to deal with $20,000 of credit card debt",
  metaTitle: "How To Get Out Of $20,000 Of Credit Card Debt: The Real Arithmetic",
  metaDescription: "What $20,000 at a typical card APR actually costs at different monthly payments, and an honest run through every route: hardship plans, a DMP, consolidation, settlement and bankruptcy.",
  summary: "Twenty thousand dollars is the amount at which the arithmetic starts to decide things for you. This page works through what it actually costs at different monthly payments, and then through each route in the order that costs you least.",
  author: AUTHORS.dkessler,
  reviewedBy: AUTHORS.rvance,
  publishedISO: "2026-09-11",
  lastReviewedISO: "2026-10-18",
  blocks: [
    { kind: "p", text: "Start with the arithmetic, because almost every piece of advice about this amount skips it and the arithmetic is the part that is not a matter of opinion. The table below is ordinary amortisation on a $20,000 balance at an annual rate of 24.99%, which is in the range of ordinary purchase APRs on US cards at the time of writing. It assumes you add nothing new to the balance and the rate does not change." },
    {
      kind: "table",
      caption: "$20,000 at 24.99% APR, fixed monthly payment, no new spending. Arithmetic, rounded \u2014 not a projection of anything we would do for you.",
      head: ["Monthly payment", "Months to clear", "Total interest paid", "Total paid"],
      rows: [
        ["$420", "About 232 \u2014 over 19 years", "About $77,600", "About $97,600"],
        ["$450", "About 126 \u2014 over 10 years", "About $36,700", "About $56,700"],
        ["$500", "About 87 \u2014 just over 7 years", "About $23,500", "About $43,500"],
        ["$600", "About 58 \u2014 just under 5 years", "About $14,800", "About $34,800"],
        ["$750", "About 40 \u2014 under 3.5 years", "About $9,500", "About $29,500"]
      ]
    },
    { kind: "p", text: "Three things fall out of that table. The interest on this balance is about $417 in the first month alone, so any payment near that figure is almost entirely interest and the balance barely moves. The difference between $450 a month and $600 a month is not 33% \u2014 it is about five and a half years and some $22,000. And a typical minimum payment, calculated as roughly 1% of the balance plus interest, falls as the balance falls, which is why paying the minimum on this amount stretches the term out over decades rather than years." },
    { kind: "note", tone: "info", title: "Do this before anything else", body: [
      "Work out the real number: income in, essential costs out, minimum payments out. What is left is your actual capacity, and every route below is chosen against it. If the figure is comfortably above $600 a month, your problem is the interest rate and not the principal, and the cheap options will work. If it is near zero, no repayment plan will hold and you should be reading about bankruptcy rather than about settlement."
    ] },
    { kind: "h2", id: "step-1-rate", text: "Step one: attack the rate, not the balance" },
    { kind: "p", text: "At $20,000 the interest is doing more damage than the principal. The cheapest interventions available to you are the ones that reduce the rate, and two of them cost nothing to try." },
    { kind: "ul", items: [
      "Call each issuer and ask for a rate reduction. Say how long you have held the card and that you are considering moving the balance. It is a five-minute call with an asymmetric payoff.",
      "Ask each issuer, by name, what hardship programme they run. A temporary rate reduction, a reduced payment, or a fixed-payment workout that closes the account and amortises it over several years. These exist at most large issuers, cost nothing, and do not create delinquency damage.",
      "Check whether a credit union will take the balance. Credit unions are capped on the rate they can charge on most loans and are frequently cheaper than a bank on an unsecured personal loan.",
      "If your credit is still good, price a balance transfer honestly: the transfer fee plus the rate that applies when the promotional period ends, against what you are paying now. And only do it if you can commit to a payment that clears most of it inside the promotional window."
    ] },
    { kind: "h2", id: "step-2-order", text: "Step two: pick a payoff order and stop changing it" },
    { kind: "p", text: "If you have capacity and a workable rate, the remaining question is the order. Highest rate first costs less in interest. Smallest balance first produces a cleared account sooner, which some people need in order to keep going. The difference in total interest between the two is usually small relative to the difference between sticking with a plan and abandoning one, so choose the one you will actually maintain and then leave it alone." },
    { kind: "h2", id: "step-3-counselling", text: "Step three: nonprofit credit counselling" },
    { kind: "p", text: "This is the most underused option at this balance and it should be tried before anything on the rest of this page. An agency accredited by the NFCC will review your budget at no charge and tell you whether a debt management plan fits. In a plan, your unsecured payments are consolidated into one monthly payment that the agency distributes to your creditors at concessionary interest rates negotiated between the agency and the card issuers." },
    { kind: "p", text: "The important features: you repay the principal in full, the fees are modest and capped in most states, the plans are generally structured over three to five years, and crucially your payments are reported as made on time, so there is no delinquency damage. Enrolled accounts are usually closed, which reduces your available credit, and you have to be able to afford the consolidated payment every month. That is the whole catch." },
    { kind: "h2", id: "step-4-consolidation", text: "Step four: a consolidation loan, with two warnings" },
    { kind: "p", text: "Borrowing once at a lower rate to clear the cards is sound in principle at this balance, and it converts a revolving obligation with no end date into an instalment loan with one. Compare the APR and the origination fee, never the monthly payment, which can be made to look attractive simply by lengthening the term." },
    { kind: "note", tone: "warn", title: "Two ways this goes wrong", body: [
      "The cards are now empty, and a meaningful number of people fill them again and end up owing $40,000 instead of $20,000. If the spending that created the balance has not changed, a consolidation loan makes the problem bigger rather than smaller.",
      "Never secure unsecured debt against your home to do this. A home equity loan or a cash-out refinance converts a debt that can at worst be settled or discharged into a debt that can cost you the house. The lower rate is not worth that trade."
    ] },
    { kind: "h2", id: "step-5-settlement", text: "Step five: settlement, and what it actually costs" },
    { kind: "p", text: "If the counselling agency has told you a plan will not fit, no lender will refinance you at a sensible rate, and the arithmetic at the top of this page is simply beyond your income, then settlement enters the picture. $20,000 is above the enrolment minimum of every provider on our panel, so at this balance the question is not whether you could enrol but whether you should." },
    { kind: "p", text: "What it costs is knowable and you should insist on it in writing before you sign anything. The provider\u2019s fee is a percentage of the debt you enrol \u2014 not of anything the negotiation achieves \u2014 and several states cap that percentage, with the cap overriding the provider\u2019s own rate. On top of that sits the administrator\u2019s monthly account fee. On top of that sits any tax on forgiven amounts." },
    { kind: "p", text: "What it costs you besides money is the whole of the rest of this site: your credit file is damaged by design, interest and fees keep accruing on the enrolled accounts until each one is resolved, your creditors can keep calling, and any of them can sue you while you are still saving. No part of that is prevented by being enrolled." },
    { kind: "h2", id: "step-6-bankruptcy", text: "Step six: bankruptcy, which is not the last resort" },
    { kind: "p", text: "Bankruptcy is listed last here because it is the biggest step, not because it is the worst option. At $20,000 of unsecured debt with a low income, Chapter 7 is frequently the cheapest and fastest route available, and the comparison with settlement is not close on three specific points: the automatic stay stops collection and litigation the day the case is filed, the discharge is a court order rather than a negotiation that may not happen, and discharged debt is excluded from taxable income outright." },
    { kind: "p", text: "If you are already being sued, if your wages are being garnished, or if your income would not support any of the repayment routes above, get the free consultation from a consumer bankruptcy attorney before you commit to anything else. An hour of a lawyer\u2019s time at the start is the best-value thing in this entire article." },
    { kind: "h2", id: "what-to-ignore", text: "What to ignore at this balance" },
    { kind: "ul", items: [
      "Anyone who guarantees a result. Nobody can, and in this industry guaranteeing one is a regulatory problem for the person doing it.",
      "Anyone who asks for a fee before a debt has been settled and paid on. Charging an advance fee for debt relief services is prohibited by the FTC Telemarketing Sales Rule.",
      "Credit repair offers that promise to remove accurate information. Accurate adverse information cannot be removed before it ages off, and the Credit Repair Organizations Act bans advance fees for these services too.",
      "A 401(k) loan or hardship withdrawal, except as a genuinely last option. You lose the compounding, you may owe tax and a penalty, and in most states the balance would have been protected in bankruptcy anyway.",
      "Borrowing from family without writing it down. It damages something you cannot refinance."
    ] },
    { kind: "h2", id: "the-order", text: "The whole thing, in order" },
    { kind: "ol", items: [
      "Calculate your real monthly capacity.",
      "Call every issuer: ask for a rate reduction, then ask about the hardship programme by name.",
      "Get free counselling from an NFCC-accredited agency and find out whether a debt management plan fits.",
      "Price a credit union loan or a balance transfer if your credit still supports one, comparing APR plus fees.",
      "Get a free consultation with a consumer bankruptcy attorney, specifically asking whether you pass the means test and what you would lose.",
      "Only then compare a settlement programme, with the fee percentage in writing and your state\u2019s cap checked against it."
    ] },
    { kind: "p", text: "If you work through that list and stop at step three, you have had a better outcome than anything we could have sold you. That is the intended result of publishing it." }
  ],
  faqs: [
    {
      q: "How long does it take to pay off $20,000 in credit card debt?",
      a: "On ordinary amortisation at 24.99% APR with no new spending: about 7 years at $500 a month, just under 5 years at $600 and about 40 months at $750. At a payment close to the monthly interest of roughly $417 the balance barely moves and the term runs into decades. These are arithmetic, not predictions about any programme."
    },
    {
      q: "What is the cheapest way to deal with $20,000 of credit card debt?",
      a: "Usually the rate rather than the principal. Ask each issuer for a rate reduction and about their hardship programme, both free, then get free counselling from an NFCC-accredited nonprofit about a debt management plan. Those options cost least and create no delinquency damage."
    },
    {
      q: "Is $20,000 enough debt for a settlement program?",
      a: "It is above the enrolment minimum of every provider on our panel, so eligibility is not the constraint. Whether it is appropriate depends on whether a debt management plan has been ruled out, whether any lender will refinance you, and whether you have considered bankruptcy and have a concrete reason against it."
    },
    {
      q: "Should I use a 401(k) loan to pay off credit card debt?",
      a: "Treat it as a last option. You lose the compounding on the money withdrawn, a withdrawal may trigger tax and an early distribution penalty, and retirement funds are protected in bankruptcy in most circumstances \u2014 so you may be spending a protected asset on a debt that was dischargeable."
    },
    {
      q: "Should I pay the highest interest card first or the smallest balance first?",
      a: "Highest rate first costs less in interest. Smallest balance first clears an account sooner, which helps some people stay with the plan. The difference between the two is usually smaller than the difference between finishing a plan and abandoning one."
    },
    {
      q: "Can a company charge me a fee up front to settle my debts?",
      a: "No. The FTC Telemarketing Sales Rule prohibits charging a fee for debt relief services before a debt has been settled, you have agreed to the settlement, and you have made a payment on it. A request for an advance fee is a reason to walk away."
    }
  ],
  substantiation: [
    "All figures in the arithmetic table are ordinary amortisation on a $20,000 balance at a 24.99% nominal annual rate compounded monthly, with a fixed payment and no further advances. The assumptions are stated on the table and the figures are rounded.",
    "The 24.99% rate is described as being in the range of ordinary US card purchase APRs at the time of writing, and the page is dated and carries a review date so the assumption can be checked.",
    "The first-month interest figure of about $417 is 24.99% / 12 applied to $20,000.",
    "The description of minimum payments as roughly 1% of the balance plus interest is the common issuer formula; the page states the consequence qualitatively rather than giving a term in years, because the formula varies by issuer.",
    "Provider enrolment minimums referenced are those recorded in config/providers.ts, the lowest of which is below $20,000.",
    "The advance fee prohibition is 16 CFR 310.4(a)(5) under the FTC Telemarketing Sales Rule. The credit repair advance fee prohibition is the Credit Repair Organizations Act, 15 U.S.C. \xA71679b(b).",
    "The arithmetic describes the cost of the status quo. Nothing on this page quantifies, estimates or implies a result from any debt relief option, including ours."
  ],
  sources: [
    { label: "CFPB: debt management plans and credit counselling", href: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-management-plan-en-1449/" },
    { label: "National Foundation for Credit Counseling", href: "https://www.nfcc.org" },
    { label: "FTC: settling credit card debt", href: "https://consumer.ftc.gov/articles/settling-credit-card-debt" },
    { label: "US Courts: bankruptcy basics", href: "https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics" }
  ],
  related: [
    "what-happens-if-you-stop-paying-your-credit-card",
    "debt-settlement-vs-bankruptcy",
    "does-debt-settlement-hurt-your-credit"
  ]
};
export {
  guide
};
