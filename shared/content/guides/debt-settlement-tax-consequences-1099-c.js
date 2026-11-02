import { AUTHORS } from "../people.js";
import { IRS_1099C_URL } from "../../config/constants.js";
const guide = {
  slug: "debt-settlement-tax-consequences-1099-c",
  cluster: "risk",
  targetQuery: "debt settlement tax consequences",
  title: "Debt settlement tax consequences and the 1099-C",
  metaTitle: "Debt Settlement Tax Consequences: The 1099-C, Explained",
  metaDescription: "Forgiven debt can be taxed as ordinary income. What a Form 1099-C is, when a creditor must issue one, how the insolvency exclusion works, and why the bill arrives in January.",
  summary: "The part of debt settlement that catches people out arrives the following January, in an envelope. If a creditor writes off part of what you owe, the IRS may treat the written-off amount as income. This page explains the rule, the main exclusion, and what to keep.",
  author: AUTHORS.dkessler,
  reviewedBy: AUTHORS.rvance,
  publishedISO: "2026-09-02",
  lastReviewedISO: "2026-10-18",
  blocks: [
    { kind: "note", tone: "stop", title: "We cannot advise you on tax", body: [
      "Nothing on this page is tax advice and nobody here is a tax professional. It is an explanation of a rule that applies to a lot of people who settle debts, written so that you know to ask the right question of someone qualified before you sign anything."
    ] },
    { kind: "h2", id: "the-rule", text: "The rule in one paragraph" },
    { kind: "p", text: "If you borrow money you are not taxed on it, because you have to pay it back. If the obligation to pay it back is then cancelled, you have received something of value without giving anything up for it, and the Internal Revenue Code treats that as income. Section 61(a)(11) brings income from the discharge of indebtedness into gross income, and section 108 sets out the exclusions. That is the whole structure: cancelled debt is income unless an exclusion applies." },
    {
      kind: "definition",
      term: "Form 1099-C",
      text: "The information return a creditor files with the IRS, with a copy to you, reporting cancelled debt. A creditor that is an applicable entity must file one where the amount of debt discharged in a year is $600 or more. Box 2 shows the amount discharged, box 3 any interest included in it, box 6 a code for the identifiable event, and box 7 the fair market value of any property."
    },
    { kind: "h2", id: "what-this-looks-like", text: "What this looks like in a settlement" },
    { kind: "p", text: "Suppose an account is settled and the creditor writes off part of the balance. The written-off portion is the amount that may be reported in box 2 of a 1099-C. Note that it is the written-off portion, not the amount you paid, and note that the balance at the point of settlement usually includes interest and late fees that accrued while the account was delinquent \u2014 so it is larger than the balance on the day you enrolled." },
    { kind: "p", text: "If the reported amount is treated as income, it is added to your ordinary income for that year and taxed at your marginal rate. Two consequences follow that people do not anticipate. First, it can push you into a higher bracket or above a threshold for a credit or deduction you were relying on. Second, no tax was withheld from it, so where tax is due the full amount falls due with the return." },
    { kind: "note", tone: "warn", title: "Multiple accounts means multiple forms, in different years", body: [
      "A programme that settles accounts one at a time over several years produces 1099-C forms in several tax years, from several creditors, each with its own amount. Keep every settlement letter and every form, filed by tax year."
    ] },
    { kind: "h2", id: "insolvency", text: "The insolvency exclusion" },
    { kind: "p", text: "Section 108(a)(1)(B) excludes cancelled debt from income to the extent you were insolvent immediately before the discharge. Insolvent here has a specific statutory meaning, not the everyday one: your total liabilities exceeded the fair market value of your total assets at that moment." },
    { kind: "p", text: "The exclusion is limited to the amount of the insolvency. If your liabilities exceeded your assets by less than the amount cancelled, only part of the cancellation is excluded and the remainder is still income. The computation is done as at the moment immediately before each discharge, which in a multi-account programme means a separate computation for each settlement." },
    { kind: "p", text: "Two further points. The exclusion is not automatic: you claim it by filing Form 982 with your return. And the assets side of the computation includes things people forget \u2014 retirement account balances, the value of a vehicle, cash surrender value of life insurance \u2014 which is exactly why the IRS insolvency worksheet exists and why this is a conversation to have with a tax professional rather than a calculation to improvise." },
    { kind: "h2", id: "other-exclusions", text: "Other exclusions and exceptions" },
    {
      kind: "table",
      head: ["Situation", "Treatment", "Authority"],
      rows: [
        [
          "Debt discharged in a bankruptcy case",
          "Excluded from gross income entirely. No insolvency computation needed.",
          "IRC \xA7108(a)(1)(A)"
        ],
        [
          "Insolvent immediately before the discharge",
          "Excluded up to the amount of the insolvency; the excess is income.",
          "IRC \xA7108(a)(1)(B)"
        ],
        [
          "Certain qualified farm indebtedness",
          "Excluded on conditions.",
          "IRC \xA7108(a)(1)(C)"
        ],
        [
          "Qualified real property business indebtedness",
          "Excluded on conditions, for non-corporate taxpayers.",
          "IRC \xA7108(a)(1)(D)"
        ],
        [
          "Qualified principal residence indebtedness",
          "Excluded on conditions; the provision has been amended and extended repeatedly, so check the rule for the year in question.",
          "IRC \xA7108(a)(1)(E), \xA7108(h)"
        ],
        [
          "An amount that was never really income \u2014 for example a disputed balance or a purchase price adjustment",
          "May not be discharge-of-indebtedness income at all. This is an exception rather than an exclusion and the distinction matters on the return.",
          "IRS Publication 4681"
        ]
      ]
    },
    { kind: "h2", id: "if-the-form-is-wrong", text: "If the form is wrong" },
    { kind: "p", text: "Incorrect 1099-C forms are common. The amount can be overstated, the form can be issued for a debt that was not actually cancelled, the date can be wrong, or two forms can be issued for the same debt after it has been sold on. The IRS received a copy, so the right response is never to ignore it." },
    { kind: "ol", items: [
      "Compare box 2 against your settlement letter. The letter is your evidence of what was actually forgiven.",
      "Contact the creditor in writing and ask for a corrected form, quoting the account number and the settlement.",
      "Keep the correspondence. If a corrected form does not arrive before you file, a tax professional can advise on how to report the correct amount and explain the discrepancy.",
      "Do not simply omit it from the return on the basis that it looks wrong. A mismatch with the IRS copy generates a notice."
    ] },
    { kind: "h2", id: "what-to-keep", text: "What to keep, from day one" },
    { kind: "ul", items: [
      "Every settlement letter, showing the original balance, the amount paid and the amount forgiven.",
      "Statements showing the balance on each account at the point of settlement, since accrued interest and fees form part of it.",
      "A record of your assets and liabilities around each settlement date, if insolvency might be relevant. Reconstructing this two years later is painful; recording it at the time is not.",
      "Every Form 1099-C, filed by tax year, including ones you believe are wrong.",
      "The programme agreement and the fee schedule, which a tax professional may want to see."
    ] },
    { kind: "h2", id: "how-this-affects-the-decision", text: "How this should affect your decision" },
    { kind: "p", text: "Tax is one of the reasons the comparison between settlement and bankruptcy is less favourable to settlement than it first looks. Debt discharged in bankruptcy is excluded from income outright, with no insolvency computation, no Form 982 and no argument about the fair market value of a retirement account on a particular date. For someone with large balances and some assets, that difference can be worth more than the entire fee comparison." },
    { kind: "p", text: "It is also a reason to be sceptical of any pitch that talks about what you will no longer owe without mentioning what you may owe the IRS instead. The federal rule is not obscure and anyone operating in this industry knows about it." },
    { kind: "note", tone: "info", title: "Free help exists", body: [
      "IRS Publication 4681 covers cancelled debt and includes the insolvency worksheet. The Volunteer Income Tax Assistance programme offers free return preparation below an income threshold, and the Taxpayer Advocate Service is an independent office inside the IRS that helps with problems you cannot resolve through normal channels. A Low Income Taxpayer Clinic can represent you in a dispute at little or no cost."
    ] }
  ],
  faqs: [
    {
      q: "Is forgiven debt taxable?",
      a: "Often, yes. Cancelled debt is included in gross income under IRC \xA761(a)(11) unless an exclusion in \xA7108 applies. The most commonly relevant exclusions are debt discharged in bankruptcy and debt cancelled while you were insolvent."
    },
    {
      q: "What is a Form 1099-C?",
      a: "An information return a creditor files with the IRS, with a copy to you, reporting cancelled debt. An applicable entity must file one where it discharges $600 or more of debt in a year. Box 2 shows the amount discharged and box 6 gives a code for the event that triggered it."
    },
    {
      q: "How does the insolvency exclusion work?",
      a: "Under IRC \xA7108(a)(1)(B), cancelled debt is excluded from income to the extent your total liabilities exceeded the fair market value of your total assets immediately before the discharge. It is limited to the amount of that insolvency, it must be claimed on Form 982, and the computation is done separately for each discharge."
    },
    {
      q: "Do I pay tax on the amount I paid in the settlement?",
      a: "No. The potentially taxable amount is the part of the balance the creditor wrote off, not the part you paid. Note that the balance at settlement usually includes interest and fees that accrued while the account was delinquent, so it is larger than the balance when you enrolled."
    },
    {
      q: "What if my 1099-C is wrong?",
      a: "Compare it with your settlement letter, write to the creditor asking for a corrected form, and keep the correspondence. Do not leave it off your return without advice: the IRS has a copy, and a mismatch generates a notice."
    },
    {
      q: "Is debt discharged in bankruptcy taxable?",
      a: "No. IRC \xA7108(a)(1)(A) excludes it from gross income entirely, with no insolvency computation required. This is one of the structural advantages bankruptcy has over a private settlement."
    }
  ],
  substantiation: [
    "Inclusion of discharge-of-indebtedness income is IRC \xA761(a)(11); the exclusions are IRC \xA7108(a).",
    "The $600 filing threshold and the applicable-entity requirement for Form 1099-C are in the Instructions for Forms 1099-A and 1099-C.",
    "Box contents described for Form 1099-C follow the current form and its instructions.",
    "The insolvency measurement \u2014 liabilities exceeding the fair market value of assets immediately before the discharge \u2014 and the need to file Form 982 are from IRC \xA7108(a)(3), \xA7108(d)(3) and IRS Publication 4681.",
    "Qualified principal residence indebtedness is flagged as repeatedly amended rather than stated as a current entitlement, because its availability has varied by tax year.",
    "No figures are used, no worked example is given, and no position is taken on whether any exclusion applies to any reader. Doing so would be tax advice we are not qualified or licensed to give."
  ],
  sources: [
    { label: "IRS Topic 431 \u2014 canceled debt: is it taxable or not?", href: IRS_1099C_URL },
    { label: "IRS Publication 4681 \u2014 canceled debts, foreclosures, repossessions and abandonments", href: "https://www.irs.gov/forms-pubs/about-publication-4681" },
    { label: "IRS Form 982 \u2014 reduction of tax attributes due to discharge of indebtedness", href: "https://www.irs.gov/forms-pubs/about-form-982" },
    { label: "IRC \xA7108 \u2014 income from discharge of indebtedness", href: "https://www.law.cornell.edu/uscode/text/26/108" },
    { label: "Taxpayer Advocate Service", href: "https://www.taxpayeradvocate.irs.gov" }
  ],
  related: [
    "debt-settlement-vs-bankruptcy",
    "does-debt-settlement-hurt-your-credit",
    "how-to-get-out-of-20000-credit-card-debt"
  ]
};
export {
  guide
};
