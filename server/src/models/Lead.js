import mongoose from "mongoose";

const Mixed = mongoose.Schema.Types.Mixed;

// Fields must exactly match what tagTradeline() produces (see services/tradelines.js).
// Mongoose strict mode silently drops any field not declared here when using MongoDB.
const TradelineSchema = new mongoose.Schema(
  {
    tlId: String,
    creditor: String,
    type: String,
    dpd: { type: Number, default: 0 },
    balanceBureau: { type: Number, default: null },       // from credit bureau — never overwritten
    balanceConfirmed: { type: Number, default: null },    // consumer correction, null = use bureau figure
    source: { type: String, default: "bureau" },          // "bureau" | "consumer"
    enrollable: Boolean,
    selected: Boolean,
    excludedReason: { type: String, default: null },
    needsReview: { type: Boolean, default: false },
    confirmed: { type: String, default: null },
    status: { type: String, default: null },
  },
  { _id: false }
);
const ConsentSchema = new mongoose.Schema({ type: String, granted: Boolean, lang: String, version: String, textHash: String, at: Date }, { _id: false });
const EventSchema = new mongoose.Schema({ tag: String, text: String, at: Date }, { _id: false });

// One application (lead) per enrollment attempt. Owned by a user once they create an account.
const LeadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true, index: true },
    userId: { type: String, index: true, default: null },
    guestTokenHash: { type: String, index: true, default: null },
    source: { type: String, enum: ["demo", "sample", "web"], default: "web", index: true },
    lang: { type: String, default: "en" },
    persona: String,
    state: String,
    debtRange: String,
    debt: Number,
    paymentStatus: String,
    estimate: { type: Mixed, default: null },
    step: { type: Number, default: 1 },
    maxStep: { type: Number, default: 1 },
    status: { type: String, default: "STARTED", index: true },
    outcome: { type: String, default: null, index: true },  // flow outcome: in_progress | enrolled | declined | diverted | referred_out | abandoned
    dropReason: { type: String, default: null },
    // Identity. The full SSN is never stored; DOB and address are AES-256-GCM encrypted.
    first: String,
    last: String,
    // Contact details live on the application itself (there are no customer accounts).
    // Mongoose is strict, so every field the flow writes must be declared here or it is
    // silently dropped on MongoDB while still appearing to work on the memory store.
    email: { type: String, index: true, lowercase: true, trim: true },
    phone: String,
    phoneVerified: { type: Boolean, default: false },
    termsAcceptedAt: String,
    otp: { type: Mixed, default: null },
    manualReview: { type: Boolean, default: false },
    ssnLast4: String,
    dobEnc: String,
    addressEnc: String,
    kyc: String,
    consents: [ConsentSchema],
    share: { type: Boolean, default: false },
    tradelines: [TradelineSchema],
    income: Number,
    expenses: Number,
    bankLinked: { type: Boolean, default: false },
    depositAccountLinked: { type: Boolean, default: false },
    program: { type: Mixed, default: null },
    backend: { type: String, default: null },
    costsAcknowledged: { type: Boolean, default: false },
    quizAttempts: { type: Number, default: 0 },
    draftDate: String,
    signedAt: Date,
    enrolledAt: Date,
    cancelledAt: Date,
    callResult: String,
    deposits: { type: [Mixed], default: [] },
    feeStatus: { type: String, default: "NOT_EARNED" },
    clarity: { type: Mixed, default: {} },
    chats: { type: Number, default: 0 },
    person: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    events: [EventSchema],
    // Internal staff annotations. Never returned to the consumer (see publicLead).
    staffNotes: [{ _id: false, at: String, by: String, text: String }],
    // --- fields the enrollment flow writes. Mongoose is strict: anything not declared
    // here is silently dropped on MongoDB while still working on the memory store, so
    // every one of these must stay in sync with what routes/leads.js assigns.
    quote: { type: Mixed, default: null },          // bound program offer: provider, debt, deposit, fees
    signature: { type: Mixed, default: null },      // e-sign record incl. audit hash — compliance evidence
    budget: { type: Mixed, default: null },
    callBooking: { type: Mixed, default: null },
    callPoints: { type: Mixed, default: null },
    referral: { type: Mixed, default: null },
    exitStep: { type: Number, default: null },
    fraudScore: { type: Number, default: null },
    comprehensionAttempts: { type: Number, default: 0 },
    comprehensionPassed: { type: Boolean, default: false },
    incomeVerified: { type: Boolean, default: false },
    skippedBankLink: { type: Boolean, default: false },
    heightenedCredit: { type: Boolean, default: false },
    bureauNoHit: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false }
);

export const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
