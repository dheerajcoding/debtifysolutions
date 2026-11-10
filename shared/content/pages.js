import { BRAND } from "../config/brand.js";
import { GARNISHMENT_LABEL } from "./states.js";
const HOW_PHASES = [
  {
    n: 1,
    name: "The instant read",
    minutes: "About 40 seconds",
    body: [
      "Four questions: roughly what you owe, which state you live in, whether the accounts are current or behind, and then a read of what that combination means. No name, no email, no phone number. Nothing at this stage identifies you.",
      "The state question is not a formality. Programmes are provided by licensed partners, and a partner can only contract with residents of states it is licensed in. If no partner on our panel is licensed where you live, this phase ends the process and tells you so."
    ],
    points: [
      "No personal data is collected in this phase at all.",
      "The fee percentage shown later is capped by your state, and the cap overrides the provider\u2019s own rate where it is lower.",
      "If your balances are below every partner\u2019s minimum, you are told here rather than after you have handed over a Social Security number."
    ],
    exit: "Closed state, or balances below the programme minimum: the process ends and you are pointed to nonprofit credit counselling, legal aid and your state regulator."
  },
  {
    n: 2,
    name: "Identity",
    minutes: "About 60 seconds",
    body: [
      "Name, date of birth, a mobile number verified by a one-time code, your address, and a Social Security number. This is the first phase that collects anything about you, and it exists because the next phase pulls your credit file and a credit bureau will not match a file without it.",
      "You must be 18. Under 18 is a hard stop and nothing is retained."
    ],
    points: [
      "The one-time code to your mobile is verification, not marketing. There is no number you can call for a sales conversation and nobody will call you.",
      "Every field tells you why it is being asked before you fill it in.",
      "This is the point at which abandoning costs you nothing. Several thousand people a month get this far and stop, and that is a legitimate outcome."
    ]
  },
  {
    n: 3,
    name: "Consent",
    minutes: "About 30 seconds",
    body: [
      "A single screen, and the one most sites hide. You are asked separately for permission to pull your credit report and to share your file with the provider you are matched to. Nothing is pre-ticked. The optional contact consent is genuinely optional and declining it does not stop you progressing.",
      "What you agreed to, which version of the words you were shown, and the date are recorded against a hash of the published partner list. That record is how it can later be proved exactly which companies you did and did not agree could contact you."
    ],
    points: [
      "No consent is pre-checked, ever. A compliance test in the repository asserts it.",
      "An optional consent never gates progress. Another test asserts that too.",
      "A soft credit enquiry for the file pull does not itself affect your score."
    ]
  },
  {
    n: 4,
    name: "Your actual debts",
    minutes: "About 80 seconds",
    body: [
      "Your credit file is pulled and your accounts are shown back to you. You confirm the ones that are real, add anything the bureaus missed, and then the system removes what cannot go into a programme.",
      'That exclusion step is not advisory. A car loan is secured against the car and a federal student loan has government relief routes that are usually better than settlement, so neither can be enrolled, whatever you would prefer. Each exclusion gives you the reason in fixed wording rather than a free-text note, because "I thought my car loan was covered" is how people lose cars.',
      "Then affordability: your income, your essential costs, and what is genuinely left each month. You can connect your bank to verify income, or skip it. The skip button is the same size as the continue button."
    ],
    points: [
      "Secured debt, federal student loans and accounts your matched provider does not accept are removed by the system.",
      "Income verification is optional and skipping it is presented as an equal choice, not a lesser one.",
      "If what is left each month is below the provider\u2019s floor, the file is declined rather than squeezed into a plan you cannot fund."
    ],
    exit: "Nothing enrollable left, or not enough monthly room: declined, with the alternatives."
  },
  {
    n: 5,
    name: "The plan, the five disclosures, and the alternatives",
    minutes: "About 70 seconds",
    body: [
      "You are matched to a licensed provider and shown the plan: which accounts are enrolled, the monthly deposit, the estimated term the provider records for a file like yours, and the fee as a percentage of enrolled debt after your state\u2019s cap has been applied.",
      "Then five screens you cannot click past. You pay nothing until a debt is settled and you have paid on it. The money stays yours in your own account and you can leave without penalty. This will damage your credit score. Creditors can still call you and can sue you, and interest keeps accruing. Forgiven debt may be taxable.",
      "The credit damage screen is not a checkbox. It is a comprehension check: you have to demonstrate you understood it. Two failed attempts does not loop until you guess right \u2014 it routes you out of the programme to the alternatives.",
      "Last in the phase, before anything is signed, the alternatives: nonprofit credit counselling, a consolidation loan, bankruptcy, and carrying on as you are. The referrals are real referrals and you can leave through any of them."
    ],
    points: [
      "Every figure shown is computed from the provider and your state cap. No percentage is written into a template.",
      "The fee is a percentage of enrolled debt, not of anything a negotiation achieves.",
      "Two failed comprehension attempts routes you out. It is a filter, not a hurdle.",
      "The alternatives screen appears before signature, not after."
    ],
    exit: "Declined at underwriting, or two failed comprehension attempts, or you choose an alternative: the destination is recorded and you are sent there."
  },
  {
    n: 6,
    name: "Signing, the account, and a recorded verification call",
    minutes: "About 60 seconds, plus the call",
    body: [
      "The agreement is between you and the provider. " + BRAND.legalName + " is not a party to it and does not appear on it as a counterparty. The documents are the provider\u2019s own templates in your state\u2019s variant, presented unaltered.",
      "Then your dedicated account: opened in your name at an FDIC-insured bank and run by an independent administrator that we do not own and have no financial relationship with. You authorise the monthly transfer. The money in it is yours, you can withdraw it, and you can leave the programme at any time without a penalty.",
      "And then the one phone call in the entire process: a recorded verification call with the provider, after you have signed. A person reads a change-controlled script and confirms you understood the fee, the credit consequences, the lawsuit risk and the tax position. It is not a sales call and nothing can be sold to you on it \u2014 you have already signed. It exists so that there is a recording of you confirming what you agreed to, which protects you considerably more than it protects us."
    ],
    points: [
      "The provider is the counterparty. Always, on every document.",
      "The administrator is independent of us and of the provider.",
      "The verification call is recorded, scripted and change-controlled.",
      "If you do not pass verification, you are not enrolled."
    ],
    exit: "Verification not passed: not enrolled, and your deposit authorisation does not take effect."
  }
];
const HOW_FAQS = [
  {
    q: "How long does the debt settlement enrollment process take?",
    a: "The self-serve part takes about four minutes across six phases. The only thing that happens outside the flow is a recorded verification call with the provider after you have signed, which is scheduled at a time you pick."
  },
  {
    q: "Will someone call me to sell me a program?",
    a: "No. There is no sales call and no sales team. The single phone call in the process is a recorded compliance verification with the provider, and it happens after you have already signed, so there is nothing left to sell you."
  },
  {
    q: "What happens if I stop partway through?",
    a: "Nothing. You are not enrolled in anything and no fee has arisen. If you stopped before the identity phase, we hold nothing that identifies you at all."
  },
  {
    q: "Can I be declined?",
    a: "Yes, at several points: if no partner is licensed in your state, if your balances are below every partner\u2019s minimum or above its maximum, if nothing you owe can be enrolled once secured and federal student debt is removed, if your monthly room is below the provider\u2019s floor, or if you do not pass the comprehension check on credit damage."
  },
  {
    q: "Who holds my money during the program?",
    a: "You do. The dedicated account is opened in your name at an FDIC-insured bank and administered by an independent third party that Debtify does not own and has no financial relationship with. You can withdraw the balance and leave at any time without a penalty."
  },
  {
    q: "Who am I actually contracting with?",
    a: "A licensed partner provider, which is the counterparty on every document. Debtify is a technology platform and is not a party to your agreement."
  }
];
const ALT_FAQS = [
  {
    q: "What are the alternatives to debt settlement?",
    a: "Five options are worth comparing: carrying on as you are with a hardship programme from your card issuer, nonprofit credit counselling and a debt management plan, a consolidation loan or balance transfer, debt settlement, and bankruptcy under Chapter 7 or Chapter 13. For most people with credit card debt, counselling and a DMP should be tried first because it is the cheapest and does no delinquency damage."
  },
  {
    q: "Which debt relief option is cheapest?",
    a: "Asking your card issuers for a rate reduction or a hardship programme costs nothing. Nonprofit credit counselling is normally free and a debt management plan carries a modest, often state-capped monthly fee while you repay the principal in full. Those are the cheapest routes and they come before settlement in any honest ordering."
  },
  {
    q: "Is a debt management plan better than debt settlement?",
    a: "For most people, yes. A DMP repays the principal at concessionary interest rates with payments reported as made on time, so there is no delinquency damage to your credit. Settlement works by letting accounts go unpaid and accepts the credit damage, the lawsuit risk and the possible tax consequences in exchange for negotiating less than the full balance. The DMP is the cheaper instrument where you can afford it."
  },
  {
    q: "When is bankruptcy the better option?",
    a: "When you have been sued, when your wages are being garnished or your bank account levied, when the balances are far beyond any repayment you could fund, or when you need collection activity to stop now. Filing triggers an automatic stay under 11 U.S.C. \xA7362 that halts collection immediately, and discharged debt is excluded from taxable income. A settlement programme does neither."
  },
  {
    q: "Will a debt consolidation loan hurt my credit?",
    a: "A new loan means a hard enquiry and a new account, which has a small short-term effect. Paying revolving card balances down to zero usually helps a score. The real risks are different: approval depends on the credit you have left, and the cards are now empty, which is how some people end up owing twice as much."
  },
  {
    q: "Do you get paid if I choose one of these alternatives?",
    a: "No. Nothing on this page is a paid referral and we are not compensated by any organisation named on it. If you leave through one of these routes we earn nothing."
  }
];
const STATES_FAQS = [
  {
    q: "Is debt settlement available in every state?",
    a: "No. A program can only be offered to you by a provider licensed or registered in the state you live in, and several states restrict the activity so tightly that few or no for-profit providers operate there. Our state pages say plainly which states have no partner on our panel, and in those states we do not collect your details."
  },
  {
    q: "Why do debt settlement fees differ by state?",
    a: "Because many states cap what a debt adjuster may charge as a share of enrolled debt, and where a cap applies it overrides the provider\u2019s own rate. The fee you would pay is therefore the lower of the provider\u2019s rate and your state\u2019s cap, computed rather than quoted from a template."
  },
  {
    q: "How long can a creditor sue me for an old credit card debt?",
    a: "It depends on your state\u2019s limitation period, which ranges from roughly three to ten years. Which statutory clock applies to a card balance is itself contested in several states, and in most places a partial payment or a written acknowledgement can restart it. Check your state page and get advice before paying anything on an old account."
  },
  {
    q: "Can my wages be garnished for credit card debt?",
    a: "In most states, yes, once a creditor has a judgment. Texas, Pennsylvania, North Carolina and South Carolina do not permit wage garnishment for ordinary consumer debt, with narrow exceptions such as child support and taxes. Many other states cap garnishment more tightly than federal law does."
  }
];
function feeCapLabel(profile) {
  return profile.feeCap == null ? "No statutory cap recorded" : `${Math.round(profile.feeCap * 100)}% of enrolled debt`;
}
function buildStateFaqs(p) {
  const { name, facts, open } = p;
  const faqs = [
    {
      q: `Is debt settlement available in ${name}?`,
      a: open ? `Yes. ${p.providers.length === 1 ? "One provider" : `${p.providers.length} providers`} on our panel ${p.providers.length === 1 ? "holds" : "hold"} the licence or registration required to contract with a ${name} resident. The fee is capped at ${feeCapLabel(p).toLowerCase()} where the state cap is lower than the provider's own rate.` : `Not through us. No provider on our panel is licensed or registered to offer a program to a ${name} resident, so there is nothing for us to show you and we do not collect your details here. Nonprofit credit counselling, legal aid and bankruptcy counsel all serve ${name} residents.`
    },
    {
      q: `What is the maximum debt settlement fee in ${name}?`,
      a: p.feeCap == null ? `No statutory cap is recorded for ${name} in our matrix. Where there is no cap, the provider's own rate applies, and you should see it in writing before you sign anything. Our fee matrix is pending review by US regulatory counsel.` : `Our matrix records a cap of ${Math.round(p.feeCap * 100)}% of enrolled debt for ${name}. Where a cap applies it overrides the provider's own rate, so the fee you would pay is the lower of the two. The matrix is pending review by US regulatory counsel.`
    },
    {
      q: `How long can a creditor sue me for credit card debt in ${name}?`,
      a: `The limitation period commonly applied to an unpaid credit card account in ${name} is about ${facts.solYears} years. ${facts.solNote ?? ""} Which clock applies depends on facts specific to your account, and in many states a partial payment restarts it, so take advice before paying anything on an old ` + `balance.`.replace(/\s+/g, " ").trim()
    },
    {
      q: `Can my wages be garnished for credit card debt in ${name}?`,
      a: `${GARNISHMENT_LABEL[facts.wageGarnishment]}. ${facts.garnishmentNote} A judgment can also reach bank accounts and attach to property, so the absence of wage garnishment does not mean a judgment is harmless.`
    },
    {
      q: `Who regulates debt settlement companies in ${name}?`,
      a: `${facts.regulator}. Check any provider's licence or registration with them before you sign anything, including a provider we match you to. You can also complain to them, and to the Consumer Financial Protection Bureau.`
    }
  ];
  return faqs;
}
const HOME_FAQS = [
  {
    q: "What does Debtify do?",
    a: "Debtify is a technology platform. You work through a self-serve check that takes about four minutes, it shows you every downside of a settlement program before you commit to anything, and where a licensed partner provider serves your state it matches you to one. The program itself is provided by that partner, who contracts with you directly."
  },
  {
    q: "Is there a sales call?",
    a: "No. There is no sales conversation at any point and no phone number to call for one. If you reach the end of the flow and decide to enrol, there is a single recorded verification call with the provider, which is a compliance requirement rather than a sales step."
  },
  {
    q: "What does it cost to use the check?",
    a: "Nothing, and no fee is charged at any point in it. A provider fee only ever arises later, after a debt has actually been settled, you have agreed to that settlement and you have made a payment on it. That sequence is required by federal rule."
  },
  {
    q: "Will you tell me if settlement is the wrong option for me?",
    a: "Yes, and the flow is built to. It compares the alternatives before you sign, it ends the process if your answers show that a nonprofit debt management plan or bankruptcy would serve you better, and it will not let you enrol a secured debt such as a car loan."
  },
  {
    q: "What happens if no provider is licensed in my state?",
    a: "We tell you so and stop, rather than taking your details. Our state pages say plainly which states have no partner on our panel and point to nonprofit counselling, legal aid and the state regulator instead."
  }
];
const PAGE_META = { home: {
  title: "Debt settlement, with the downsides first",
  description: "Check your debt settlement options online in about 5 minutes. Soft credit check, costs and risks shown up front, and no obligation. English y Español.",
  alternates: { canonical: "/" }
}, how: {
  title: "How the debt settlement enrollment process works",
  description: "The six phases of a self-serve debt settlement enrollment, honestly described: the instant read, identity, consent, your real debts, the plan and five disclosures, and the recorded verification call at the end.",
  alternates: { canonical: "/how-it-works" }
}, alternatives: {
  title: "Debt relief options compared: counselling, consolidation, settlement, bankruptcy",
  description: "An honest side-by-side of credit counselling and a DMP, a consolidation loan, debt settlement, bankruptcy and carrying on as you are \u2014 on cost, credit impact, timeline and who each one suits.",
  alternates: { canonical: "/alternatives" }
}, states: {
  title: "Debt settlement by state: availability, fee caps and the rules where you live",
  description: "All 51 US jurisdictions: whether a licensed partner program is available, the statutory fee cap where one exists, the limitation period on an unpaid credit card and what a judgment can reach in your state.",
  alternates: { canonical: "/states" }
}, guides: {
  title: "Guides to credit card debt, settlement and your alternatives",
  description: "Plain guides to what happens when you stop paying a credit card, what debt settlement does to your credit, whether creditors can sue you, the 1099-C, and how settlement compares with bankruptcy.",
  alternates: { canonical: "/guides" }
}, disclosures: {
  title: "Disclosures",
  description: "The five disclosures shown inside the enrollment flow, rendered here from the same configuration file so the public page and the in-flow screens cannot say different things.",
  alternates: { canonical: "/legal/disclosures" }
} };
export {
  ALT_FAQS,
  HOME_FAQS,
  HOW_FAQS,
  HOW_PHASES,
  PAGE_META,
  STATES_FAQS,
  buildStateFaqs,
  feeCapLabel
};
