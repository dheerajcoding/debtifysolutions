import { PARTNER_LIST_HASH } from "./constants.js";
const CONSENTS = [
  {
    key: "fcra",
    required: true,
    plain: "Check my credit report",
    legal: "I authorise Debtify to obtain my consumer report from one or more credit bureaus to assess me for a debt settlement program. This is a soft inquiry and will not affect my credit score."
  },
  {
    key: "esign",
    required: true,
    plain: "Use electronic records and signatures",
    legal: "I agree to receive documents electronically and to sign them electronically. I can withdraw this consent at any time."
  },
  // OPTIONAL. Gates drop-off resale. Never gates the programme.
  {
    key: "contact_partners",
    required: false,
    plain: "Contact me, including by partner providers",
    legal: "Debtify and the debt relief providers on our published partner list may call or text me, including with automated technology, at the number I provided. This is not required to use Debtify. Reply STOP to opt out.",
    partnerListHash: PARTNER_LIST_HASH
  }
];
export {
  CONSENTS
};
