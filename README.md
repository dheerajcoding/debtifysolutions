# Debtify (MERN) — v3

A production-ready build of Debtify: a public website, a **short 9-screen bilingual application** (English / Español) with Jay the guide, **no customer accounts** (visitors apply straight away; the application is saved on their browser and the phone is verified by text code), a **staff-only login** for the console (previously: sign up, log in, email verification, password reset), a **customer dashboard**, and a **staff console** behind a staff login.

- **Frontend:** React 18 + Vite + React Router (`client/`)
- **Backend:** Node.js + Express (`server/`)
- **Database:** MongoDB via Mongoose (in-memory fallback for local development only)

All partner vendors (ID check, soft credit pull, Plaid, e-sign, AI welcome call, partner webhooks) are **simulated**. Swap them in `server/src/services/vendors.js` when you sign real vendor contracts.

---

## What's new in v3 (everything from the full Next.js build, ported to MERN)

**Application flow (still short: 10 screens in 5 phases)** — every step is now gated server-side: a step can't be passed until its gate artifact exists in the database.
- Phone **text-message code** (6 digits, 5 tries, rate-limited resend; shown on screen in development) and fraud scoring → manual review.
- Consents written as **append-only evidence**: exact text version hash (EN/ES), IP, device, render-to-grant time, partner-list hash. Partner contact is optional and never blocks.
- Credit pull with live **bureau stages**; confirm unclear accounts, **correct balances**, **add missing debts**; student/auto/mortgage **excluded with reasons**.
- Budget with optional bank link; the **decision engine (rules R1–R7)** binds a provider, writes an immutable decision log, keeps a permanent 10% exploration slice and caps fees at the **state fee cap**.
- Registry-driven **disclosures** (advance fee, dedicated account, credit impact, creditor contact, tax) with dwell time and version-hash acknowledgement; **comprehension check** (2 tries, then divert to alternatives).
- **Alternatives** step (counselling, consolidation, bankruptcy, DIY…) before signing; choosing one refers out.
- Signature must match the legal name; 4-document pack, **ACH authorisation**, audit hash; **verification call** booking (now / this afternoon / tomorrow).
- Closed states and small debts exit at step 1 **before any personal data** is collected.

**Staff console (`/staff`) — sidebar with:** Dashboard (phase funnel, unit economics, clearance sensitivity, consent health, comprehension, clarity, exceptions) · Applications with a **per-file audit trail** (PII view logged, step timeline + gates, consent records, artifacts, decision log, tradelines bureau vs confirmed, signature, deposits, activity, call pass/fail, partner events) · Drop-offs (resale tiers A/B/C and price bands) · Consent records · Disclosure registry (EN/ES text + hashes) · **TCPA suppression list** (STOP/REVOKE handling, manual add, message tester, Twilio webhook) · **Access log** (admin) · Providers (underwriting, state fee-cap matrix, closed states) · Users & roles · Demo app · Explainer library · How to demo.

**Public site:** `/how-it-works`, `/alternatives`, `/guides` + 6 long-form guides, `/states` + all 51 state pages (fee caps, garnishment, limitation periods, licensed partners), `/legal/disclosures`, `sitemap.xml`, `robots.txt`, JSON-LD.

**Customer portal as an app (PWA):** installable (`manifest.json`, service worker that never caches personal pages, purged on logout), install coach on the dashboard.

## What changed from v1 (and why)

Based on how leading debt-relief and lending sites handle sign-up, plus form UX research (easy questions first, sensitive ones later, 3–5 labeled stages, show value before asking for details):

| v1 | v2 |
|---|---|
| 12 screens | **9 screens in 4 labeled stages** (Quick check → Your debts → Your plan → Enroll), with "about N minutes left" |
| Slider for debt | **Tap buttons** for debt range; can start straight from the homepage |
| Personal details before any value | **Instant estimate first** (deposit range, months, total), then a free account |
| Consents pre-checked, long text | Unchecked by default, **plain-words summary first**, full legal text one tap away, optional ones folded away |
| No accounts | Accounts, saved progress, **resume any time**, dashboard |
| Errors as one message | **Inline errors under each field**, input masks for phone/SSN/money, password strength meter |
| Staff console open to anyone | Staff console requires a **staff/admin login** |

## Pages

| Path | What |
|---|---|
| `/` | Homepage with a one-tap quick start |
| `/apply` | The application — no account or password; step 2 asks only for name, email and mobile |
| `/staff/login`, `/forgot-password`, `/reset-password` | **Staff-only** sign in (`/login` redirects here, `/signup` redirects to `/apply`) |
| `/dashboard` | "My application" for the browser that applied (no login): program status, deposits, enrolled debts, documents, help, cancel any time |
| `/dashboard/agreement` | Printable agreement summary |
| `/settings` | "My data": language, contact preference, download my data, delete my details |
| `/staff` | Staff console (see above). Sections are linkable: `/staff?s=apps&id=<fileId>` |
| `/how-it-works`, `/alternatives`, `/guides`, `/guides/:slug`, `/states`, `/states/:code`, `/legal/disclosures` | Content & SEO pages |
| `/portal` | Alias of `/dashboard` (PWA start page) |
| `/privacy`, `/terms`, `/contact` | Starter legal pages (have counsel complete the bracketed parts) |
| `/dev/outbox` | Development only: emails the app would send (verification, reset) |

## Security built in

- Passwords hashed with **bcrypt** (cost 12); strength rules + common-password block
- Sessions in **httpOnly, SameSite=Lax, Secure (prod) cookies** (JWT); "sign out everywhere" via token versioning
- **CSRF protection**: every state-changing request must send `X-Requested-With: debtify`
- **Rate limits** on login, signup, password reset, email and chat; **account lockout** after 5 wrong passwords (15 min)
- Email verification required before signing; reset links are single-use and expire in 1 hour; forgot-password never reveals whether an email exists
- **Full SSN never stored** (last 4 only); date of birth and address **encrypted at rest (AES-256-GCM)**
- Applications are only visible to their owner; staff APIs require the staff/admin role
- Helmet security headers with a strict **Content Security Policy**, input validation with **zod**, JSON body size limits, no stack traces in production
- The server **refuses to start in production** without `MONGO_URI`, `JWT_SECRET` and `ENCRYPTION_KEY`

---

## Run it locally

Requirements: Node.js 18+ (MongoDB optional for local runs).

```bash
npm run install:all
copy server\.env.example server\.env      # Windows  (cp on macOS/Linux)
npm run dev
```

- Website: http://localhost:5173
- **Staff login:** `admin@debtify.local` / `ChangeMe2026` (set by `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`; change them!)
- Verification and reset emails: open http://localhost:5173/dev/outbox and click the link (no SMTP needed in dev)

If MongoDB isn't running locally, the server uses an in-memory store and says so in the console. Data then resets on restart.

## Tests

```bash
npm test
```

Runs API tests covering CSRF, password rules, the full guest → contact details → enrolled journey, staff-only login, SSN/DOB storage, access control between users, lockout and password reset.

## Deploy to production

### Option A: Docker (MongoDB included)
```bash
set JWT_SECRET=...  & set ENCRYPTION_KEY=...  & set ADMIN_PASSWORD=...     # or export on macOS/Linux
docker compose up --build
```
App on http://localhost:5000.

### Option B: Any Node host (Render, Railway, a VPS) + MongoDB Atlas
1. Create a free MongoDB Atlas cluster and copy its connection string.
2. Set environment variables on the host (see `server/.env.example`):
   `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`, `APP_URL=https://yourdomain.com`, `CLIENT_ORIGIN=https://yourdomain.com`, `TRUST_PROXY=1`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) from Resend, SendGrid, Postmark, Amazon SES, etc.
3. Build command: `npm run install:all && npm run build` · Start command: `npm start`
4. Generate secrets with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
5. Production defaults: `DEMO_MODE` and `SEED_SAMPLES` are **off**. Turn `DEMO_MODE=true` on for a staging site only.

Create more staff later: `npm --prefix server run create-admin -- name@company.com "StrongPassw0rd" staff`

### Before real customers use it
- Replace the simulated vendors with real ones (identity/KYC, soft-pull credit bureau, Plaid, e-sign, partner APIs).
- Have counsel finish the Privacy Policy, Terms, consent wording (TCPA, E-SIGN, FCRA) and Spanish translations.
- Put your real company name, licences, address, phone and support email in the footer and legal pages.
- Set `TWILIO_*` for real text-message codes and point the Twilio inbound webhook at `/api/webhooks/sms` (STOP handling).
- Replace the placeholder disclosure text, provider panel and state fee caps in `shared/config/` with counsel-approved values (bump each version).
- Turn on backups for MongoDB and add uptime monitoring on `/api/health`.

---

## Project structure

```
shared/                  config + content used by BOTH server and client
  config/                providers & state fee caps, consents, disclosures (EN/ES), flow constants, brand
  content/               guides, states, alternatives, consequences, page copy
server/src/
  compliance/            registry (hashes + gates), decision engine R1–R7, suppression, metrics
  models/AppendOnly.js   append-only collections (consents, artifacts, decisions, suppressions, accessLog)
  routes/public.js       public registry/states, Twilio SMS webhook, sitemap/robots
  lib/sms.js             Twilio or dev outbox, checks the suppression list first
  app.js                 Express app: security headers, CSRF, rate limits, routes, static hosting
  index.js               connect DB, create first admin, seed samples, graceful shutdown
  config/env.js          validated configuration (fails fast in production)
  config/db.js           MongoDB collections + in-memory fallback
  models/User.js, Lead.js
  middleware/auth.js     sessions, guest token, requireAuth / requireRole
  middleware/security.js CSRF header check, rate limiters
  lib/crypto.js          AES-256-GCM field encryption, tokens
  lib/mailer.js          SMTP email + dev outbox, email templates (EN/ES)
  routes/auth.js         staff login, logout(-all), forgot/reset password (customers never sign in)
  routes/leads.js        the 9-step application
  routes/me.js           dashboard, cancel, preferences, profile, password, export, delete
  routes/admin.js        staff: stats, applications, partner events, exceptions, users & roles
  routes/chat.js         Jay
  services/              matching engine, estimates & deposit schedule, vendors (mock), chat, stats, samples
  tests/api.test.js
client/src/
  App.jsx                routes + auth guards
  context/AppContext.jsx language, user, application state, chat
  components/            Layout (header/footer/progress), Flow (actions), Screens (9 steps), Chat, ui (fields)
  pages/                 Home, Apply, Auth, Dashboard, Settings, Content (guides/states/…), Staff, Admin, Library, Legal
  pages/staff/           console sections: Applications (audit trail), Records (consents, disclosures, suppression, providers, drop-offs, access log)
  public/                manifest.json, sw.js, icons (PWA)
  lib/                   api client, EN/ES copy, SVG explainers, input masks
```
