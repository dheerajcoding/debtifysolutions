const BRAND = {
  /** Product name shown to consumers. */
  name: "Debtify",
  /** Legal entity that operates the platform. NEVER the counterparty on a consumer agreement. */
  legalName: "Debtify, Inc.",
  domain: "godebtify.com",
  supportEmail: "help@godebtify.com",
  /** Shown on Contact/Privacy/Terms when set. Left empty until a real line is live —
   *  never ship an invented phone number to consumers. */
  supportPhone: "",
  address: "1200 Main St, Suite 400, Houston, TX 77002",
  /** Shown in the footer when set, e.g. ["NMLS #000000"]. Leave empty until you have real ones. */
  licenses: [],
  /** Used in the Terms of Use. Have counsel confirm. */
  governingLaw: "the State of Texas",
  /** One line. Describes the platform, never promises an outcome. */
  tagline: "See your real options in four minutes. No sales call.",
  /**
   * Said on every page that could be mistaken for a provider relationship.
   * This sentence is load-bearing for the licensing posture — see §19 of the dossier.
   */
  posture: "Debtify is a technology platform, not a debt settlement provider. Programs are provided by licensed partner providers who contract with you directly.",
  theme: {
    primary: "#0B6E5F",
    accent: "#14657F"
  }
};
export {
  BRAND
};
