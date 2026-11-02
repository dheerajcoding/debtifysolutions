const OPTIONS = [
  {
    id: "as_you_are",
    name: "Keep paying as you are",
    what: "Carry on with the minimum payments, or a little above them, and change nothing structural.",
    cost: "The contractual interest rate on each card, compounding, for as long as a balance remains. On a card near its limit, most of a minimum payment is interest.",
    credit: "No new damage. On-time payments keep reporting as on-time, which is the single largest input to a score.",
    timeline: "Indefinite while only minimums are paid. A minimum payment is calculated to keep the account open, not to retire it.",
    suits: "Anyone whose income covers the minimums with room left over, and anyone whose problem is a temporary gap rather than a structural shortfall.",
    downside: "If the payments genuinely do not fit your income, this is not a plan. It is a slower version of the same arrival.",
    where: "Ask each card issuer about a hardship programme first. Many run one, few advertise it, and it is free."
  },
  {
    id: "counselling",
    name: "Nonprofit credit counselling and a DMP",
    what: "A nonprofit agency reviews your budget and, if a debt management plan fits, consolidates your unsecured payments into one monthly payment it distributes to your creditors at concessionary interest rates.",
    cost: "A set-up fee and a modest monthly administration fee, capped in most states. Counselling itself is normally free. You repay the principal in full.",
    credit: "Accounts enrolled in a DMP are usually closed, which can reduce your available credit and shorten your average account age. Payments are reported as made on time, so there is no delinquency damage.",
    timeline: "Plans are typically structured over three to five years, with the balance repaid in full at a reduced rate.",
    suits: "Most people with credit card debt they can service at a lower interest rate. This is the first thing to try and the cheapest thing to try.",
    downside: "You must be able to afford the consolidated payment every month. Miss payments and the concessions are usually withdrawn. It does not help if the principal itself is beyond your income.",
    where: "An agency accredited by the National Foundation for Credit Counseling (nfcc.org) or the Financial Counseling Association of America."
  },
  {
    id: "consolidation",
    name: "A consolidation loan or balance transfer",
    what: "Borrow once, at a lower rate, and pay the cards off with the proceeds. Same principal, cheaper money, one payment.",
    cost: "The loan\u2019s interest rate plus any origination fee, or the balance transfer fee and the rate that applies when a promotional period ends.",
    credit: "A hard enquiry and a new account at the start. Paid-off revolving balances usually help a score. Nothing is reported late unless you then miss the loan payment.",
    timeline: "The term you sign for, commonly two to five years on an unsecured personal loan.",
    suits: "People whose credit is still good enough to be offered a rate materially below what they are paying now, and whose spending is already under control.",
    downside: "Approval depends on the credit you have left. The rate offered to someone already behind is often no better than the cards. And the cards are now empty, which is how people end up owing twice. Never secure unsecured debt against your home to do this.",
    where: "Your own bank or credit union first. Compare the APR and the origination fee, not the monthly payment."
  },
  {
    id: "settlement",
    name: "Debt settlement",
    what: "Stop paying the enrolled accounts, save into an account in your own name, and have a licensed provider negotiate with each creditor to accept less than the full balance.",
    cost: "A fee charged as a percentage of the debt you enrol, capped by statute in many states, payable only after a debt is settled and you have paid on it. Plus the administrator\u2019s account fee. Plus any tax on debt that is forgiven.",
    credit: "Material damage, by design. Accounts go delinquent, are reported late, are charged off, and are then reported as settled for less than the full balance. The notation outlasts the programme.",
    timeline: "Providers on our panel estimate programme terms in the range of thirty to forty-eight months. Individual accounts settle whenever a creditor is willing, which may be early in the programme or not at all.",
    suits: "People whose unsecured balances are beyond what their income can repay even at a reduced interest rate, who have been turned down for a DMP or cannot afford one, and who have weighed bankruptcy and decided against it for a specific reason.",
    downside: "Creditors are not obliged to negotiate and some never do. Interest and fees accrue while you save. You can be sued. Forgiven balances may be taxable. If you leave early you may have paid fees on accounts that settled and still owe the ones that did not.",
    where: "A provider licensed in your state. Check the licence with your state regulator before you sign anything, including with a provider we match you to."
  },
  {
    id: "bankruptcy",
    name: "Bankruptcy (Chapter 7 or Chapter 13)",
    what: "A federal court process. Chapter 7 discharges qualifying unsecured debts after a liquidation of non-exempt assets; Chapter 13 restructures them into a court-supervised repayment plan.",
    cost: "A court filing fee, a required credit counselling course, and attorney\u2019s fees that are commonly in the low thousands for a straightforward Chapter 7. Fee waivers exist for low incomes.",
    credit: "A Chapter 7 filing is reportable for ten years from the filing date; Chapter 13 for seven. That is longer on the file than a settlement notation, though the recovery often begins sooner because the debts stop being delinquent.",
    timeline: "A typical Chapter 7 runs a few months from filing to discharge. Chapter 13 plans run three or five years.",
    suits: "Anyone facing or already subject to a judgment, garnishment or levy; anyone whose debts are far beyond any repayment they could fund; anyone who needs collection activity to stop now rather than eventually.",
    downside: "It is public, it is on the file for longer, and there are eligibility tests. Some debts do not discharge, including most student loans, recent taxes, child support and alimony.",
    where: "A consumer bankruptcy attorney. Most offer a free initial consultation, and your local legal aid office may provide one at no cost. Talk to one before you enrol in any settlement programme."
  }
];
const AUTOMATIC_STAY_NOTE = "One difference matters more than anything in the table: filing bankruptcy triggers an automatic stay under 11 U.S.C. \xA7362, which legally halts collection calls, lawsuits, garnishments and levies the moment the case is filed. A settlement programme has no equivalent and never will. If what you need is for the pressure to stop, that is a reason to see a bankruptcy attorney, not a reason to enrol here.";
const byOptionId = (id) => OPTIONS.find((o) => o.id === id);
export {
  AUTOMATIC_STAY_NOTE,
  OPTIONS,
  byOptionId
};
