const DISCLOSURES = {
  advance_fee: {
    key: "advance_fee",
    version: "2026-09-22.1",
    title: "You pay nothing until a debt is settled",
    body: [
      "No fee is charged until all three of these have happened:",
      "1. One of your debts has been settled",
      "2. You have agreed to that settlement",
      "3. You have made a payment on it",
      "The money you deposit each month is yours, held in your own account, and used to fund settlements. It is not a payment to us."
    ],
    acknowledgement: "I understand I pay no fee until a debt is settled and I have paid on it.",
    gate: "ack_advance_fee",
    tsr: "16 CFR 310.4(a)(5)"
  },
  dedicated_account: {
    key: "dedicated_account",
    version: "2026-09-22.1",
    title: "The money stays yours",
    body: [
      "Your dedicated account is opened in your name at an FDIC-insured bank, run by an independent administrator that Debtify does not own and has no financial relationship with.",
      "Who owns the money: you. You can withdraw it at any time. You can leave the program at any time without penalty, and your balance is returned."
    ],
    acknowledgement: "I understand the account is mine, I control it, and I can leave at any time without penalty.",
    gate: "ack_dedicated_account",
    tsr: "16 CFR 310.4(a)(5)(ii)"
  },
  credit_impact: {
    key: "credit_impact",
    version: "2026-09-22.1",
    title: "This will damage your credit score",
    body: [
      "Settlement works by stopping payments and negotiating. That means your accounts go delinquent. Your credit score will fall, and it may take years to recover."
    ],
    // Acknowledged by comprehension check, not a checkbox. See S17c.
    acknowledgement: "",
    gate: "comprehension_credit"
  },
  creditor_contact: {
    key: "creditor_contact",
    version: "2026-09-22.1",
    title: "Creditors can still call you \u2014 and can sue",
    body: [
      "While you are saving toward settlements, your creditors may keep contacting you. Some may file a lawsuit. Being in a program does not stop that.",
      "Interest and late fees usually keep adding up until an account is settled, so the balance can grow before it comes down."
    ],
    acknowledgement: "I understand creditors may keep contacting me, may sue me, and that fees and interest may keep accruing.",
    gate: "ack_creditor_contact"
  },
  tax: {
    key: "tax",
    version: "2026-09-22.1",
    title: "Forgiven debt may be taxable",
    body: [
      "If a creditor writes off part of what you owe, the IRS may treat the forgiven amount as income. You could receive a 1099-C and owe tax on it.",
      "There are exceptions \u2014 insolvency is a common one. We cannot advise you on tax. Talk to a tax professional about your situation."
    ],
    acknowledgement: "I understand forgiven debt may be taxable and that Debtify does not give tax advice.",
    gate: "ack_tax"
  }
};
export {
  DISCLOSURES
};
