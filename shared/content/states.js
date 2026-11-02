import { US_STATES, CLOSED_STATES, PROVIDERS, STATE_FEE_CAPS, effectiveFeePct } from "../config/providers.js";
const FACTS = [
  {
    code: "AL",
    solYears: 3,
    wageGarnishment: "federal",
    garnishmentNote: "Alabama follows the federal ceiling on wage garnishment and adds a modest state exemption a debtor must claim.",
    regulator: "Alabama Attorney General, Consumer Interest Division",
    court: "district court for smaller claims, circuit court above the district limit",
    context: "Alabama has one of the shorter limitation periods in the country, so an account that went quiet years ago may no longer be suable even though it is still owed and still reportable."
  },
  {
    code: "AK",
    solYears: 3,
    wageGarnishment: "stricter",
    garnishmentNote: "Alaska protects a weekly amount of take-home pay outright before any garnishment can attach, which is more protective than the federal floor.",
    regulator: "Alaska Division of Banking and Securities",
    court: "superior court, with a small claims division for lower amounts",
    context: "Distance matters here in a way it does not elsewhere: a provider that cannot service an Alaskan time zone is a provider you will struggle to reach.",
    closedNote: "Alaska licenses the business of debt adjusting through the Division of Banking and Securities, and no provider on our panel holds that licence."
  },
  {
    code: "AZ",
    solYears: 6,
    solNote: "Arizona generally applies a six-year period to debt founded on a written contract, which is how most card agreements are treated.",
    wageGarnishment: "stricter",
    garnishmentNote: "Arizona law was amended to protect a larger share of disposable earnings than the federal floor, and a debtor can apply to the court to reduce the amount further on hardship grounds.",
    regulator: "Arizona Department of Insurance and Financial Institutions",
    court: "justice court for claims within its limit, superior court above it",
    context: "Arizona\u2019s homestead exemption is substantial, which changes the bankruptcy calculation for a homeowner here compared with a neighbouring state."
  },
  {
    code: "AR",
    solYears: 5,
    wageGarnishment: "federal",
    garnishmentNote: "Arkansas follows the federal ceiling, with a small personal property exemption a debtor must schedule and claim.",
    regulator: "Arkansas Attorney General, Public Protection Department",
    court: "district court for smaller claims, circuit court above that",
    context: "Arkansas\u2019s constitutional interest rate cap has shaped which lenders operate here, so residents are more likely to be dealing with national card issuers than with local instalment lenders.",
    closedNote: "Arkansas regulates debt adjusting narrowly and no provider on our panel is authorised to contract with Arkansas residents."
  },
  {
    code: "CA",
    solYears: 4,
    wageGarnishment: "stricter",
    garnishmentNote: "California caps garnishment by reference to the local minimum wage, which in most of the state protects more of a low earner\u2019s pay than the federal formula does.",
    regulator: "California Department of Financial Protection and Innovation (DFPI)",
    court: "limited civil for claims up to the statutory threshold, small claims below that",
    context: "California requires a debt collector to register with the DFPI under the Debt Collection Licensing Act, so a resident can and should look up anyone contacting them about a balance.",
    closedNote: "California is the single largest consumer market in the country and also one of the most tightly supervised. No provider on our panel is authorised to offer a settlement programme to a California resident, and we will not take your details to put you on a waiting list."
  },
  {
    code: "CO",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Colorado protects a greater share of disposable earnings than the federal floor following its 2022 amendment.",
    regulator: "Colorado Attorney General, Administrator of the Uniform Consumer Credit Code",
    court: "county court for claims within its limit, district court above it",
    context: "Colorado administers debt management services under its own statute and publishes a register of authorised providers, which is the first thing to check before signing anything."
  },
  {
    code: "CT",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Connecticut limits wage execution to a smaller share of disposable earnings than the federal ceiling permits.",
    regulator: "Connecticut Department of Banking",
    court: "superior court, with a small claims session for lower amounts",
    context: "Connecticut operates a licensing regime for debt negotiation and requires a bond, which is why the number of providers active here is small.",
    closedNote: "Connecticut licenses debt negotiation through the Department of Banking and conditions it on bonding and examination. No provider on our panel is licensed here."
  },
  {
    code: "DE",
    solYears: 3,
    wageGarnishment: "stricter",
    garnishmentNote: "Delaware limits attachment of wages to a share of earnings below the federal ceiling.",
    regulator: "Delaware Office of the State Bank Commissioner",
    court: "Court of Common Pleas or Justice of the Peace Court depending on the amount",
    context: "Delaware\u2019s short limitation period means a resident served with a suit on an old card balance should check the date of last activity before anything else.",
    closedNote: "Delaware requires licensing for debt management and settlement services through the State Bank Commissioner, and no provider on our panel holds it."
  },
  {
    code: "DC",
    solYears: 3,
    wageGarnishment: "stricter",
    garnishmentNote: "The District protects a higher floor of weekly earnings from garnishment than federal law requires.",
    regulator: "DC Department of Insurance, Securities and Banking",
    court: "Superior Court of the District of Columbia, Civil Division small claims branch for lower amounts",
    context: "The District\u2019s Consumer Protection Procedures Act gives residents a private right of action with statutory damages, which makes it a hostile venue for a provider that oversells.",
    closedNote: "The District regulates debt settlement providers directly and no provider on our panel is authorised here."
  },
  {
    code: "FL",
    solYears: 5,
    wageGarnishment: "stricter",
    garnishmentNote: "Florida\u2019s head-of-family exemption can protect wages from garnishment entirely below an income threshold, and must be claimed in writing.",
    regulator: "Florida Office of Financial Regulation",
    court: "county court for most card claims, circuit court above the county limit",
    context: "Florida\u2019s homestead protection is among the strongest in the country, which materially changes what a judgment creditor can actually reach from a homeowner here."
  },
  {
    code: "GA",
    solYears: 6,
    wageGarnishment: "federal",
    garnishmentNote: "Georgia follows the federal ceiling on continuing wage garnishment.",
    regulator: "Georgia Department of Law, Consumer Protection Division",
    court: "magistrate court for smaller claims, state or superior court above that",
    context: "Georgia\u2019s Debt Adjustment Act caps what a debt adjuster may charge a resident, and the cap is low enough that it shapes which business models can operate here at all."
  },
  {
    code: "HI",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Hawaii limits garnishment on a graduated scale that is more protective than the federal formula at lower incomes.",
    regulator: "Hawaii Department of Commerce and Consumer Affairs",
    court: "district court, with a small claims division for lower amounts",
    context: "Hawaii\u2019s cost of living means a budget that looks workable on a national template often is not, and a provider that underwrites to a national disposable-income floor will misread a Hawaii file.",
    closedNote: "Hawaii restricts debt adjusting closely and no provider on our panel is authorised to serve Hawaii residents."
  },
  {
    code: "ID",
    solYears: 5,
    wageGarnishment: "federal",
    garnishmentNote: "Idaho follows the federal ceiling on wage garnishment.",
    regulator: "Idaho Department of Finance",
    court: "district court, with a small claims department for lower amounts",
    context: "Idaho\u2019s Credit Code requires those arranging credit or debt services to be licensed with the Department of Finance, which publishes a searchable register.",
    closedNote: "Idaho licenses debt and credit counselling services through the Department of Finance. No provider on our panel holds that licence."
  },
  {
    code: "IL",
    solYears: 5,
    solNote: "Illinois applies five years to an unwritten contract and ten to a written one; which applies to a card balance depends on what the creditor can produce.",
    wageGarnishment: "stricter",
    garnishmentNote: "Illinois protects a larger share of weekly take-home pay from garnishment than the federal floor.",
    regulator: "Illinois Department of Financial and Professional Regulation (IDFPR)",
    court: "circuit court, with a small claims track for lower amounts",
    context: "Illinois licenses debt settlement providers under its own Debt Settlement Consumer Protection Act, which imposes fee limits and a written-contract standard tighter than the federal rule.",
    closedNote: "Illinois has a dedicated Debt Settlement Consumer Protection Act with its own licensing and fee regime. No provider on our panel is licensed under it."
  },
  {
    code: "IN",
    solYears: 6,
    wageGarnishment: "federal",
    garnishmentNote: "Indiana follows the federal ceiling and permits only one garnishment order to run at a time.",
    regulator: "Indiana Department of Financial Institutions",
    court: "county or superior court, with a small claims docket for lower amounts",
    context: "Indiana\u2019s debt management statute requires registration and a surety bond, and the Department of Financial Institutions will confirm a registration over the phone."
  },
  {
    code: "IA",
    solYears: 5,
    wageGarnishment: "stricter",
    garnishmentNote: "Iowa caps the total that may be garnished in a calendar year on a sliding scale by income, in addition to the federal per-pay-period limit.",
    regulator: "Iowa Attorney General, Consumer Protection Division",
    court: "district court, with a small claims division for lower amounts",
    context: "Iowa\u2019s annual garnishment cap is unusual and genuinely useful: it limits exposure over a year, not merely per paycheque."
  },
  {
    code: "KS",
    solYears: 3,
    wageGarnishment: "federal",
    garnishmentNote: "Kansas follows the federal ceiling on wage garnishment.",
    regulator: "Kansas Office of the State Bank Commissioner",
    court: "district court, with a limited actions procedure for smaller claims",
    context: "Kansas has a short limitation period for most card accounts, so the date of last activity is the first thing to establish on any demand letter."
  },
  {
    code: "KY",
    solYears: 5,
    wageGarnishment: "federal",
    garnishmentNote: "Kentucky follows the federal ceiling on wage garnishment.",
    regulator: "Kentucky Attorney General, Office of Consumer Protection",
    court: "district court for claims within its limit, circuit court above it",
    context: "Kentucky treats a credit card account as a written contract in most cases, which is what sets the clock, and the agreement the creditor must produce is the cardholder agreement in force at the time."
  },
  {
    code: "LA",
    solYears: 3,
    solNote: "Louisiana calls this prescription rather than a statute of limitations, and the three-year period for an open account is interrupted by a partial payment.",
    wageGarnishment: "stricter",
    garnishmentNote: "Louisiana limits garnishment to a share of disposable earnings below the federal ceiling and permits a court to reduce it further for hardship.",
    regulator: "Louisiana Office of Financial Institutions",
    court: "city or parish court for smaller claims, district court above that",
    context: "Louisiana is a civil-law jurisdiction and its community property rules can expose a spouse to an obligation in ways common-law states do not.",
    closedNote: "Louisiana regulates debt adjusting under its own statute and no provider on our panel is authorised to contract with Louisiana residents."
  },
  {
    code: "ME",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Maine protects a higher weekly floor of earnings than federal law and requires a disclosure hearing before wages can be reached.",
    regulator: "Maine Bureau of Consumer Credit Protection",
    court: "district court, with a small claims procedure for lower amounts",
    context: "Maine\u2019s Bureau of Consumer Credit Protection runs a free consumer helpline that will tell you whether a company contacting you is registered to do so.",
    closedNote: "Maine licenses debt management service providers through the Bureau of Consumer Credit Protection, and no provider on our panel holds that licence."
  },
  {
    code: "MD",
    solYears: 3,
    wageGarnishment: "stricter",
    garnishmentNote: "Maryland protects a weekly floor of wages that is more generous than the federal formula, and the calculation differs in a few counties.",
    regulator: "Maryland Office of Financial Regulation",
    court: "district court for most card claims, circuit court above its limit",
    context: "Maryland\u2019s three-year period is short, and its courts have been active in dismissing collection suits where the plaintiff cannot document the chain of assignment.",
    closedNote: "Maryland licenses debt management services and restricts who may provide them. No provider on our panel is licensed here."
  },
  {
    code: "MA",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Massachusetts protects a substantial weekly floor of earnings from attachment, well above the federal minimum.",
    regulator: "Massachusetts Division of Banks",
    court: "district court or Boston Municipal Court, with a small claims session below the threshold",
    context: "Chapter 93A gives a Massachusetts consumer a private action with multiple damages and fee-shifting, and the Attorney General\u2019s debt collection regulations limit contact frequency more tightly than federal law.",
    closedNote: "Massachusetts restricts debt settlement and debt management work through the Division of Banks and no provider on our panel is licensed under that regime."
  },
  {
    code: "MI",
    solYears: 6,
    wageGarnishment: "federal",
    garnishmentNote: "Michigan follows the federal ceiling, and a periodic garnishment runs for a defined period before it must be renewed.",
    regulator: "Michigan Department of Insurance and Financial Services",
    court: "district court for claims within its limit, circuit court above it",
    context: "Michigan\u2019s Debt Management Act requires a licence and, importantly, treats an unlicensed debt management contract as unenforceable against the consumer."
  },
  {
    code: "MN",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Minnesota protects a weekly floor of earnings above the federal minimum and suspends garnishment while a debtor receives public assistance.",
    regulator: "Minnesota Department of Commerce",
    court: "district court, with a conciliation court for smaller claims",
    context: "Minnesota regulates debt settlement services under a dedicated statute with its own fee limits and a mandatory written services agreement."
  },
  {
    code: "MS",
    solYears: 3,
    wageGarnishment: "federal",
    garnishmentNote: "Mississippi follows the federal ceiling and provides a short grace period after judgment before wages can be reached.",
    regulator: "Mississippi Department of Banking and Consumer Finance",
    court: "justice court for smaller claims, county or circuit court above that",
    context: "Mississippi\u2019s three-year period is among the shortest, and its courts require the plaintiff to prove the account and the assignment.",
    closedNote: "Mississippi regulates debt management services through the Department of Banking and Consumer Finance and no provider on our panel is authorised here."
  },
  {
    code: "MO",
    solYears: 5,
    wageGarnishment: "stricter",
    garnishmentNote: "Missouri reduces the garnishable share of disposable earnings substantially for a head of household.",
    regulator: "Missouri Attorney General, Consumer Protection Division",
    court: "circuit court, with an associate division for smaller claims",
    context: "Missouri requires a debt settlement provider to register with the Attorney General and to hold consumer funds with an independent administrator, which is the structure our panel uses."
  },
  {
    code: "MT",
    solYears: 5,
    wageGarnishment: "federal",
    garnishmentNote: "Montana follows the federal ceiling on wage garnishment.",
    regulator: "Montana Division of Banking and Financial Institutions",
    court: "justice court for smaller claims, district court above that",
    context: "Montana has no general sales tax and a comparatively low cost of living outside the resort counties, which changes what a realistic monthly deposit looks like here.",
    closedNote: "Montana restricts debt adjusting and no provider on our panel is authorised to serve Montana residents."
  },
  {
    code: "NE",
    solYears: 4,
    wageGarnishment: "stricter",
    garnishmentNote: "Nebraska reduces the garnishable share for a head of family below the federal ceiling.",
    regulator: "Nebraska Department of Banking and Finance",
    court: "county court for most card claims, district court above its limit",
    context: "Nebraska\u2019s debt management statute conditions operation on licensing and bonding, and the Department of Banking and Finance publishes the list of licensees.",
    closedNote: "Nebraska licenses debt management service providers and no provider on our panel holds a Nebraska licence."
  },
  {
    code: "NV",
    solYears: 4,
    wageGarnishment: "stricter",
    garnishmentNote: "Nevada protects a weekly floor of disposable earnings that is more generous than the federal formula at lower incomes.",
    regulator: "Nevada Financial Institutions Division",
    court: "justice court for claims within its limit, district court above it",
    context: "Nevada licenses debt-adjusting companies and requires a compliance audit, and the Financial Institutions Division will confirm a licence on request."
  },
  {
    code: "NH",
    solYears: 3,
    wageGarnishment: "stricter",
    garnishmentNote: "New Hampshire is highly protective of wages: wage attachment for an ordinary consumer judgment is very limited in practice.",
    regulator: "New Hampshire Banking Department",
    court: "circuit court district division, with a small claims process below the threshold",
    context: "New Hampshire\u2019s combination of a short limitation period and strong wage protection makes it an unusually weak venue for a judgment creditor chasing wages.",
    closedNote: "New Hampshire licenses debt adjustment services through the Banking Department and no provider on our panel is licensed here."
  },
  {
    code: "NJ",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "New Jersey caps wage execution at a share of earnings well below the federal ceiling and exempts low incomes entirely.",
    regulator: "New Jersey Division of Consumer Affairs",
    court: "Superior Court Law Division, Special Civil Part",
    context: "New Jersey\u2019s Debt Adjustment and Credit Counseling Act restricts debt adjustment for a fee to nonprofit corporations, which is why for-profit settlement is effectively unavailable to residents.",
    closedNote: "New Jersey restricts debt adjustment for a fee to nonprofit corporations. A for-profit settlement programme is not something we can lawfully offer you here, and no waiting list would change that."
  },
  {
    code: "NM",
    solYears: 4,
    solNote: "New Mexico applies four years to an open account and six to a written contract.",
    wageGarnishment: "stricter",
    garnishmentNote: "New Mexico protects a weekly floor of disposable earnings above the federal minimum.",
    regulator: "New Mexico Financial Institutions Division",
    court: "magistrate or metropolitan court for smaller claims, district court above that",
    context: "New Mexico\u2019s Unfair Practices Act allows a consumer to recover statutory damages, which raises the cost of an overstated sales pitch considerably."
  },
  {
    code: "NY",
    solYears: 3,
    solNote: "New York shortened the limitation period for a consumer credit transaction to three years under the Consumer Credit Fairness Act.",
    wageGarnishment: "stricter",
    garnishmentNote: "New York caps an income execution at a share of gross or disposable pay, whichever is lower, and exempts income below a threshold tied to the minimum wage.",
    regulator: "New York State Department of Financial Services (DFS)",
    court: "civil court of the city, or county or district court outside New York City",
    context: "The Consumer Credit Fairness Act also requires a collection plaintiff to attach the contract and to send the defendant a separate notice, and a resident served without those has a real procedural defence.",
    closedNote: "New York supervises this activity through DFS and its consumer credit statutes are among the most protective in the country. No provider on our panel is authorised to offer a settlement programme to a New York resident."
  },
  {
    code: "NC",
    solYears: 3,
    wageGarnishment: "prohibited",
    garnishmentNote: "North Carolina does not permit wage garnishment for an ordinary consumer debt judgment. Garnishment is available only for a narrow set of obligations such as taxes and child support.",
    regulator: "North Carolina Department of Justice, Consumer Protection Division",
    court: "district court, with a small claims magistrate for lower amounts",
    context: "North Carolina caps what a debt adjuster may charge at a level low enough that most national settlement models cannot operate here, and it treats unlicensed debt adjusting as a criminal matter."
  },
  {
    code: "ND",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "North Dakota reduces the garnishable share by a per-dependent allowance in addition to the federal limit.",
    regulator: "North Dakota Department of Financial Institutions",
    court: "district court, with a small claims option for lower amounts",
    context: "North Dakota licenses debt settlement providers under its own chapter and sets its own fee limits, and the Department of Financial Institutions maintains the licensee list.",
    closedNote: "North Dakota licenses debt settlement service providers under a dedicated chapter of its Century Code. No provider on our panel is licensed under it."
  },
  {
    code: "OH",
    solYears: 6,
    wageGarnishment: "federal",
    garnishmentNote: "Ohio follows the federal ceiling and requires a demand letter before a garnishment may be filed.",
    regulator: "Ohio Attorney General, Consumer Protection Section",
    court: "municipal court for most card claims, common pleas above its limit",
    context: "Ohio\u2019s Debt Adjusters Act caps the fee a debt adjuster may charge an Ohio resident, and the cap applies regardless of what a national fee schedule says."
  },
  {
    code: "OK",
    solYears: 5,
    wageGarnishment: "federal",
    garnishmentNote: "Oklahoma follows the federal ceiling and allows a debtor to apply for a hardship reduction.",
    regulator: "Oklahoma Department of Consumer Credit",
    court: "district court, with a small claims procedure for lower amounts",
    context: "Oklahoma\u2019s Department of Consumer Credit licenses and examines credit services organisations, and will tell a resident whether a company is on its register."
  },
  {
    code: "OR",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Oregon protects a weekly and monthly floor of wages above the federal minimum and exempts a small bank balance automatically.",
    regulator: "Oregon Department of Consumer and Business Services, Division of Financial Regulation",
    court: "circuit court, with a small claims department for lower amounts",
    context: "Oregon requires debt management service providers to register with the Division of Financial Regulation and caps their fees by statute.",
    closedNote: "Oregon registers debt management service providers and caps their fees. No provider on our panel is registered in Oregon."
  },
  {
    code: "PA",
    solYears: 4,
    wageGarnishment: "prohibited",
    garnishmentNote: "Pennsylvania does not permit wage garnishment for an ordinary consumer debt judgment. Rent, taxes and support obligations are the exceptions.",
    regulator: "Pennsylvania Department of Banking and Securities",
    court: "magisterial district court for smaller claims, court of common pleas above that",
    context: "Pennsylvania\u2019s Debt Management Services Act licenses this activity and caps fees, and the ban on wage garnishment means a judgment here reaches bank accounts and property rather than pay."
  },
  {
    code: "RI",
    solYears: 10,
    solNote: "Rhode Island\u2019s general contract period is ten years, among the longest in the country.",
    wageGarnishment: "stricter",
    garnishmentNote: "Rhode Island protects a weekly floor of earnings above the federal minimum and exempts a small bank balance.",
    regulator: "Rhode Island Department of Business Regulation",
    court: "district court, with a small claims division for lower amounts",
    context: "Rhode Island\u2019s long limitation period means an old account here stays enforceable far longer than it would in a neighbouring state, which changes the calculation on whether to engage with a collector at all.",
    closedNote: "Rhode Island licenses debt management services through the Department of Business Regulation and no provider on our panel is licensed here."
  },
  {
    code: "SC",
    solYears: 3,
    wageGarnishment: "prohibited",
    garnishmentNote: "South Carolina does not permit wage garnishment for an ordinary consumer debt judgment.",
    regulator: "South Carolina Department of Consumer Affairs",
    court: "magistrate court for smaller claims, circuit court above that",
    context: "A short limitation period plus no wage garnishment makes South Carolina one of the more defensible states for a consumer, though a judgment can still reach bank accounts and attach as a lien to property."
  },
  {
    code: "SD",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "South Dakota reduces the garnishable amount by a per-dependent allowance on top of the federal limit.",
    regulator: "South Dakota Division of Banking",
    court: "circuit court, with a small claims procedure for lower amounts",
    context: "South Dakota has no state income tax and no usury ceiling, which is why so many national card issuers are domiciled here \u2014 though that does not change the law that applies to you as a borrower.",
    closedNote: "South Dakota regulates money transmission and debt adjusting through the Division of Banking and no provider on our panel is authorised here."
  },
  {
    code: "TN",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Tennessee reduces the garnishable share by a per-dependent allowance in addition to the federal limit.",
    regulator: "Tennessee Department of Financial Institutions",
    court: "general sessions court for most card claims, circuit or chancery court above that",
    context: "Tennessee licenses debt management and settlement providers and requires a bond; the Department of Financial Institutions publishes the licensee register."
  },
  {
    code: "TX",
    solYears: 4,
    wageGarnishment: "prohibited",
    garnishmentNote: "Texas does not permit wage garnishment for an ordinary consumer debt judgment. Child support, spousal maintenance, federal student loans and federal taxes are the exceptions. Once wages are deposited, a bank account can still be levied.",
    regulator: "Texas Office of Consumer Credit Commissioner",
    court: "justice court for claims within its limit, county or district court above it",
    context: "Texas combines no wage garnishment for consumer debt with an unlimited homestead exemption and generous personal property exemptions. A judgment is still serious here \u2014 it reaches bank accounts and non-exempt assets \u2014 but it reaches less than almost anywhere else."
  },
  {
    code: "UT",
    solYears: 6,
    wageGarnishment: "federal",
    garnishmentNote: "Utah follows the federal ceiling and a continuing garnishment runs for a defined period before renewal.",
    regulator: "Utah Department of Financial Institutions",
    court: "justice court for smaller claims, district court above that",
    context: "Utah requires a debt management services provider to register with the Department of Commerce and to disclose its fee structure in writing before enrolment."
  },
  {
    code: "VT",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Vermont protects a weekly floor of earnings above the federal minimum and permits a court to exempt more on hardship grounds.",
    regulator: "Vermont Department of Financial Regulation",
    court: "superior court civil division, with a small claims procedure for lower amounts",
    context: "Vermont licenses debt adjusters and caps their fees at a level that has kept most national providers out of the state entirely.",
    closedNote: "Vermont licenses debt adjusters and caps fees tightly. No provider on our panel is licensed in Vermont."
  },
  {
    code: "VA",
    solYears: 3,
    solNote: "Virginia applies three years to an open account and five to a written contract, and which one governs a card balance is frequently contested.",
    wageGarnishment: "federal",
    garnishmentNote: "Virginia follows the federal ceiling, and a garnishment summons runs for a defined return period.",
    regulator: "Virginia State Corporation Commission, Bureau of Financial Institutions",
    court: "general district court for most card claims, circuit court above its limit",
    context: "Virginia licenses debt settlement providers through the Bureau of Financial Institutions and requires a written agreement with specified disclosures before any fee may be taken."
  },
  {
    code: "WA",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Washington protects a substantial weekly floor of earnings from garnishment, calculated by reference to the state minimum wage.",
    regulator: "Washington State Department of Financial Institutions",
    court: "district court for claims within its limit, superior court above it",
    context: "Washington caps the total fee a debt adjuster may charge a resident at a share of the enrolled debt that is far below the national norm, and the cap is enforced by the Attorney General.",
    closedNote: "Washington caps debt adjuster fees at a level below what any provider on our panel operates at, and no provider on our panel is authorised here. That cap exists to protect you; its effect is that there is no programme to show you."
  },
  {
    code: "WV",
    solYears: 10,
    solNote: "West Virginia applies ten years to a written contract and five to an open account.",
    wageGarnishment: "stricter",
    garnishmentNote: "West Virginia limits garnishment to a share of disposable earnings well below the federal ceiling.",
    regulator: "West Virginia Attorney General, Consumer Protection Division",
    court: "magistrate court for smaller claims, circuit court above that",
    context: "West Virginia\u2019s Consumer Credit and Protection Act is unusually strong and its Attorney General has pursued debt settlement operators directly under it.",
    closedNote: "West Virginia regulates this activity under its Consumer Credit and Protection Act and no provider on our panel is authorised to contract with residents."
  },
  {
    code: "WI",
    solYears: 6,
    wageGarnishment: "stricter",
    garnishmentNote: "Wisconsin exempts a share of disposable earnings and allows a debtor to claim total exemption below a poverty-linked income threshold.",
    regulator: "Wisconsin Department of Financial Institutions",
    court: "circuit court, with a small claims procedure for lower amounts",
    context: "Wisconsin is a marital property state, so an obligation incurred during a marriage can reach property held with a spouse in ways a common-law state would not permit."
  },
  {
    code: "WY",
    solYears: 8,
    solNote: "Wyoming applies eight years to an account and ten to a written contract.",
    wageGarnishment: "federal",
    garnishmentNote: "Wyoming follows the federal ceiling and allows a court to reduce it on hardship grounds.",
    regulator: "Wyoming Division of Banking",
    court: "circuit court, with a small claims procedure for lower amounts",
    context: "Wyoming\u2019s long limitation period means an old balance stays enforceable here for far longer than in most of the country.",
    closedNote: "Wyoming restricts debt adjusting and no provider on our panel is authorised to serve Wyoming residents."
  }
];
const FACTS_BY_CODE = Object.fromEntries(FACTS.map((f) => [f.code, f]));
function stateProfile(code) {
  const row = US_STATES.find((s) => s.code === code);
  const facts = FACTS_BY_CODE[code];
  if (!row || !facts) return null;
  const open = !CLOSED_STATES.includes(code);
  const providers = open ? PROVIDERS.filter((p) => p.licensedStates.includes(code)).map((p) => ({ provider: p, feePct: effectiveFeePct(p, code) })) : [];
  return {
    code,
    name: row.name,
    facts,
    open,
    feeCap: STATE_FEE_CAPS[code] ?? null,
    providers
  };
}
function allStateProfiles() {
  return US_STATES.map((s) => stateProfile(s.code)).filter((p) => p !== null);
}
const GARNISHMENT_LABEL = {
  prohibited: "Not available for consumer debt",
  stricter: "Allowed, limited more tightly than federal law",
  federal: "Allowed, at the federal limit"
};
const STATE_LAW_CAVEAT = "State law summaries on this page are general information, not legal advice, and are pending review by US regulatory counsel. Limitation periods in particular depend on facts specific to your account \u2014 which state\u2019s law the card agreement selects, the date of last activity, and whether a payment restarted the clock. If you have been sued or threatened with suit, speak to a lawyer, not to a website.";
export {
  GARNISHMENT_LABEL,
  STATE_LAW_CAVEAT,
  allStateProfiles,
  stateProfile
};
