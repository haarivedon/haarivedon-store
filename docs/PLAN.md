# Haarivedon — Build Plan

Derived from the SRS (v1.0, 2 Sep 2026) plus the scope decisions taken on
10 Oct 2026. Edit this file before work starts; it is the reference the build
follows.

---

## 1. Where the project stands today

| Area          | State                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo          | Turborepo monorepo: `apps/web`, `apps/api`, `packages/{contract,db,tsconfig}`                                                                |
| Pages live    | `/` only. Nav links to `/about`, `/services`, `/courses`, `/products`, `/predictions`, `/blog`, `/book` — **all 404**                        |
| Home page     | Complete: Hero, TrustStrip, About, Services, Courses, PredictionBand, BookingBand, Products, EnergyTools, WhyUs, Testimonials, Blog          |
| API           | `POST/GET /api/bookings`, `POST/GET /api/predictions` + health. Admin routes gated by a shared `ADMIN_API_KEY`                               |
| Database      | Prisma/MongoDB. `Booking` and `PredictionRequest` are used; `Product`, `Service`, `Testimonial`, `BlogPost` exist but **nothing reads them** |
| Content       | Hardcoded in `apps/web/lib/content/site.ts`                                                                                                  |
| Assets        | Founder photography + a few props in `apps/web/public/images/`. Product and blog imagery are Unsplash placeholders                           |
| Design system | Client palette + fonts encoded in `globals.css`; shadcn/Base UI primitives in place                                                          |

**The site is a finished landing page on an unfinished product.** Everything
below is about turning it into the six-section site the SRS describes, plus the
extras agreed on.

---

## 2. Scope: SRS vs. what we agreed to build

### In the SRS (contracted)

Home · About · Services · Book a Session · Products · Predictions.

### Agreed additions — **these are change requests, not SRS scope**

| Addition                              | Why it grew                                                                              | Rough effort |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | ------------ |
| Admin panel + DB-driven content       | Client must edit services/products/blog/testimonials and see bookings without calling us | 8–12 days    |
| Full cart + online payment (Razorpay) | SRS says only _"structure to support future e-commerce"_                                 | 10–15 days   |
| Courses page                          | In the nav and on the home page, absent from the SRS                                     | 2–3 days     |
| Blog                                  | Same — in the nav, not in the SRS                                                        | 3–4 days     |
| Transactional email                   | SRS says "confirmation message/notification" — reading that as real email                | 2 days       |

> **Action before coding:** get these five in writing with the client — either
> as goodwill inclusions or as a priced change request. The SRS explicitly says
> _"Any scope beyond the six listed pages will be treated as a change request."_
> Do not start Phase 4 (commerce) until the payment terms for it are agreed.

---

## 3. Architecture decisions (locked)

| Decision       | Choice                                                | Notes                                            |
| -------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Content source | MongoDB via the API, edited through an admin panel    | `site.ts` becomes the seed, not the source       |
| Admin auth     | **Better Auth**, self-hosted, sessions in our MongoDB | No vendor cost; one seeded admin user            |
| Payments       | **Razorpay** (orders + webhook verification)          | UPI-first; client provides KYC'd account         |
| Media          | **S3-compatible self-managed (Cloudflare R2)**        | We build signed uploads + a resize step          |
| Email          | Nodemailer (SMTP) or Resend + on-screen confirmation  | Both notify-the-client and auto-reply-to-visitor |
| Courses + Blog | In scope                                              | Listing + detail for each                        |

### Consequences of the media choice

R2 is the cheapest option but the only one with no built-in transforms. We must
build: presigned `PUT` issuance in the API, a `sharp`-based resize on upload
(webp + 2–3 widths), a stable public URL scheme, and a `next.config.ts`
`remotePatterns` entry. Budget ~2 days; Cloudinary would have been ~0.5. Flagging
it once — if that trade reads wrong later, switching costs a day.

---

## 4. Data model changes (`packages/db/prisma/schema.prisma`)

### Existing models — changes

- `Product` — add `images String[]`, `stock Int?`, `sku String?`,
  `published Boolean`, `seoTitle`/`seoDescription`. Keep `price` in **paise**
  (integer) to avoid float money.
- `Service` — add `content String` (long-form body), `bannerImage String?`.
- `BlogPost` — already has `content`, `tags`, `publishedAt`; add `readingTime Int?`.
- `Testimonial` — fine as is.
- `Booking` / `PredictionRequest` — add `adminNotes String @default("")`.

### New models

| Model                                        | Purpose                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`, `Session`, `Account`, `Verification` | Better Auth tables (schema dictated by the adapter)                                                                                                                                                                                                                                |
| `Course`                                     | title, slug, summary, content, coverImage, duration, mode (online/offline), price (paise), seats, startsAt, published, order                                                                                                                                                       |
| `CourseEnquiry`                              | name, email, phone, courseId, message, status                                                                                                                                                                                                                                      |
| `Order`                                      | orderNumber, customer snapshot (name/email/phone), items snapshot, subtotal, shipping, total (paise), currency, status (`pending`/`paid`/`failed`/`shipped`/`delivered`/`cancelled`/`refunded`), razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingAddress, createdAt |
| `OrderItem` (embedded or related)            | productId, name/price **snapshotted at purchase time**, quantity                                                                                                                                                                                                                   |
| `MediaAsset`                                 | key, url, width, height, mimeType, alt, uploadedBy — so the admin has a library instead of orphan URLs                                                                                                                                                                             |
| `SiteSetting`                                | single document: phone, email, socials, hero copy, announcement bar — the bits of `site.ts` the client will want to change                                                                                                                                                         |

Money is stored as integer paise everywhere. Dates as `DateTime`, serialised to
ISO strings at the API boundary (the existing `serialize()` convention).

---

## 5. API surface (`packages/contract`)

One sub-contract per resource, mirrored by one file in `apps/api/src/routes/`.

**Public (no auth)**

```
GET    /api/services            list published
GET    /api/services/:slug
GET    /api/products            list published, filter by category, paginate
GET    /api/products/:slug
GET    /api/courses             list published
GET    /api/courses/:slug
GET    /api/blog                list published, paginate, filter by tag
GET    /api/blog/:slug
GET    /api/testimonials        list published
GET    /api/settings            site settings singleton
POST   /api/bookings            exists
POST   /api/predictions         exists
POST   /api/enquiries           product / course enquiry
POST   /api/checkout/order      create Razorpay order from a cart
POST   /api/checkout/webhook    Razorpay webhook — signature-verified, idempotent
GET    /api/orders/:orderNumber lookup by number + email (no login)
```

**Admin (session-authenticated)**

```
CRUD   /api/admin/{services,products,courses,blog,testimonials}
GET    /api/admin/bookings           list, filter, paginate   (exists)
PATCH  /api/admin/bookings/:id       status + notes           (exists)
GET    /api/admin/predictions        list, filter, paginate   (exists)
PATCH  /api/admin/predictions/:id    status + notes
GET    /api/admin/orders             list, filter
PATCH  /api/admin/orders/:id         fulfilment status
POST   /api/admin/media/sign         presigned R2 upload URL
GET    /api/admin/media              asset library
PATCH  /api/admin/settings
GET    /api/admin/stats              dashboard counters
```

Auth moves from the `x-api-key` guard in `apps/api/src/lib/auth.ts` to a Better
Auth session check in the same file — one place changes, nothing else.

---

## 6. Web pages (`apps/web/app`)

| Route                                                      | Contents                                                               | Rendering                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------- |
| `/`                                                        | Existing home page, re-wired to read from the API instead of `site.ts` | ISR (revalidate 1h)        |
| `/about`                                                   | Founder story, philosophy, credentials, imagery, CTA                   | Static                     |
| `/services`                                                | Service cards from DB → detail pages                                   | ISR                        |
| `/services/[slug]`                                         | Long-form service page, pricing, booking CTA                           | ISR                        |
| `/book`                                                    | Booking form (existing zod schema), date/time picker, session type     | Client form → API          |
| `/book/thank-you`                                          | Confirmation + what happens next                                       | Static                     |
| `/products`                                                | Grid, category filter, pagination, add-to-cart                         | ISR                        |
| `/products/[slug]`                                         | Gallery, description, price, quantity, add-to-cart                     | ISR                        |
| `/cart`                                                    | Line items, quantities, totals                                         | Client (localStorage cart) |
| `/checkout`                                                | Contact + shipping form → Razorpay modal                               | Client                     |
| `/orders/[orderNumber]`                                    | Order status lookup                                                    | Dynamic                    |
| `/predictions`                                             | Explanation of readings + request form (DOB, time, place, focus area)  | ISR + client form          |
| `/courses`, `/courses/[slug]`                              | Listing + detail with enquiry form                                     | ISR                        |
| `/blog`, `/blog/[slug]`                                    | Listing with tags + post page                                          | ISR                        |
| `/contact`                                                 | Form, phone, email, map if there's a physical address                  | Static                     |
| `/privacy`, `/terms`, `/refund-policy`, `/shipping-policy` | **Required by Razorpay before KYC approval**                           | Static                     |
| `/admin/*`                                                 | Separate layout, session-gated                                         | Client-side, dynamic       |

Each page gets `generateMetadata`, OpenGraph image, JSON-LD
(`Organization`, `Service`, `Product`, `Article`, `BreadcrumbList`), plus
`sitemap.ts` and `robots.ts` at the app root.

---

## 7. Admin panel

Route group `app/(admin)/admin/` in the **same** Next app, own layout, no public
chrome.

- `/admin/login` — Better Auth email + password
- `/admin` — dashboard: new bookings, pending predictions, recent orders, revenue this month
- `/admin/bookings` — table, status filter, detail drawer, status change + notes
- `/admin/predictions` — same shape
- `/admin/orders` — table, payment status, fulfilment status, customer details
- `/admin/services|products|courses|blog|testimonials` — list + create/edit forms, publish toggle, drag-to-reorder
- `/admin/media` — upload, browse, copy URL, alt text
- `/admin/settings` — contact details, socials, hero copy

Editor for long-form content: a markdown textarea with preview in v1. A rich
text editor (Tiptap) is a later upgrade, not a v1 line item.

---

## 8. Checkout flow (Razorpay)

```
cart (localStorage)
  → POST /api/checkout/order   { items:[{productId, qty}], customer, address }
      server re-prices from the DB (never trusts client prices)
      creates Order (status=pending) + Razorpay order
  → Razorpay Checkout modal on the client
  → POST /api/checkout/webhook  (server-to-server, signature-verified)
      marks Order paid, decrements stock, sends emails
  → /orders/[orderNumber] confirmation
```

Rules: prices and totals computed server-side only; webhook is the source of
truth for "paid" (never the browser callback); webhook handler is idempotent on
`razorpayPaymentId`; every state change is logged.

**Client blockers:** Razorpay account + KYC (PAN, bank proof, GST if
registered), a refund/cancellation policy, a shipping policy, and whether
products are physical (shipping, packaging, courier) or digital.

---

## 9. Media pipeline (R2)

1. Admin picks a file → `POST /api/admin/media/sign` returns a presigned `PUT`.
2. Browser uploads straight to R2.
3. API records a `MediaAsset` and generates webp derivatives (400/800/1600px)
   with `sharp`.
4. Public reads go through the R2 custom domain; `next.config.ts`
   `remotePatterns` allows that host.

Limits enforced server-side: 5 MB, `image/*` and `application/pdf` only.

---

## 10. Email

Nodemailer over SMTP (or Resend if the client has no mailbox to send from).
Templates: booking received (to client), booking confirmation (to visitor),
prediction request received, order paid (both sides), order shipped,
enquiry received. Sending is fire-and-forget from the route handler with the
failure logged — email must never fail a request.

Needs: a sending domain with SPF/DKIM, or a Google Workspace app password.

---

## 11. Non-functional work (SRS §4)

- **SEO** — metadata per page, sitemap, robots, JSON-LD, semantic headings, canonical URLs, Lighthouse SEO ≥ 95
- **Performance** — ISR on content pages, `next/image` everywhere, font preload, LCP < 2.5s on 4G
- **Responsive** — already the home page's standard; applies to every new page and the admin tables
- **Accessibility** — 4.5:1 contrast, visible focus rings, keyboard nav, labelled form fields, `prefers-reduced-motion`
- **Security** — zod validation on every input (already the contract's job), session cookies `httpOnly`/`secure`/`sameSite`, rate limiting on public POSTs, Razorpay signature verification, no secrets in `NEXT_PUBLIC_*`, HTTPS everywhere
- **Maintainability** — the contract-first pattern already enforces this; keep one file per resource

---

## 12. Phases, and how they map to the SRS payment milestones

Estimates are working days for one developer. They assume client content and
accounts arrive on time — they usually do not, so the calendar will be longer
than the sum.

### Phase 0 — Agreement (0.5 d) · _before anything_

Change request signed for admin panel, commerce, courses, blog, email.
Client supplies: content, Razorpay KYC start, domain + DNS access, logo/brand files.

### Phase 1 — Static pages (5–6 d) → **unlocks Milestone 2 (33%)**

`/about`, `/services`, `/services/[slug]`, `/book`, `/book/thank-you`,
`/predictions`, `/contact`, policy pages. Content still from `site.ts`.
SEO scaffolding: metadata, sitemap, robots, JSON-LD.
Booking + prediction forms wired to the existing API with real validation and
error states.
_At the end of this phase the six SRS sections exist and the contracted scope
is demonstrably met._

### Phase 2 — Content in the database (4–5 d)

Prisma models finalised. Seed script migrating `site.ts` into MongoDB.
Public read endpoints + pages switched to the API with ISR.
Media pipeline (R2 + sharp + `MediaAsset`).

### Phase 3 — Admin panel (7–9 d)

Better Auth, admin layout, dashboard, bookings/predictions management,
CRUD for services/products/courses/blog/testimonials, media library, settings.

### Phase 4 — Commerce (10–13 d) · _gated on Razorpay KYC_

Cart, checkout, Razorpay orders + webhook, order records, order admin,
order confirmation page and emails, stock handling, policy pages finalised.

### Phase 5 — Courses + Blog (4–6 d)

Listings, detail pages, enquiry flow, tags, related posts, RSS.

### Phase 6 — Email, hardening, launch (4–5 d) → **unlocks Milestone 3 (34%)**

Transactional email, rate limiting, error pages, analytics (GA4 / Plausible),
accessibility and Lighthouse pass, cross-browser and device QA, production
deploy, DNS cutover, client walkthrough + handover doc.

**Total: 35–45 working days** of build, excluding client wait time.
SRS-only scope (Phases 1 + 6, trimmed) would be ~10–12 days — worth stating
plainly when the change request is discussed.

---

## 13. Deployment

| Piece      | Where                                      | Notes                                        |
| ---------- | ------------------------------------------ | -------------------------------------------- |
| `apps/web` | Vercel, root directory `apps/web`          | `NEXT_PUBLIC_API_URL` → the API's public URL |
| `apps/api` | Railway / Render / Fly (long-running Node) | `node dist/index.js`; **not** serverless     |
| MongoDB    | Atlas M0 → M10                             | Replica set is required by Prisma            |
| Media      | Cloudflare R2 + custom domain              |                                              |
| Email      | SMTP or Resend                             |                                              |

Environments: `production` plus a `staging` branch deploy for client review.

### Environment variables to add

```
# api
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASS= MAIL_FROM=
NOTIFY_EMAIL=            # where client notifications land

# web
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Every new var must also be listed in `turbo.json`'s `globalEnv`, or turbo strips
it from task environments.

---

## 14. Depends on the client

Work stalls without these — chase them in Phase 0, not when we hit them.

1. Final copy for About, Services (per service), Predictions, Courses
2. Product data: names, descriptions, **prices**, images, stock, physical vs digital
3. Real testimonials (names + permission to publish)
4. Logo files (SVG preferred) and any brand guidelines
5. Razorpay account with completed KYC
6. Refund/cancellation, shipping, privacy, and terms content (or approval of our drafts)
7. Domain + DNS access, and the mailbox email should send from
8. Decision on booking: does it need calendar availability and slot blocking, or is it a request form the client confirms manually? **Currently built as a request form.**
9. Exact prediction workflow: what the client delivers (PDF? call? written reading?) and in what timeframe

---

## 15. Risks

| Risk                                           | Impact                                          | Handling                                                                                                |
| ---------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Razorpay KYC delay                             | Blocks Phase 4 entirely                         | Start KYC in Phase 0; build against test keys                                                           |
| Content not supplied                           | Pages ship with lorem/placeholder; launch slips | Lock a content deadline per phase; ship with placeholders and a visible TODO list                       |
| Scope creep past this plan                     | Timeline and payment disputes                   | Anything not in this document is a new change request                                                   |
| ts-rest pinned to a release candidate          | A breaking change in the final 3.53 release     | Version is pinned exactly; re-test before bumping. Alternative is downgrading zod to v3 across the repo |
| Booking turns out to need real availability    | +4–6 days (calendar, slots, conflicts)          | Confirm item 8 above before Phase 1                                                                     |
| Client wants to self-edit the home page layout | Not what an admin panel does                    | Settings cover copy and contact details, not layout                                                     |

---

## 16. Open questions

1. Are products physical (shipping, courier, packaging) or digital downloads?
2. Does the practice have a GST registration? It changes invoicing and pricing display.
3. Is the booking a request form or a real calendar with availability?
4. Multi-language (Hindi) now, later, or never?
5. One admin user, or does the client want staff accounts with roles?
6. Does any of this need to run before a specific date (launch event, festival, campaign)?
