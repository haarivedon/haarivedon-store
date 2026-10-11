# Haarivedon — Build Plan

**Scope: the SRS, plus three approved change requests — Courses (CR-1),
Kundali PDF (CR-2), and the self-service admin platform (CR-3).**

CR-3 changes the character of the project. We are no longer authoring content:
the client enters every course, product, service and testimonial themselves,
through an admin they log into. Everything below is written to be
built in one pass — decisions are made, not listed as options, and the edge
cases are enumerated in §13.

Source of truth: _Software Requirements Specification — HAARIVEDON_, v1.0,
2 September 2026, Vedseem Technologies (client copy:
`~/Downloads/HAARIVEDON_SRS(2).docx`; identical to the v1.0 text already on
file). Every item below traces to a numbered SRS clause. Anything that does not
is listed in §4 as deferred, and is not built. The exceptions are the three
change requests in §3, each agreed separately per SRS §5.

---

## 1. Where the project stands today

| Area       | State                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo       | Turborepo monorepo: `apps/web`, `apps/api`, `packages/{contract,db,tsconfig}`                                                                     |
| Pages live | `/` only. Nav links to `/about`, `/services`, `/courses`, `/products`, `/predictions`, `/blog`, `/book` — **all 404**                             |
| Home page  | Complete: Hero, TrustStrip, About, Services, Courses, PredictionBand, BookingBand, Products, EnergyTools, WhyUs, Testimonials, Blog               |
| API        | `POST/GET /api/bookings`, `POST/GET /api/predictions`, health. Admin reads gated by a shared `ADMIN_API_KEY`                                      |
| Database   | Prisma/MongoDB. `Booking` and `PredictionRequest` in use; `Product`, `Service`, `Testimonial`, `BlogPost` exist but unused. No `Course` model yet |
| Content    | Hardcoded in `apps/web/lib/content/site.ts` — **nothing is editable by the client today**                                                         |
| Admin      | None. A shared `ADMIN_API_KEY` header is the only gate; no users, no sessions, no login screen, no uploads                                        |
| Assets     | Founder photography in `apps/web/public/images/`; product imagery still Unsplash placeholders                                                     |

The home page (SRS §3.1) is effectively done — including a `Courses` section
that currently renders three hardcoded sample courses from
`apps/web/lib/content/site.ts` and links to a `/courses` route that does not
exist. The remaining five SRS sections, and the whole Courses module, do not
exist yet.

---

## 2. What gets built (SRS §3)

| SRS  | Page                             | Contents                                                                                                        |
| ---- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| §3.1 | `/`                              | Already built. Re-point CTAs at the real pages once they exist                                                  |
| §3.2 | `/about`                         | Founder story, mission/philosophy, areas of expertise, supporting imagery                                       |
| §3.3 | `/services`                      | Service listing with descriptions, starting prices, CTA to `/book`                                              |
| §3.4 | `/book`                          | Booking form (name, mobile, date/time/place of birth) → MongoDB → on-screen confirmation. Kundali PDF is CR-2   |
| §3.5 | `/products` + `/products/[slug]` | Listing with images, descriptions, pricing; individual detail view. **Display only**. Catalogue structure below |
| §3.6 | `/predictions`                   | Prediction/readings content + request form → MongoDB                                                            |
| CR-1 | `/courses` + `/courses/[slug]`   | ~70-course catalogue: category browse, filters, detail pages, enquiry/enrolment form → MongoDB. See §3.1        |
| CR-2 | `/book`                          | Auto-generated Kundali PDF from the birth details. See §3.2                                                     |
| CR-3 | `/admin/*`                       | Login + CMS: the client authors every collection, uploads imagery, and works the submissions inbox. See §3.3    |

Plus the supporting pieces the SRS implies rather than lists: a `/contact`
route is **not** in the SRS — contact details live in the footer (§3.1), which
is already built.

### Backend (SRS §1.2, §3.4, §3.6)

The booking and prediction endpoints already exist and are typed end to end
through `packages/contract`. Work remaining:

- `GET /api/services`, `GET /api/products`, `GET /api/products/:slug` — read
  endpoints so the pages are API-driven rather than importing `site.ts`
  (SRS §1.2 requires "integration between all three layers")
- Seed script moving the existing `site.ts` service and product data into
  MongoDB (SRS §2: "database design"). Under CR-3 the seed only establishes
  **structure** — categories, families, the 70 course rows, the Rudraksha
  mukhi rows — and leaves copy, price and imagery empty for the client to fill
  in through the admin
- Write endpoints (`POST`/`PATCH`/`DELETE`) for every content collection, and
  real session auth replacing the `ADMIN_API_KEY` guard — both under CR-3
  (§3.3). The key survives only for machine use: seeds, cron, ops scripts

### Products are display-only

SRS §3.5 asks for listing, detail view, and _"structure to support future
e-commerce/cart functionality **if required**"_. That is satisfied by a
`Product` model carrying price, currency, stock and images, and by a detail
page with a clearly-marked CTA. No cart, no checkout, no payment gateway.

### Products — catalogue structure

The client supplied the energy-tool catalogue (full list in §11). It is five
families, and they do not share one flat shape:

| Family    | Depth                                                                   | Needs                                                      |
| --------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| Yantras   | Flat (Lakshmi, Kuber, …)                                                | Name, deity, purpose, size                                 |
| Gemstones | 3 tiers — precious / semi-precious / organic-and-rock, ~20 stones       | Mineral, colour, Mohs hardness, ruling planet, carat price |
| Rudraksha | 1–21 mukhi + rare conjoined forms + origin (Nepali / Indonesian)        | Mukhi, deity, ruling planet, benefit, origin, bead size    |
| Mala      | Flat, 9 types (Haldi, Kamal gatte, Vaijyanti, Tulsi, Chandan, gunja, …) | Material, bead count                                       |
| Crystals  | Flat (crystal tree, pyrite, rose quartz, amethyst, mix) + brass idols   | Stone, form, intent                                        |

Two consequences for the `Product` model, which today has only `category`:

1. **Two levels of category, not one.** Add `family` (yantra | gemstone |
   rudraksha | mala | crystal | idol) and keep `category` as the sub-tier
   (`precious` / `semi-precious` / `organic`, or `nepali` / `indonesian`).
   `/products` groups by family and filters by sub-tier.
2. **Per-family attributes.** Rather than ten nullable columns, one
   `attributes Json?` field holding the family-specific facts (mukhi, deity,
   planet, hardness, origin, bead count), rendered as a spec table on the
   detail page. The zod schema in `packages/contract` discriminates on
   `family`, so each family's attributes are still type-checked.

Rudraksha 1–21 mukhi are **21 product records**, not one with a variant
selector — each has its own deity, planet, benefit, price and detail page, and
that is also what people search for. 15–21 mukhi are ultra-rare: `inStock`
false by default, "enquire" CTA instead of a price.

The gemstone and crystal pages carry the existing disclaimer already on the
home-page Energy Tools section ("traditional & spiritual significance, not a
substitute for medical advice") — it must appear on every detail page too, not
only the home page.

Astrological claims ("worn for wealth attraction") are reproduced as
**tradition, attributed** — stated as what the practice holds, not as a
guaranteed outcome. That wording is non-negotiable for ad platforms and for the
disclaimer to mean anything.

### Non-functional (SRS §4)

| SRS category    | What it means here                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance     | SSG/ISR on every content page, `next/image`, font preload                                                                                                |
| SEO             | `generateMetadata` per page, semantic HTML, `sitemap.ts`, `robots.ts`, JSON-LD (`Organization`, `Service`, `Product`, `Course`), server-rendered content |
| Responsiveness  | Desktop / tablet / mobile on every new page, matching the home page's standard                                                                           |
| Scalability     | Already satisfied by the API + MongoDB split                                                                                                             |
| Security        | zod validation on every input (the contract does this), rate limiting on public POSTs, HTTPS, no secrets in `NEXT_PUBLIC_*`                              |
| Maintainability | Contract-first: one file per resource, one schema per payload                                                                                            |

---

## 3. Change requests

Two things outside the SRS have been asked for since v1.0. Both are priced and
scheduled separately, so the SRS milestones in §6 stay intact.

| CR   | What                                            | Cost  |
| ---- | ----------------------------------------------- | ----- |
| CR-1 | Courses catalogue (~70 courses)                 | 4–5 d |
| CR-2 | Kundali PDF generated from booking details      | 4–6 d |
| CR-3 | Admin platform — the client authors all content | 6–8 d |

CR-3 supersedes the "Admin panel + CMS" line that used to sit in §4 deferred,
and it changes CR-1: we no longer transcribe 70 courses, we ship the tool the
client transcribes them with. It is scoped as a small admin for two people —
see §3.3 and the explicit not-building list in §3.4.

### 3.1 Courses — CR-1

#### What the client supplied

A flat list of ~80 course names, which dedupes to **70 distinct courses** (the
raw list repeats Spice Remedies, Mobile numerology, Pitra Dosh, Tarot, Reiki,
Angels, and Logo silver, and names several basic/advanced pairs twice). The
full deduped catalogue is in §10, grouped into the 14 categories the build
uses. No descriptions, prices, durations, or imagery have been supplied yet —
see §7.

The practical consequence, now that CR-3 is in: **we do not enter this
content.** The seed creates 70 rows with title, slug, category, level and
`relatedSlugs` filled in and everything else blank and unpublished. The client
opens `/admin/courses`, works down the list, and each course goes live the
moment they publish it. 70 × (description, outline, duration, format, price,
image) is a real amount of client effort — days of it — but it is no longer on
our critical path, and no course appears half-finished because `published`
gates it.

#### Information architecture

| Route             | Contents                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `/courses`        | All 70, grouped by the §10 categories. Client-side filter by category and level; search by name       |
| `/courses/[slug]` | One course: title, category, level, duration, format, price, description, what's covered, enquiry CTA |

Flat `/courses/[slug]` URLs, not `/courses/[category]/[slug]` — courses move
between categories, slugs should not. Category is a filter, not a path segment.

Levels are modelled as a field, not as separate categories: `basic` /
`advanced` / `premium`. Pairs (Vedic Samudrik Shastra, Watch Analysis, Angels,
Tarot, Wealth Mastery, Panchang, Signature, Pronology, Vedic Switchwords,
Navratri, Logo) are **separate course records** linked by a `relatedSlugs`
field, so each is independently priced and enrollable while still
cross-linking on the detail page.

#### Data model

New `Course` model in `packages/db/prisma/schema.prisma`:

```prisma
model Course {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  title        String
  slug         String   @unique
  // one of the 14 §10 categories, e.g. numerology | astrology | remedies
  category     String
  // basic | advanced | premium
  level        String   @default("basic")
  // live | recorded | hybrid | workshop
  format       String   @default("live")
  summary      String   @default("")
  description  String   @default("")
  outline      String[]
  duration     String   @default("")
  language     String   @default("Hindi / English")
  price        Int?
  currency     String   @default("INR")
  image        String   @default("")
  relatedSlugs String[]
  certificate  Boolean  @default(false)
  featured     Boolean  @default(false)
  published    Boolean  @default(false)
  order        Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("courses")
}
```

`published` defaults to **false** so a course without copy never appears on the
site. The catalogue grows as the client fills rows in, with no redeploy.

A second model for the enquiry form, mirroring `Booking`:

```prisma
model CourseEnquiry {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  name       String
  email      String
  phone      String
  courseSlug String
  message    String   @default("")
  // pending | contacted | enrolled | closed
  status     String   @default("pending")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("course_enquiries")
}
```

#### API

Declared in `packages/contract/src/contracts/courses.ts`, implemented in
`apps/api/src/routes/courses.ts`, consumed through `lib/api/client.ts` — same
flow as every other resource (AGENTS.md "Adding an endpoint").

- `GET /api/courses` — published only; `?category=`, `?level=`, `?featured=`
- `GET /api/courses/:slug`
- `POST /api/course-enquiries` — public, zod-validated, rate-limited
- `GET /api/course-enquiries` — `ADMIN_API_KEY` guarded, paginated

Dates cross the wire as ISO strings through the route's `serialize()` helper,
as everywhere else.

#### Seeding

The seed script (already planned for services and products) gains the 70
courses from §10: title, slug, category, level, and `relatedSlugs` filled in;
copy, price, duration and imagery left empty and `published: false`. The
client's task becomes "work down this list in the admin" — not "send us a
document", and not "wait for us to type it in".

Seeding is idempotent: keyed on `slug`, re-running updates structure fields
only and never overwrites a field the client has edited. See §13 for the
full rule.

#### Home page

The existing `Courses` section keeps its three-card layout but switches from
the hardcoded `courses` array in `site.ts` to the API, showing
`?featured=true&limit=3`. "View All Courses" finally resolves.

#### Not included in CR-1

No cart, no payment gateway, no student login, no video hosting, no progress
tracking, no certificates issued by the site. Enquiry form → database →
the practice follows up off-site. Those are in §4 with estimates.

### 3.2 Booking fields and the Kundali PDF — CR-2

#### The confirmed field list

The client has confirmed what the booking form collects — this closes the SRS
§5 precondition for Phase 2:

| Field         | Required | Notes                                                             |
| ------------- | -------- | ----------------------------------------------------------------- |
| Name          | yes      |                                                                   |
| Mobile number | yes      | E.164-ish, `+91` default. This is now the primary contact channel |
| Date of birth | yes      | Past dates only                                                   |
| Time of birth | yes      | **Required** — a Kundali cannot be cast without it                |
| Birth place   | yes      | Must resolve to latitude, longitude and timezone, not free text   |

Changes against what is built today in `packages/contract/src/schemas/booking.ts`:

- `email` becomes **optional** — it is not in the client's list, but it is the
  only delivery channel for the PDF that isn't WhatsApp (see §9)
- `sessionType`, `preferredDate`, `preferredTime` leave the required set: the
  client's list has no session type and no appointment slot. Keep `sessionType`
  optional for routing, or drop it and simplify the model
- `dateOfBirth`, `timeOfBirth`, `birthPlace`, plus `birthLat`, `birthLng`,
  `birthTz` are added

`birthPlace` needs geocoding. Free text ("Kanpur") is not enough — Kundali
maths needs coordinates and the historical UTC offset. Either a place
autocomplete over a bundled Indian city dataset (offline, free, covers
~99% of this client's bookings) or a geocoding API (accurate everywhere,
per-call cost, another key). **Recommendation: bundled city list plus a manual
lat/lng override**, because a silent mis-geocode produces a wrong chart, which
is worse than asking.

The `Booking` Prisma model and the booking page's fields change together; the
existing `PredictionRequest` model already carries birth details and is the
shape to copy.

#### Generating the Kundali PDF

This is the part to be careful about. A Kundali is not a template fill — it is
an ephemeris calculation, and a wrong chart is worse than no chart.

Two ways to get the chart data:

| Approach                        | Pros                                                                | Cons                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Self-computed — Swiss Ephemeris | No per-call cost, no third-party dependency, full control of output | Ayanamsa, house system and dasha logic must be exactly right; the client has to verify output against their own software |
| Licensed astrology API          | Correct out of the box, dashas and yogas included, fast to ship     | Per-call cost, network dependency, their output format and their bugs                                                    |

**Recommendation: licensed API for v1.** Correctness is the whole value, and
matching a professional astrologer's own software by hand is a research task,
not a build task. Wrap it behind one module in `apps/api` so it can be swapped
for a self-computed implementation later without touching anything else.

What the PDF contains — needs client sign-off before build, since it sets the
API feature list and the page count:

- Lagna (birth) chart — **North or South Indian style?**
- Navamsa (D9) chart
- Planetary positions table: degrees, signs, nakshatras, padas
- Mahadasha / antardasha timeline
- Panchang details for the birth moment
- Yoga / dosha flags (Mangal dosha, Kaal Sarp, Pitra dosha)
- Language: Hindi, English, or both
- Haarivedon branding: cover page, palette, logo, footer contact

**Rendering.** Server-side in `apps/api`, so chart logic and API keys stay off
the client. Built with **pdfkit**, not `@react-pdf/renderer` — a deviation
from this plan: the chart grids are lines and text, which pdfkit draws
directly, and four pages of that does not justify adding React to a Node API.
Brand colours mirror the tokens in `globals.css`. The file goes to private
object storage with its key on the `Booking` record — a birth chart is
personal data and must not sit on a public URL.

**Delivery.** Download link on the confirmation screen, plus email if an
address was given. WhatsApp delivery is what the client will likely ask for
next; it needs a WhatsApp Business API account and is **not** in CR-2 (§4).

**Failure path.** Generate asynchronously after the booking is saved — never
block the form submit on a third-party API. The booking succeeds and the PDF
follows. `kundaliStatus: pending | ready | failed` on `Booking`, with failures
queued for manual handling.

#### Not included in CR-2

No written interpretation beyond the standard flags, no WhatsApp delivery, no
payment before generation, no admin UI to re-issue a PDF (an API call does it),
no matchmaking / two-chart comparison.

### 3.3 Admin platform — CR-3

The client authors their own content. Nothing user-facing stays in
`apps/web/lib/content/site.ts` except strings that are not content (nav
labels, form microcopy, the legal line).

**Sized for what this actually is**: one spiritual practice, one or two people
logging in, a few hundred to a few thousand visits a month, ~70 courses and
~60 products that change slowly. Not a multi-tenant CMS. Every decision below
picks the boring option that one freelancer can build in a fortnight and the
client can still use in two years. §3.4 lists what was deliberately left out
and why, so it does not creep back in as "shouldn't we also…".

#### Where it lives

`apps/web/app/(admin)/admin/*` — a route group in the existing web app, not a
fourth deployable. Reuses the shadcn components, brand tokens and the ts-rest
client; route groups code-split so the public bundle stays clean; one deploy,
one domain. `noindex` in the admin layout and blocked in `robots.ts`. Admin
pages are `force-dynamic`.

The admin talks to `apps/api` through the contract. It never touches Prisma
directly — that rule from AGENTS.md holds.

#### Auth

**Implemented with `node:crypto`, not Better Auth** — a deviation from this
plan, recorded with its reason. Once §3.4 trimmed the requirements to email +
password, one role, no social login and no 2FA, what remained was a password
hash and a session table; Better Auth's Prisma adapter against MongoDB is the
awkward corner of that library, so the trade was a day of adapter friction
against ~150 lines of scrypt hashing and opaque session tokens. Nothing
bespoke: scrypt with a per-user salt, tokens stored only as a SHA-256 hash,
server-side sessions so "log out everywhere" is a delete. Swapping a library
in later touches one file (`apps/api/src/routes/admin/session.ts`).

Email + password, no public sign-up. Accounts come from the seed script
(`pnpm db:seed:admin`), which doubles as the password-reset path.

| Decision | Value                                                                  |
| -------- | ---------------------------------------------------------------------- |
| Routes   | `/api/auth/*` on `apps/api`, outside the ts-rest handler               |
| Session  | Database sessions, 30-day expiry, rolling. "Log out everywhere" button |
| Cookie   | `httpOnly`, `secure`, `sameSite: lax`, domain `.haarivedon.com`        |
| Password | scrypt (`node:crypto`), per-user salt, 10-char minimum                 |
| Lockout  | 10 failed attempts per email per 15 min → 429                          |
| Reset    | Emailed link, single-use, 1-hour expiry                                |
| Roles    | **One role: admin.** Everyone who logs in can do everything            |

One role, not two. A practice with two trusted people does not need a
permission matrix, and every role check is a place to get authorization wrong.
If they hire a VA later, adding a read-only role is a day.

**The cross-origin cookie is the one real risk.** `apps/web` on Vercel and
`apps/api` on Railway are different registrable domains, so a session cookie
cannot be shared. Therefore the API is served from **`api.haarivedon.com`**,
the cookie is set on `.haarivedon.com`, CORS allows the exact web origin with
`credentials: true`, and the client sends `credentials: "include"`. This is a
DNS task, it has lead time outside our control, and it must be settled in
Phase 0. Prove it against the real host on day one of Phase 5.

#### What is editable

**Collections** — list + form, with a published toggle:

| Collection   | Model         | Rows       |
| ------------ | ------------- | ---------- |
| Courses      | `Course`      | ~70 seeded |
| Products     | `Product`     | ~60 seeded |
| Services     | `Service`     | ~6         |
| Testimonials | `Testimonial` | a handful  |
| Media        | `Media`       | uploads    |

**Page copy** — six forms, stored as `SiteContent` rows (`key` → `data Json`),
one zod schema per key driving both the form and the render:

`home.hero` · `home.featured` (which 3 courses and 4 products) ·
`about.page` · `predictions.page` · `book.page` · `site.contact`

Six keys, not fourteen. Section headings and intro blurbs that nobody will
ever rewrite stay in code; if they ask for one later it is a 20-minute change.

**Submissions** — read and triage, never authored: bookings, prediction
requests, course enquiries. List (newest first, filter by status, search),
detail, status dropdown, internal note, CSV export, and the Kundali PDF
download plus re-generate (CR-2).

#### Models added

```prisma
/// Uploaded imagery. Files live in R2; this is the index.
model Media {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  key       String   @unique            // object-storage key
  url       String                      // public CDN URL
  alt       String   @default("")
  width     Int
  height    Int
  bytes     Int
  createdAt DateTime @default(now())

  @@map("media")
}

/// Editable page copy: hero, about, predictions, book, contact, featured.
model SiteContent {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  key       String   @unique            // e.g. "home.hero"
  data      Json
  updatedAt DateTime @updatedAt

  @@map("site_content")
}
```

Two models, not six. Every content model also gains `updatedBy String` so you
can see who last touched a record — that is the whole of the audit trail, and
for two users it is enough.

#### Media pipeline

Uploads go **through the API**, not by presigned PUT. The point is not
throughput, it is that a non-technical owner uploads 8 MB phone photos: the
API verifies the real type from the file header, strips EXIF (including GPS),
auto-orients, and re-encodes to a single 1600px-wide webp. `next/image` does
the responsive variants from there, so we do not store four sizes ourselves.

| Rule       | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| Accepts    | jpeg, png, webp — sniffed from magic bytes, not the declared MIME |
| Max        | 10 MB, rejected before buffering                                  |
| Processing | `sharp`: strip EXIF, auto-orient, resize to ≤1600px, webp q80     |
| Storage    | One public-read Cloudflare R2 bucket on `cdn.haarivedon.com`      |
| Alt text   | Required before an image can be attached to a published record    |
| Delete     | Allowed, with a confirm dialog warning it may be in use           |

Kundali PDFs (CR-2) go to a **separate private bucket**. Personal documents
never share a bucket with public media. Delivery is a one-time token issued
with the booking rather than an S3 presigned URL — same property (the file is
never on a guessable URL), one less thing to configure, and it works unchanged
when storage is the local filesystem in development.

#### Write API

One pattern for all five collections — declared in
`packages/contract/src/contracts/<resource>.ts`, implemented in
`apps/api/src/routes/<resource>.ts`:

```
GET    /api/admin/<resource>        list, incl. unpublished
GET    /api/admin/<resource>/:id    one
POST   /api/admin/<resource>        create
PATCH  /api/admin/<resource>/:id    update (incl. the published toggle)
DELETE /api/admin/<resource>/:id    delete
POST   /api/admin/<resource>/reorder    bulk order update
```

Public reads stay on `/api/<resource>` and never return unpublished rows. One
session middleware guards everything under `/api/admin`, so a new admin route
cannot ship unauthenticated by accident.

Shared rules:

- **Validation** — the same zod schema as the public shape, `.partial()` for
  PATCH. Saving is permissive (title + slug); **publishing is strict** and
  returns a field-level list of what is missing, rendered as a checklist. A
  course cannot go live without a description, a price or "enquire", a
  duration and an image with alt text.
- **Stale-write guard** — PATCH sends `expectedUpdatedAt`; a mismatch returns
  `409` and the admin says "this was changed in another tab, reload". An
  hour's work that prevents silent content loss when someone leaves a tab open.
- **Publishing goes live immediately** — public pages use ISR with a 5-minute
  revalidate, and the publish action additionally calls a small
  `/api/revalidate` route on the web app with a shared secret. Worst case
  without it, the change appears within five minutes. No queue, no tag graph.

#### Editing experience

Built for one non-technical person on a laptop.

| Concern      | Decision                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rich text    | Tiptap on the three long description fields only — bold, italic, h3, lists, link. Everything else is a plain input or textarea                              |
| Sanitising   | Server-side allowlist on write. The editor is convenience, not security                                                                                     |
| Outlines     | Repeatable text rows stored as `String[]`, not rich text                                                                                                    |
| Slug         | Auto-generated from the title, editable, uniqueness checked on save. Changing one on a published record warns that existing links will break                |
| Save         | Explicit "Save" and a "Published" switch. No autosave to the server — the client decides when it is live                                                    |
| Unsaved work | `beforeunload` guard. No local draft recovery                                                                                                               |
| Preview      | "View" opens the public page; unpublished records render for a logged-in admin because the session cookie is already on the domain. No preview-token system |
| Images       | Picker with upload, recent uploads, and the alt-text field inline. Never a bare URL input                                                                   |
| Ordering     | Drag-and-drop on the list view, saved via `reorder`                                                                                                         |
| Delete       | Real delete behind a confirm dialog that names the record. Recovery is the Atlas daily snapshot                                                             |
| Errors       | Field-level messages from the zod issues the API already returns                                                                                            |
| Mobile       | Lists and the submissions inbox work at 390px. Long-form editing is laptop-first and says so                                                                |

#### Handover

- Two seeded accounts
- One recorded 45-minute walkthrough: add a course, upload an image, publish,
  work the inbox
- A one-page cheat sheet, not a manual
- The first three courses entered **together on a call** — the pattern gets
  demonstrated, not described

### 3.4 Deliberately not built

These are the things a bigger product would have. Listing them is the point:
each one was considered and dropped because this is a two-user site, and the
cheapest version that works is the right version. None is hard to add later.

| Left out                                     | Why                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Two roles / permission matrix                | Two trusted users. One `admin` role                                       |
| 2FA, breach-list checks, recovery codes      | Password + lockout + revocable sessions is proportionate here             |
| Audit log table                              | `updatedBy` on each record answers the only question they will ask        |
| Soft delete, trash, purge cron               | Confirm dialog + daily Atlas snapshots. A 30-day trash is for teams       |
| Slug-redirect table                          | A new site with no inbound links. A warning on the field is enough        |
| Idempotency keys                             | Disabling the submit button covers a double-tap                           |
| Multiple stored image variants, LQIP, dedupe | One 1600px webp and `next/image`. Saves a day and a pile of storage logic |
| Cursor pagination                            | 70 rows. Offset pagination, 25 a page                                     |
| Preview tokens                               | The admin session already proves who they are                             |
| Content versioning / rollback                | Snapshots. Rollback UI is a week on its own                               |
| Scheduled publishing                         | They publish when they are at the desk                                    |
| Page builder, multi-language                 | Structure stays ours; content is theirs (§4)                              |
| Email alerts on new submissions              | An inbox they open. Deferred in §4 at 1–2 days if they want it            |

---

## 4. Deferred — not in this build

Per SRS §5: _"Any scope beyond the six listed pages will be treated as a change
request."_ Courses, the Kundali PDF and the admin platform went through that
process and are now in (§3). The rest are parked: none is started, and none is
assumed by the phases below.

The "Admin panel + CMS" row is gone — CR-3 delivers it. **The blog stays
deferred.** CR-3 covers the five collections in §3.3; `BlogPost` is not one of
them and no `/blog` route is built. Adding it later is the 3–4 days below plus
about a day of admin CRUD, since the pattern will already exist.

| Deferred item                        | Why it is out                                                                                   | Rough cost if later requested       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| Cart, checkout, Razorpay             | SRS §3.5 says _future_ e-commerce _if required_                                                 | 10–15 days                          |
| Blog                                 | In the nav, not in the SRS, and not part of CR-3                                                | 3–4 days + ~1 day of admin CRUD     |
| Paid course checkout                 | CR-1 is a catalogue + enquiry form, not a learning platform                                     | 10–15 days                          |
| Course video hosting / LMS           | No lesson delivery, progress tracking, or student logins in CR-1                                | 15–25 days                          |
| WhatsApp delivery of the Kundali PDF | Needs a WhatsApp Business API account and template approval; not in CR-2                        | 3–5 days + per-message cost         |
| Written Kundali interpretation       | CR-2 generates charts and flags, not a reading                                                  | Not a build task — client authoring |
| Kundali matchmaking (two charts)     | Not in CR-2                                                                                     | 3–4 days                            |
| Transactional email                  | SRS §3.4 asks for a "confirmation message/notification"; an on-screen confirmation satisfies it | 2 days                              |
| Calendar availability / slot booking | SRS §3.4 describes a form, not a scheduler                                                      | 4–6 days                            |
| Email alerts on new submissions      | CR-3 ships an inbox they open, not notifications that chase them                                | 1–2 days                            |
| Content versioning / rollback        | CR-3 records who last edited a record; it does not restore an old revision                      | 4–5 days                            |
| Scheduled publishing                 | CR-3 publishes on click                                                                         | 2 days                              |
| Multi-language (Hindi) content       | Every content model would double its text fields and the admin its forms                        | 8–12 days                           |
| Page builder / drag-drop layouts     | Page structure stays ours; CR-3 gives them the content, not the layout                          | 15–25 days                          |
| Roles beyond a single `admin`        | One shared role covers a two-person practice; a read-only role is ~1 day if a VA is hired       | 1–3 days                            |

**Consequence for the nav.** `/blog` is the only link with no destination. The
Blog nav link and the home-page `Blog` section go behind an off switch in
`apps/web/lib/flags.ts` rather than being deleted — the components already
exist and a blog may well be commissioned later. `/courses` stays and lands in
Phase 3.

---

## 5. Phases

Working days for one developer. Phases 0–2, 6 and 7 map to the SRS payment
milestones (§6); Phases 3, 4 and 5 are CR-1, CR-2 and CR-3 and are billed on
their own, so a delay in one cannot hold up an SRS milestone.

No phase waits on client content any more — that is the point of CR-3.

### Phase 0 — Setup and sign-offs · 1 d

No longer "collect the content" — under CR-3 the client enters it themselves.
What has to be true before code starts:

- **DNS decision locked**: the API is served from `api.haarivedon.com`, so the
  admin session cookie works (§3.3). This gates Phase 5 and it is the one
  item with a lead time outside our control
- Booking fields are settled (§3.2); the **prediction request fields still
  need confirming** — SRS §5 makes that a precondition for Phase 2
- The §9 Kundali sign-offs started: chart style, language, PDF contents, and
  two or three verified sample charts. They gate Phase 4
- Blog nav link and home `Blog` section switched off via
  `apps/web/lib/flags.ts` — the blog is deferred (§4)
- R2 bucket, auth secret and the revalidation secret created and added
  to `turbo.json`'s `globalEnv` — otherwise turbo strips them
- Confirm in writing who the admin users are, and that the §4 deferred items
  are out of scope
  → **Milestone 1 (33%) — project initiation, already triggered**

### Phase 1 — About, Services, Products · 4–5 d

- `/about` (SRS §3.2)
- `/services` with descriptions, starting prices, CTA to `/book` (SRS §3.3)
- `/products` listing and `/products/[slug]` detail (SRS §3.5)
- Read endpoints + the structure-only seed (§3.1) for services and products.
  Pages render from the database from day one, so CR-3 has nothing to migrate
- Per-page metadata as each page lands

### Phase 2 — Booking and Predictions · 3–4 d

- `/book`: form, validation, error states, success confirmation (SRS §3.4),
  using the confirmed field list in §3.2 — name, mobile, date / time / place of
  birth. Build it with the Kundali fields from the start so Phase 4 is additive
- `/predictions`: content area + request form (SRS §3.6)
- Both already have endpoints, zod schemas, and Prisma models; this is the UI,
  the wiring, the confirmation states, and the `Booking` field changes in §3.2
- Rate limiting on both public POST routes (SRS §4 Security)
  → **Milestone 2 (33%) — mid-development: all six SRS sections exist and work**

### Phase 3 — Courses (CR-1) · 4–5 d

Independent of Phases 1–2; can run in parallel if a second developer is on it.

- `Course` + `CourseEnquiry` models, `pnpm db:generate && db:push` · 0.5 d
- Contract, routes, client wiring, admin-guarded enquiry list · 1 d
- Seed the 70 courses from §10 — titles, slugs, categories, levels,
  `relatedSlugs`, `published: false` · 0.5 d
- `/courses`: category grouping, category + level filters, name search,
  empty states · 1.5 d
- `/courses/[slug]`: detail template, outline list, related basic/advanced
  cross-links, enquiry CTA · 1 d
- Enquiry form: validation, error and success states, rate limiting · 1 d
- Home `Courses` section switched to `?featured=true`, per-page metadata,
  courses added to `sitemap.ts` · 0.5 d

Ships with whatever copy exists; unpublished rows stay invisible. The client
fills them in through the admin once Phase 5 lands — we do not transcribe
courses.
→ **CR-1, invoiced separately from the SRS milestones**

### Phase 4 — Kundali PDF (CR-2) · 4–6 d

Depends on Phase 2 (the booking form) and on the §9 sign-offs — chart style,
language, contents. Do not start before those are answered.

- Pick and sign off the chart source: licensed API vs Swiss Ephemeris · 0.5 d
  (+ client verifying two or three sample charts against their own software)
- `Booking` schema change: birth fields, geocoded coordinates, `kundaliStatus`,
  PDF key; booking form updated to match · 1 d
- Birth-place autocomplete over the bundled city dataset, manual lat/lng
  override · 0.5–1 d
- Chart module in `apps/api`: one interface, one implementation behind it · 1 d
- PDF layout: cover, charts as SVG, positions table, dasha timeline,
  branding · 1.5–2.5 d
- Object storage + signed expiring links, async generation with retry,
  failure queue · 1 d
- Email delivery of the PDF, confirmation-screen download, QA against
  10 known birth details · 0.5–1 d
  → **CR-2, invoiced separately from the SRS milestones**

### Phase 5 — Admin platform (CR-3) · 6–8 d

Ordered so the one genuinely risky thing — the session cookie across two
origins — is proven first, and so the client can start entering courses before
the rest of the admin is finished.

- **Auth · 1–1.5 d.** Session auth on the API, seeded accounts,
  login / logout / password reset, session middleware on `/api/admin/*`, Next
  middleware on `/admin/*`. Cross-subdomain cookie proven against the real
  `api.` host before anything else is written.
- **Media · 1 d.** `Media` model, upload route with magic-byte sniffing,
  `sharp` strip-EXIF + resize + webp, R2 bucket on its custom domain, the
  image-picker component with inline alt text.
- **Write API · 1–1.5 d.** The six-route pattern × five collections, publish
  validation, the `expectedUpdatedAt` guard, the revalidate call.
- **Admin shell and lists · 1–1.5 d.** Layout, nav, the generic list view
  (search, filter, offset pagination, drag-reorder), empty and error states.
- **Forms · 1.5–2 d.** One form per collection off the zod schemas, Tiptap on
  the three long fields, repeatable outline rows, slug field, publish
  checklist.
- **Page copy · 0.5 d.** `SiteContent`, the six keys, their forms, and moving
  those strings out of `site.ts`.
- **Submissions inbox · 0.5–1 d.** Bookings, predictions, enquiries: list,
  detail, status, internal note, CSV export, Kundali download and re-generate.
- **Edge-case pass and handover · 0.5–1 d.** The §13 checklist, the recorded
  walkthrough, the cheat sheet, and the first three courses entered with the
  client on a call.
  → **CR-3, invoiced separately from the SRS milestones**

### Phase 6 — SEO, performance, accessibility · 2–3 d

- `sitemap.ts`, `robots.ts`, JSON-LD (`Organization`, `Service`, `Product`,
  `Course`), OpenGraph images, canonical URLs
- Lighthouse pass: SEO ≥ 95, performance ≥ 90 on mobile
- Contrast, focus rings, keyboard navigation, labelled fields, alt text
- Cross-browser and real-device QA

### Phase 7 — Deploy and hand over · 1.5–2 d

- Production deploy: `apps/web` on Vercel, `apps/api` on a long-running Node
  host, MongoDB Atlas
- Domain + DNS cutover, HTTPS
- Analytics (GA4 or Plausible)
- Client walkthrough; short handover note covering how to request content
  changes and where submissions land
  → **Milestone 3 (34%) — final delivery**

**Total: 25–33.5 working days** — 11–14.5 for the SRS, 4–5 for CR-1, 4–6 for
CR-2, 6–8 for CR-3.

Roughly 6–7 weeks of solo work at a sane pace, including the client's own
review cycles. Phases 3, 4 and 5 do not depend on each other, so the order can
follow whatever the client wants first.

---

## 6. Deployment

| Piece          | Where                                        | Notes                                                                 |
| -------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| `apps/web`     | Vercel, root directory `apps/web`            | `haarivedon.com` + `www` redirect. Admin at `/admin`, `noindex`       |
| `apps/api`     | Railway / Render / Fly                       | `node dist/index.js`, long-running                                    |
| API hostname   | **`api.haarivedon.com`** — CNAME to the host | Required: the admin session cookie is set on `.haarivedon.com` (§3.3) |
| MongoDB        | Atlas (M0 is enough at this scale)           | Replica set required by Prisma. Daily snapshots, 7-day retention      |
| Media bucket   | Cloudflare R2, public read, custom domain    | `cdn.haarivedon.com`; added to `images.remotePatterns`                |
| Private bucket | Cloudflare R2, no public read                | Kundali PDFs only (CR-2). Signed 15-minute URLs                       |

Existing environment variables: `DATABASE_URL`, `API_PORT`, `HOST`,
`CORS_ORIGIN`, `ADMIN_API_KEY`, `NEXT_PUBLIC_API_URL`.

Added by the change requests:

| Variable                                                    | For                                    |
| ----------------------------------------------------------- | -------------------------------------- |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`                     | CR-3                                   |
| `AUTH_COOKIE_DOMAIN` (`.haarivedon.com`)                    | CR-3                                   |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | CR-3                                   |
| `R2_MEDIA_BUCKET`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_URL`     | CR-3 / CR-2                            |
| `REVALIDATE_SECRET` (shared by API and web)                 | CR-3                                   |
| `KUNDALI_API_KEY`, `KUNDALI_API_URL`                        | CR-2                                   |
| `SMTP_*` or `RESEND_API_KEY`                                | CR-3 password reset, CR-2 PDF delivery |

Any new variable must also be added to `turbo.json`'s `globalEnv`, or turbo
strips it. `CORS_ORIGIN` must list the exact web origin — with
`credentials: true` a wildcard is rejected by the browser, which is the first
thing to check if admin login works locally and not in production.

---

## 7. Depends on the client

CR-3 removes most of what used to be on this list — content is no longer a
blocker for us, it is work the client does in the admin at their own pace.
What remains genuinely blocks code:

**Blocks Phase 0 / Phase 5**

1. **DNS access, and agreement on `api.haarivedon.com`** — the admin session
   cookie depends on the API sharing the site's apex domain (§3.3)
2. **Who the admin users are**: names and email addresses. They all get the
   same single `admin` role (§3.3), so this is just who gets an account
3. Logo files (SVG preferred) and any brand guidance

**Blocks Phase 2**

4. The exact prediction request fields and the promised turnaround — **SRS §5
   precondition**
5. What the client delivers after a prediction request, so the confirmation
   copy is honest

**Blocks Phase 4**

6. **Kundali sign-offs** — chart style (North or South Indian), language,
   exact PDF contents, and two or three charts they have verified in their own
   software for us to test against
7. Paid vs free Kundali, and the delivery channel (§9)

**Does not block us, but the site stays thin without it**

8. The client entering their own courses (§10), products (§11), services,
   testimonials through the admin, with imagery. Everything they
   have not filled in stays unpublished and invisible — the site is never
   broken by missing content, only smaller
9. Permission to publish real testimonials with names
10. Which three courses are featured on the home page (a toggle in the admin)

The shift in item 8 is the whole point of CR-3: the previous version of this
plan had four content deliverables on the critical path. Now it has none.

---

## 8. Risks

| Risk                                                   | Impact                                                                | Handling                                                                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| The client never actually uses the admin               | A live site with three courses and nothing else; reads as our failure | Training, a recorded walkthrough, and the first three courses entered together on a call (§3.3). Flag it at Milestone 3 if usage is zero |
| Admin session cookie blocked across origins            | Login works locally, fails in production — a day lost late            | Proven on the real `api.` host on day one of Phase 5, before any admin UI is written                                                     |
| A non-technical client publishes a broken page         | Public site shows an empty section or an 8 MB photo                   | Strict publish validation with a field checklist, required alt text, server-side image re-encoding                                       |
| Same record edited in two tabs                         | Silent content loss                                                   | `expectedUpdatedAt` on PATCH → `409` and "reload", never a last-write-wins overwrite                                                     |
| Admin credentials weak or shared                       | Content compromise                                                    | 10-char minimum, lockout, revocable sessions, and a documented password-reset script. No 2FA — see §3.4                                  |
| Media bucket used as general file hosting              | Storage cost                                                          | Authenticated uploads only, 10 MB cap, images only, type sniffed from bytes                                                              |
| An accidental delete with no trash                     | Lost content                                                          | Confirm dialog naming the record, plus Atlas daily snapshots with one rehearsed restore. Soft delete was dropped deliberately (§3.4)     |
| CR-3 over-built for two users                          | Days spent on a permission matrix nobody needs                        | §3.4 is the written not-building list; anything on it is a change request, not an assumption                                             |
| Content not supplied on time                           | A thin site at launch, not a broken one                               | `published` gates everything; the site grows without a redeploy                                                                          |
| Booking turns out to need real availability            | +4–6 days; out of SRS scope                                           | The confirmed field list (§3.2) has no slot picker — confirm in writing that none is wanted                                              |
| Generated Kundali disagrees with the client's software | Total loss of trust in the feature                                    | Verify sample charts against their software in Phase 4 step 1, before any layout work                                                    |
| Birth place geocoded to the wrong city                 | Silently wrong charts for real clients                                | Bundled city list with explicit lat/lng shown back to the user, plus a manual override                                                   |
| Birth data is sensitive personal data                  | Privacy exposure if a PDF URL leaks                                   | Object storage is private; signed expiring links only; no chart data in logs                                                             |
| Product imagery still Unsplash at launch               | Weak credibility on the Products page                                 | The admin makes replacing an image a 30-second job; placeholders are visibly marked until then                                           |
| ts-rest pinned to a release candidate (`3.53.0-rc.1`)  | A breaking change in the final 3.53                                   | Pinned exactly; re-test before bumping. The alternative is downgrading zod to v3 repo-wide                                               |
| Scope creep from the §4 deferred list                  | Timeline and payment disputes                                         | Each one is a priced change request, per SRS §5                                                                                          |
| Course copy for 70 courses never fully arrives         | A thin catalogue at launch                                            | `published: false` by default — the site shows only what is ready, and grows without a redeploy                                          |
| CR-3 understood as "a CMS, so anything is editable"    | Endless small requests after handover                                 | §3.3 lists exactly which fields are editable; page structure and layout are explicitly not                                               |
| Client expects enrolment and payment inside CR-1       | Scope dispute at the end of Phase 3                                   | CR-1 is a catalogue + enquiry form in writing; checkout is priced in §4                                                                  |
| The 70 names hide duplicates or basic/advanced pairs   | Wrong catalogue structure, dead slugs                                 | §10 is the authoritative deduped list — client signs it off in Phase 0                                                                   |

---

## 9. Open questions

1. **Who logs in, and how many of them?** The design assumes two accounts on
   one shared `admin` role. More than about five people, or anyone outside the
   practice (a VA, an agency), is the one thing that would justify roles and
   an audit log — and that is a change request, not an assumption (§3.4)
2. Exact prediction request fields and the promised turnaround — SRS §5 precondition
3. Are products sold off-site today (WhatsApp, phone)? If so, the detail page
   CTA should say so explicitly rather than implying a cart
4. The blog is deferred and its nav link switched off (§4) — confirm that is
   what the client wants, rather than a visible "coming soon"?
5. Courses: is pricing public on the site, or "enquire for price"? Mixed is
   supported (`price` is nullable) but the default matters
6. Are courses live, recorded, or both? It changes what the detail page
   promises and whether cohort dates are needed
7. Does the §10 grouping into 14 categories match how the client sells them,
   and are the category names the ones to show on the site?
8. Any course that must not be publicly listed (invite-only, e.g. the premium
   and exclusive ones)?
9. Kundali: North Indian or South Indian chart style? Hindi, English, or both?
10. Is the Kundali PDF free with any booking, or paid? If paid, CR-2 needs a
    payment step and that is a separate change request
11. Delivery channel: email only (needs email to be collected, which the
    client's field list omits), on-screen download, or WhatsApp (deferred, §4)?
12. Does `/book` still have a session type and a preferred date/time at all, or
    is it purely a birth-details intake now? The client's list implies the
    latter — that changes the `Booking` model and the confirmation copy
13. Products: are the 15–21 mukhi Rudraksha and the precious gemstones listed
    with prices, or "enquire for price"?
14. Does the client expect to edit the **home hero and About copy** too, or
    only the collections? CR-3 assumes yes, via the six `SiteContent` keys in
    §12. The eight other page-copy blocks listed there stay in code — confirm
    that is acceptable
15. Hindi content: English only, or do they expect to publish Hindi too?
    English-only is assumed. Adding a second language later means touching
    every content model, schema and form — it is the one deferred item that is
    meaningfully cheaper to decide now than later
16. Will the client **delete** things, or only unpublish? CR-3 ships a real
    delete behind a confirm dialog, with the daily snapshot as the safety net.
    If they want an undo, soft delete plus a trash view is about a day
17. Is there existing content anywhere (an Instagram bio, a WhatsApp catalogue,
    an older site) we should import once, so they do not start from zero?

---

## 10. Course catalogue (CR-1) — 70 courses

The client's raw list carried ~80 lines; it repeats Spice Remedies, Mobile
Numerology, Pitra Dosh, Tarot, Reiki, Angels, Logo Silver, Name Numerology and
the basic/advanced pairs. This is the deduped, authoritative version — **client
signs this off in Phase 0** before seeding. `L` = level (B basic, A advanced,
P premium).

### Numerology (11)

| #   | Course                            | L   |
| --- | --------------------------------- | --- |
| 1   | Numeru Yantra                     | B   |
| 2   | Vedic Numerology                  | B   |
| 3   | Name Numerology Mastery           | A   |
| 4   | Mobile Numerology                 | B   |
| 5   | Business Mobile Numerology        | A   |
| 6   | Instant Mobile Miracle Method     | B   |
| 7   | Special Mobile PIN Research       | A   |
| 8   | Special Mobile Wallpaper Research | A   |
| 9   | Loshu Grid Mastery                | B   |
| 10  | Vedic Grid Mastery                | A   |
| 11  | Pythagorean Course                | B   |

### Pronology (3)

| #   | Course                          | L   |
| --- | ------------------------------- | --- |
| 12  | Pronology                       | B   |
| 13  | Medical Pronology               | A   |
| 14  | Advanced Professional Pronology | A   |

### Astrology (10)

| #   | Course                                 | L   |
| --- | -------------------------------------- | --- |
| 15  | Astro Basics                           | B   |
| 16  | Vedic Kundali                          | B   |
| 17  | Child Astrology                        | A   |
| 18  | Blank Chart Prediction                 | A   |
| 19  | Nadi Astrology                         | A   |
| 20  | Lal Kitab                              | A   |
| 21  | Ramal Vigyan                           | A   |
| 22  | Marriage Research & Clothes Prediction | A   |
| 23  | Event & Relationship Mastery           | A   |
| 24  | My Destiny in 2027                     | B   |

### Panchang (2)

| #   | Course                    | L   |
| --- | ------------------------- | --- |
| 25  | Panchang Course           | B   |
| 26  | Panchang Premium Workshop | P   |

### Reading & analysis (6)

| #   | Course                            | L   |
| --- | --------------------------------- | --- |
| 27  | Vedic Samudrik Shastra            | B   |
| 28  | Vedic Samudrik Shastra (Advanced) | A   |
| 29  | Mysteries of Face Reading         | B   |
| 30  | Graphology                        | B   |
| 31  | Astro Signature                   | B   |
| 32  | Signature Analysis (Advanced)     | A   |

### Watch analysis (2)

| #   | Course                    | L   |
| --- | ------------------------- | --- |
| 33  | Wrist Watch Analysis      | B   |
| 34  | Watch Analysis (Advanced) | A   |

### Logo & brand (5)

| #   | Course                    | L   |
| --- | ------------------------- | --- |
| 35  | Science of Logo Designing | B   |
| 36  | Logo Symbology            | B   |
| 37  | Logo Silver Level         | A   |
| 38  | Advanced Logo Astrology   | A   |
| 39  | Business Card Mastery     | B   |

### Remedies & rituals (13)

| #   | Course                           | L   |
| --- | -------------------------------- | --- |
| 40  | Pitra Dosh                       | B   |
| 41  | Yantra Premium                   | P   |
| 42  | Vedic Mantra                     | B   |
| 43  | Vedic Special Rituals            | A   |
| 44  | Spice Remedies                   | B   |
| 45  | Money Magnet Ritual Course       | A   |
| 46  | Sugar Jar & Lemon Spell Workshop | B   |
| 47  | Crystal Exclusive Spell          | A   |
| 48  | Knot Magical Course              | B   |
| 49  | Rudraksha Premium Course         | P   |
| 50  | Navratri Classes                 | B   |
| 51  | Navratri Premium Course          | P   |
| 52  | Diwali Special Course            | B   |

### Switchwords (4)

| #   | Course                         | L   |
| --- | ------------------------------ | --- |
| 53  | Western Switchwords            | B   |
| 54  | 21 Exclusive Vedic Switchwords | B   |
| 55  | Advanced Vedic Switchwords     | A   |
| 56  | Sequence                       | A   |

### Energy healing (5)

| #   | Course                   | L   |
| --- | ------------------------ | --- |
| 57  | Reiki Course             | B   |
| 58  | Reiki Premium Course     | P   |
| 59  | Angels Course (Basic)    | B   |
| 60  | Angels Course (Advanced) | A   |
| 61  | Angel Invoking           | A   |

### Vastu & Fengshui (2)

| #   | Course      | L   |
| --- | ----------- | --- |
| 62  | Smart Vastu | B   |
| 63  | Fengshui    | B   |

### Tarot (2)

| #   | Course                        | L   |
| --- | ----------------------------- | --- |
| 64  | Tarot Course                  | B   |
| 65  | Tarot Professional (Advanced) | A   |

### Wealth (2)

| #   | Course                  | L   |
| --- | ----------------------- | --- |
| 66  | Wealth Mastery          | B   |
| 67  | Advanced Wealth Mastery | A   |

### Other (3)

| #   | Course               | L   |
| --- | -------------------- | --- |
| 68  | Past Life Regression | A   |
| 69  | Swar Vigyan          | A   |
| 70  | Self Love            | B   |

### Not a course

**"Onboarding and roadmap — your path to success with Haarivedon"** reads as a
funnel page, not a course: it is the thing that tells a visitor which of the 70
to take. Built as a short `/courses` intro block plus a "find your course"
guide, not as a catalogue row. Confirm with the client.

### Pairs to cross-link via `relatedSlugs`

Samudrik Shastra · Watch Analysis · Angels · Tarot · Wealth Mastery · Panchang ·
Signature · Pronology · Vedic Switchwords · Navratri · Logo · Numerology grids.

---

## 11. Product catalogue (SRS §3.5)

Structure explained in §2. `family` → `category` → item. Attributes listed per
family are what the `attributes` JSON field holds and what the detail-page spec
table renders.

### Yantra

Lakshmi Yantra · Kuber Yantra. _(Client to confirm the full list — two names
supplied so far.)_
Attributes: deity, purpose, metal, size.

### Gemstone

**Precious (4)** — Diamond (Mohs 10) · Ruby (corundum, 9) · Sapphire
(corundum, 9) · Emerald (beryl, Cr/V).

**Semi-precious (9)** — Amethyst (quartz) · Aquamarine (beryl) · Citrine
(quartz) · Garnet · Opal · Peridot (olivine) · Topaz · Tourmaline · Zircon.

**Organic & rock (6)** — Amber · Pearl · Coral · Jade (nephrite / jadeite) ·
Lapis Lazuli · Turquoise.

Attributes: mineral family, colour range, Mohs hardness, ruling planet,
price basis (per carat vs per piece), certification.

### Rudraksha

**By mukhi — 21 records.** 1 Shiva/Sun · 2 Ardhanarishvara/Moon ·
3 Agni/Mars · 4 Brahma/Mercury-Jupiter · 5 Kalagni Rudra/Jupiter ·
6 Kartikeya/Mars-Venus · 7 Mahalakshmi/Venus-Saturn · 8 Ganesha/Ketu-Rahu ·
9 Durga/Rahu-Ketu · 10 Vishnu (all planets) · 11 Hanuman ·
12 Surya/Sun · 13 Indra-Kamadeva/Venus · 14 Shiva-Hanuman/Saturn ·
15–21 ultra-rare (Pashupatinath, Kubera, Narayan).

15–21 mukhi: `inStock: false`, enquire-only, no public price.

**Rare conjoined forms (4)** — Gauri Shankar · Ganesh Rudraksha · Savar ·
Trijuti.

**By origin** — Nepali (14–42 mm, deep clefts, high lustre) · Indonesian /
Java (4–25 mm, smoother lines). Origin is an attribute, not a separate
listing; a bead can exist in both and they are priced differently.

Attributes: mukhi, deity, ruling planet, traditional benefit, origin, bead
size (mm), certification.

### Mala (9)

Haldi · Kamal Gatte · Vaijyanti · Tulsi · Chandan · Red Gunja · White Gunja ·
Black Gunja · Crystal Mala.
Attributes: material, bead count (108 / 54 / 27), thread, size.

### Crystal (5)

Crystal Tree · Pyrite · Rose Quartz · Amethyst · Mixed Crystal set.
Attributes: stone, form (tree / raw / tumbled / cluster), traditional intent,
weight.

### Idol

**Brass idols** ("Brasidols" in the client's list — confirm the reading).
Attributes: deity, metal, height, weight.

### Build notes

- ~60 product records at minimum, 21 of them Rudraksha. Same data-entry
  problem as the courses, same fix: seeded with structure, `published: false`
  until the client fills in copy, price and imagery.
- Amethyst and Rose Quartz appear as both gemstones and crystals. They are
  **one record each** under `family: crystal` with a gemstone cross-link —
  not duplicates competing in search.
- Every gemstone, crystal and Rudraksha detail page carries the
  "traditional & spiritual significance, not a substitute for medical advice"
  disclaimer, and any claim is phrased as tradition, attributed.

---

## 12. Editable-content inventory (CR-3)

What moves out of `apps/web/lib/content/site.ts`, where it goes, and who owns
it afterwards. Anything not in this table is **code**, and changing it is a
development task, not a content edit. This table is the scope boundary for
CR-3 — it is what gets shown to the client and signed off.

### Collections — list + form, draft/publish

| Entity      | Client-editable fields                                                                                                                                                   | Fixed by code                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Course      | title, slug, category, level, format, summary, description, outline[], duration, language, price, currency, image, relatedSlugs, certificate, featured, order, published | the 14 categories, the 3 levels, the 4 formats |
| Product     | name, slug, family, category, description, price, currency, images[], attributes (per family), inStock, featured, order, published                                       | the 6 families, each family's attribute keys   |
| Service     | title, slug, description, icon, startingPrice, currency, order, published                                                                                                | the lucide icon set to choose from             |
| Testimonial | name, quote, rating, location, order, published                                                                                                                          | card layout                                    |
| Media       | alt text; upload and delete                                                                                                                                              | format, compression, resizing                  |

### Page copy — six forms, `SiteContent` keys

| Key                | Fields                                                                                |
| ------------------ | ------------------------------------------------------------------------------------- |
| `home.hero`        | eyebrow, heading, subheading, primary CTA label + href, secondary CTA, portrait image |
| `home.featured`    | which 3 courses and 4 products appear                                                 |
| `about.page`       | hero image, story (rich text), mission, philosophy, expertise list[], signature image |
| `predictions.page` | intro heading + body, what-you-receive list[], turnaround promise                     |
| `book.page`        | intro heading + body, confirmation message, Kundali explainer (CR-2)                  |
| `site.contact`     | phone, WhatsApp, email, address, hours, social links                                  |

Each key has a zod schema in `packages/contract/src/schemas/site-content.ts`.
The render path reads through that schema with a safe fallback, so a key that
has never been saved renders the seeded default rather than an empty section.

Six keys covers the copy that changes: the hero, the founder story, what they
promise on predictions and booking, contact details, and what is featured.

### Stays in code — a dev change, not a content edit

Section headings and intro blurbs on the Services, Products and Courses pages;
the `home.trustStrip` numbers; the "why us" points; site-wide SEO defaults;
any site-wide banner. These are set once from the client's copy during the
build and realistically never rewritten — each is a 20-minute change if they
do ask.

Also code, permanently: nav structure and labels, footer legal line, form
labels and validation messages, button microcopy, palette and typography, page
layout and section order, routes, and the medical disclaimer's **placement**
(its wording is editable, its presence is not).

---

## 13. Edge-case register — the one-shot checklist

Decisions, not questions, so development does not stop to think. Scoped to
what will actually happen on a two-user site with a few thousand visits a
month — load, scale and multi-tenant cases are not here because they are not
real here. Doubles as the QA script for Phase 5.

### Auth

| Case                                    | Behaviour                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Session expires mid-edit                | The save returns `401`; the form keeps its values and shows an inline re-login, then retries the save. Never a redirect that throws away typing |
| Logged in already, opens `/admin/login` | Redirect to `/admin`                                                                                                                            |
| Not logged in, opens a deep admin URL   | Redirect to login, then back to the URL they wanted                                                                                             |
| Reset link reused or expired            | "This link is no longer valid", with no hint whether the email exists                                                                           |
| Reset completed                         | Other sessions for that user are revoked                                                                                                        |
| Repeated failed logins                  | 10 per email per 15 min → `429` with `Retry-After`                                                                                              |
| Password forgotten and email broken     | Documented `pnpm admin:reset-password` script on the server. The realistic recovery path for a two-person practice                              |

### Slugs and links

| Case                                            | Behaviour                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Two courses with the same title                 | Slug auto-suffixed `-2`; the final value is visible before saving                                       |
| Slug typed with caps, spaces, Devanagari, emoji | Normalised — lowercase, transliterated where possible, non-alphanumerics to `-`, collapsed, 80-char cap |
| Slug already taken                              | Save rejected, naming the record that holds it                                                          |
| Slug changed on a published record              | Warned that existing links will break, and allowed. No redirect table (§3.4)                            |
| Reserved slug (`admin`, `api`, `new`)           | Rejected with the list                                                                                  |
| Unpublished or deleted record still linked      | Public URL 404s with a branded page linking the parent listing                                          |

### Publishing and content

| Case                                          | Behaviour                                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Publish with required fields missing          | `422` with a checklist of what is missing. Saving a draft stays permissive                                                                                         |
| Price left empty                              | Renders "Enquire for price", never "₹0"                                                                                                                            |
| Price set to `0`                              | Renders "Free"                                                                                                                                                     |
| Very long title                               | 90-char counter in the admin; CSS clamps to two lines wherever it renders                                                                                          |
| Text pasted from Word or a website            | Lands as plain text with headings, lists and links kept; fonts, colours and any HTML stripped. Re-sanitised server-side                                            |
| Image pasted into the rich-text field         | Blocked, pointing at the cover-image picker                                                                                                                        |
| 40 outline bullets                            | Allowed; the page shows 8 with a "show all" toggle                                                                                                                 |
| No published courses in a category            | The category does not render — no empty heading                                                                                                                    |
| A whole collection empty                      | The page shows its intro and a short "coming soon" block, never a bare page                                                                                        |
| Featured slot points at an unpublished record | Skipped and backfilled with the newest published; the admin flags it                                                                                               |
| `relatedSlugs` points at a missing course     | That link is dropped from the render, not shown dead                                                                                                               |
| Same record edited in two tabs                | Second save gets `409` and "this was changed elsewhere, reload"                                                                                                    |
| Record deleted                                | Confirm dialog naming it. Recovery is the daily snapshot                                                                                                           |
| Seed re-run after the client has edited       | Matches on `slug`, updates structural fields only (category, level, `relatedSlugs`), never overwrites a field whose value differs from the seeded original. Logged |

### Media

| Case                       | Behaviour                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 40 MB photo                | Rejected before buffering, stating the limit and the size they sent                                                          |
| HEIC from an iPhone        | Rejected with "save it as JPEG first"                                                                                        |
| PDF or SVG renamed `.jpg`  | Magic-byte sniff rejects it. SVG is never accepted                                                                           |
| Photo carrying GPS EXIF    | Stripped on ingest — a home address must not ship inside a product photo                                                     |
| Sideways photo             | Auto-oriented from EXIF before re-encoding                                                                                   |
| Alt text left empty        | Publish validation fails. "Decorative" is an explicit checkbox                                                               |
| 400px image used as a hero | Warned at upload, not blocked                                                                                                |
| Odd aspect ratio           | `object-cover`, centre-weighted. No focal-point picker                                                                       |
| Deleting an image in use   | Allowed after a confirm that says it may be in use; the public page falls back to a neutral placeholder rather than breaking |
| R2 down during upload      | `503` and "try again"; the form keeps its state                                                                              |

### Public forms

| Case                                     | Behaviour                                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Double-tapped submit                     | Button disabled on submit                                                                                                                                       |
| Bot spam                                 | Honeypot field, a timing check, and a per-IP limit of 5/hour per form. CAPTCHA only if spam actually shows up                                                   |
| Mobile number with spaces or `+91`       | Normalised to E.164 on save; an invalid one names the expected format                                                                                           |
| Birth time unknown                       | Not accepted under CR-2 — the form explains that a Kundali needs it and offers "contact us" instead                                                             |
| Birth date in the future, or 1890        | Range-validated between 1900 and today                                                                                                                          |
| Birth place not in the bundled city list | "Can't find your city?" reveals manual latitude / longitude / timezone fields                                                                                   |
| Kundali generation fails                 | The booking is still saved and confirmed; `kundaliStatus: failed`; the inbox shows a Re-generate button. No enquiry is ever lost because a third party was down |
| Kundali API slow                         | Generated in the background with three attempts; the confirmation says "your chart will be ready shortly" rather than spinning                                  |
| Confirmation page refreshed              | Keyed by booking id — shows the same state, never resubmits                                                                                                     |
| CSV export of submissions                | Audited in the server log, and no personal data in the filename                                                                                                 |

### Operations

| Case                               | Behaviour                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Publish must show on the live site | ISR revalidates every 5 minutes, and publishing calls `/api/revalidate` with a shared secret for the immediate case |
| Revalidate call fails              | The write still succeeded; the change appears within the 5-minute window. Logged, not retried in a queue            |
| API down                           | Public pages keep serving their last static render. Only the forms error                                            |
| Mongo unreachable                  | Admin shows a clear error; the public site is unaffected because it is static                                       |
| Pagination past the last page      | Empty list and a "back to first page" link                                                                          |
| A new env var is added             | Also added to `turbo.json`'s `globalEnv`, or turbo strips it (AGENTS.md)                                            |
| Backups                            | Atlas daily snapshots, 7-day retention, and one restore rehearsed before handover                                   |
| A client asks to delete their data | Admin deletes the submission; the Kundali PDF object goes with it                                                   |

### Accessibility and content safety

| Case                          | Behaviour                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client writes a medical claim | The disclaimer is non-removable on product, course and prediction pages, and a short note beside the description field asks for "tradition, attributed" phrasing |
| Rich text produces an `h1`    | Not offered — the editor starts at `h3`, so heading order stays valid                                                                                            |
| Keyboard-only admin use       | Every action reachable; dialogs trap and return focus; drag-reorder has move buttons                                                                             |
| `prefers-reduced-motion`      | Honoured in the admin as well as the public site                                                                                                                 |
