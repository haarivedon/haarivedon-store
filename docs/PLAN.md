# Haarivedon — Build Plan

**Scope: the SRS, and nothing else.**

Source of truth: _Software Requirements Specification — HAARIVEDON_, v1.0,
2 September 2026, Vedseem Technologies (client copy:
`~/Downloads/HAARIVEDON_SRS(2).docx`; identical to the v1.0 text already on
file). Every item below traces to a numbered SRS clause. Anything that does not
is listed in §3 as deferred, and is not built.

---

## 1. Where the project stands today

| Area       | State                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Repo       | Turborepo monorepo: `apps/web`, `apps/api`, `packages/{contract,db,tsconfig}`                                                       |
| Pages live | `/` only. Nav links to `/about`, `/services`, `/courses`, `/products`, `/predictions`, `/blog`, `/book` — **all 404**               |
| Home page  | Complete: Hero, TrustStrip, About, Services, Courses, PredictionBand, BookingBand, Products, EnergyTools, WhyUs, Testimonials, Blog |
| API        | `POST/GET /api/bookings`, `POST/GET /api/predictions`, health. Admin reads gated by a shared `ADMIN_API_KEY`                        |
| Database   | Prisma/MongoDB. `Booking` and `PredictionRequest` in use; `Product`, `Service`, `Testimonial`, `BlogPost` exist but unused          |
| Content    | Hardcoded in `apps/web/lib/content/site.ts`                                                                                         |
| Assets     | Founder photography in `apps/web/public/images/`; product/blog imagery still Unsplash placeholders                                  |

The home page (SRS §3.1) is effectively done. The remaining five sections do not
exist yet.

---

## 2. What gets built (SRS §3)

| SRS  | Page                             | Contents                                                                                           |
| ---- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| §3.1 | `/`                              | Already built. Re-point CTAs at the real pages once they exist                                     |
| §3.2 | `/about`                         | Founder story, mission/philosophy, areas of expertise, supporting imagery                          |
| §3.3 | `/services`                      | Service listing with descriptions, starting prices, CTA to `/book`                                 |
| §3.4 | `/book`                          | Booking form (name, contact, preferred date/time, session type) → MongoDB → on-screen confirmation |
| §3.5 | `/products` + `/products/[slug]` | Listing with images, descriptions, pricing; individual detail view. **Display only**               |
| §3.6 | `/predictions`                   | Prediction/readings content + request form → MongoDB                                               |

Plus the supporting pieces the SRS implies rather than lists: a `/contact`
route is **not** in the SRS — contact details live in the footer (§3.1), which
is already built.

### Backend (SRS §1.2, §3.4, §3.6)

The booking and prediction endpoints already exist and are typed end to end
through `packages/contract`. Work remaining:

- `GET /api/services`, `GET /api/products`, `GET /api/products/:slug` — read
  endpoints so the pages are API-driven rather than importing `site.ts`
  (SRS §1.2 requires "integration between all three layers")
- Seed script putting the existing `site.ts` service and product data into
  MongoDB (SRS §2: "database design")
- Keep the existing `ADMIN_API_KEY` guard on the list endpoints. No login
  screen — see §3

### Products are display-only

SRS §3.5 asks for listing, detail view, and _"structure to support future
e-commerce/cart functionality **if required**"_. That is satisfied by a
`Product` model carrying price, currency, stock and images, and by a detail
page with a clearly-marked CTA. No cart, no checkout, no payment gateway.

### Non-functional (SRS §4)

| SRS category    | What it means here                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance     | SSG/ISR on every content page, `next/image`, font preload                                                                                      |
| SEO             | `generateMetadata` per page, semantic HTML, `sitemap.ts`, `robots.ts`, JSON-LD (`Organization`, `Service`, `Product`), server-rendered content |
| Responsiveness  | Desktop / tablet / mobile on every new page, matching the home page's standard                                                                 |
| Scalability     | Already satisfied by the API + MongoDB split                                                                                                   |
| Security        | zod validation on every input (the contract does this), rate limiting on public POSTs, HTTPS, no secrets in `NEXT_PUBLIC_*`                    |
| Maintainability | Contract-first: one file per resource, one schema per payload                                                                                  |

---

## 3. Deferred — not in this build

Per SRS §5: _"Any scope beyond the six listed pages will be treated as a change
request."_ These were discussed and are parked. None of them is started, and
none of them is assumed by the phases below.

| Deferred item                        | Why it is out                                                                                   | Rough cost if later requested |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------- |
| Admin panel + CMS                    | Not in the SRS. Content edits come through us                                                   | 8–12 days                     |
| Cart, checkout, Razorpay             | SRS §3.5 says _future_ e-commerce _if required_                                                 | 10–15 days                    |
| Courses page                         | In the nav, not in the SRS                                                                      | 2–3 days                      |
| Blog                                 | In the nav, not in the SRS                                                                      | 3–4 days                      |
| Transactional email                  | SRS §3.4 asks for a "confirmation message/notification"; an on-screen confirmation satisfies it | 2 days                        |
| Calendar availability / slot booking | SRS §3.4 describes a form, not a scheduler                                                      | 4–6 days                      |

**Consequence for the nav.** `/courses` and `/blog` are linked from the header,
footer, and home page but will not exist. Phase 1 removes those links and the
corresponding home-page sections (`Courses`, `Blog`) so nothing points at a 404. The components stay in the repo, unused, ready to re-enable if either is
commissioned.

---

## 4. Phases

Working days for one developer, excluding time spent waiting on client content.
Each phase maps to an SRS payment milestone (§6).

### Phase 0 — Content and setup · 0.5 d

Client supplies copy and imagery (SRS §5). Confirm the booking and prediction
field lists — SRS §5 requires this before those modules are built. Remove the
Courses and Blog nav links and home sections. Confirm in writing that the six
deferred items in §3 are out of scope.
→ **Milestone 1 (33%) — project initiation, already triggered**

### Phase 1 — About, Services, Products · 4–5 d

- `/about` (SRS §3.2)
- `/services` with descriptions, starting prices, CTA to `/book` (SRS §3.3)
- `/products` listing and `/products/[slug]` detail (SRS §3.5)
- Read endpoints + seed script moving services and products into MongoDB
- Per-page metadata as each page lands

### Phase 2 — Booking and Predictions · 3–4 d

- `/book`: form, validation, error states, success confirmation (SRS §3.4)
- `/predictions`: content area + request form (SRS §3.6)
- Both already have endpoints, zod schemas, and Prisma models; this is the UI,
  the wiring, and the confirmation states
- Rate limiting on both public POST routes (SRS §4 Security)
  → **Milestone 2 (33%) — mid-development: all six SRS sections exist and work**

### Phase 3 — SEO, performance, accessibility · 2–3 d

- `sitemap.ts`, `robots.ts`, JSON-LD, OpenGraph images, canonical URLs
- Lighthouse pass: SEO ≥ 95, performance ≥ 90 on mobile
- Contrast, focus rings, keyboard navigation, labelled fields, alt text
- Cross-browser and real-device QA

### Phase 4 — Deploy and hand over · 1.5–2 d

- Production deploy: `apps/web` on Vercel, `apps/api` on a long-running Node
  host, MongoDB Atlas
- Domain + DNS cutover, HTTPS
- Analytics (GA4 or Plausible)
- Client walkthrough; short handover note covering how to request content
  changes and where submissions land
  → **Milestone 3 (34%) — final delivery**

**Total: 11–14.5 working days.**

---

## 5. Deployment

| Piece      | Where                              | Notes                                        |
| ---------- | ---------------------------------- | -------------------------------------------- |
| `apps/web` | Vercel, root directory `apps/web`  | `NEXT_PUBLIC_API_URL` → the API's public URL |
| `apps/api` | Railway / Render / Fly             | `node dist/index.js`, long-running           |
| MongoDB    | Atlas (M0 is enough at this scale) | Replica set required by Prisma               |

Environment variables are already defined: `DATABASE_URL`, `API_PORT`, `HOST`,
`CORS_ORIGIN`, `ADMIN_API_KEY`, `NEXT_PUBLIC_API_URL`. Any new variable must
also be added to `turbo.json`'s `globalEnv`, or turbo strips it.

---

## 6. Depends on the client (SRS §5)

Work stalls without these. Collect them in Phase 0.

1. Copy for About, each Service, and the Predictions page
2. Product data: names, descriptions, prices, images
3. Real testimonials with names and permission to publish
4. Logo files (SVG preferred) and any brand guidance
5. Domain and DNS access
6. Confirmation of the exact booking fields and the exact prediction request
   fields — **SRS §5 makes this a precondition for Phases 1 and 2**
7. What the client delivers after a prediction request, and in what timeframe,
   so the confirmation copy is accurate

---

## 7. Risks

| Risk                                                  | Impact                                     | Handling                                                                                   |
| ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Content not supplied on time                          | Pages ship with placeholders; launch slips | Content deadline per phase; placeholders carry a visible TODO                              |
| Booking turns out to need real availability           | +4–6 days; out of SRS scope                | Settle item 6 above before Phase 2                                                         |
| Product imagery still Unsplash at launch              | Weak credibility on the Products page      | Flag in Phase 0; the client either supplies photos or accepts stock                        |
| ts-rest pinned to a release candidate (`3.53.0-rc.1`) | A breaking change in the final 3.53        | Pinned exactly; re-test before bumping. The alternative is downgrading zod to v3 repo-wide |
| Scope creep from the §3 deferred list                 | Timeline and payment disputes              | Each one is a priced change request, per SRS §5                                            |

---

## 8. Open questions

1. Exact booking form fields and session types — SRS §5 precondition
2. Exact prediction request fields and the promised turnaround — SRS §5 precondition
3. Are products sold off-site today (WhatsApp, phone)? If so, the detail page
   CTA should say so explicitly rather than implying a cart
4. Does the client want the Courses and Blog sections removed outright, or
   hidden behind a "coming soon" state?
