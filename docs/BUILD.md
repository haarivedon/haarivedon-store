# Build guide for agents

Task-level instructions for building the rest of this project. `docs/PLAN.md`
holds the decisions and the reasoning; this file holds the order of work, the
file list per task, and how to prove a task is done.

**Do not re-decide anything.** PLAN.md §3 records the choices and §3.4 and §4
record what is deliberately not built. If a task seems to need something on
those lists, stop and ask — it is a change request, not a missing piece.

Read `AGENTS.md` first for the stack rules. Three that get broken most often:

- A route is declared in `packages/contract` **and** implemented in
  `apps/api`. Never hand-write a `fetch` in the web app.
- `prisma` is imported in `apps/api` only. The web app goes through
  `lib/api/client.ts`.
- No hex colours in components. Use the tokens in `apps/web/app/globals.css`.

## Local setup

The repo has no `.env`. Prisma needs MongoDB **as a replica set**, so a plain
`docker run mongo` will not work:

```bash
docker run -d --name haarivedon-mongo -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec haarivedon-mongo mongosh --quiet --eval \
  'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'

cp .env.example .env            # then set:
#   DATABASE_URL="mongodb://localhost:27017/haarivedon?replicaSet=rs0&directConnection=true"
cp apps/web/.env.example apps/web/.env.local

pnpm db:push && pnpm db:seed
pnpm db:seed:places             # birth-place gazetteer, see below
pnpm dev                        # web :3000, api :4000
```

### Birth places

`pnpm db:seed:places` downloads the GeoNames gazetteer and imports it (India
by default, `COUNTRIES=IN,NP,LK` for more). ~7,000 Indian towns — every
administrative seat plus anywhere with a recorded population.

The dataset is never committed: it is tens of megabytes, changes monthly, and
carries a CC BY 4.0 attribution requirement, which the site footer satisfies.
Without running it the API falls back to ~150 bundled cities, so a fresh
checkout still works.

Two things that are easy to get wrong here, both learned the hard way:
filtering on population drops real district towns (GeoNames records 0 for
many Indian entries), and searching the display name misses anything with
diacritics — "Hoshiārpur" never matches "hoshiarpur". The importer keys on
the ASCII name, folded.

`pnpm db:seed` is idempotent and safe to re-run: it matches on `slug` and
updates structural fields only, so client edits survive (PLAN.md §13).

Products seed **unpublished** on purpose — `/products` will show its empty
state until rows are published. To get fixtures for local work, publish a few
directly rather than changing the seed's defaults.

## Verify before claiming a task is done

```bash
pnpm typecheck && pnpm lint
curl -s localhost:4000/api/<resource> | head -c 300        # new endpoints
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/<path>   # new pages
```

For a page, also check the three states by hand: populated, empty collection,
and API unreachable (stop the API — the page must still render its copy, not
500). For an endpoint, check the 404 path and that unpublished rows never
appear in a public response.

## State

| Phase | Scope                           | Status                                 |
| ----- | ------------------------------- | -------------------------------------- |
| 0     | Setup, flags, sign-offs         | code done; client sign-offs open       |
| 1     | About, Services, Products       | **done**                               |
| 2     | Book, Predictions               | **done**                               |
| 3     | Courses (CR-1)                  | **done**                               |
| 4     | Kundali PDF (CR-2)              | **done** — sample chart provider       |
| 5     | Admin platform (CR-3)           | **done**                               |
| 6     | SEO, performance, accessibility | **done** — Lighthouse pass outstanding |
| 7     | Deploy and handover             | not started                            |

What is left is not code: the §7 client sign-offs, a real chart-data provider
key, R2 credentials, the DNS decision, and the deploy itself.

### Local admin

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="a long passphrase" pnpm db:seed:admin
pnpm dev     # then sign in at http://localhost:3000/admin
```

Re-running that command resets the password of that account — the documented
recovery path, since no email delivery is configured.

### Two deviations from the plan, both recorded in PLAN.md

- **Auth is `node:crypto`, not Better Auth** (PLAN.md §3.3). scrypt hashing
  plus server-side sessions in `apps/api/src/routes/admin/session.ts`.
- **The Kundali PDF is pdfkit, not `@react-pdf/renderer`** (PLAN.md §3.2),
  so the API does not take a React dependency for four pages of lines and text.

### Known gaps

- **Chart data is a sample provider.** Set `KUNDALI_API_URL` to a licensed
  vendor and map its response in `HttpChartProvider`
  (`apps/api/src/lib/kundali/providers.ts`). Until then every PDF is stamped
  SAMPLE CHART on every page — deliberately, so a placeholder can never be
  mistaken for a real reading. This is the single biggest item before the
  feature can be shown to a client.
- **Storage is the local filesystem** unless the R2 vars are set. A host with
  an ephemeral disk will lose uploads and generated PDFs; set them before
  deploying.
- **`pnpm db:seed:places` has to be run on production too**, or the birth
  place picker falls back to ~150 bundled cities.
- **No Lighthouse run yet.** The SEO and accessibility groundwork is in; the
  measured pass belongs to Phase 7 on a real deployment.
- **Rich text is a plain textarea** with blank-line paragraphs. PLAN.md §3.3
  specifies Tiptap on the long fields; the textarea is honest about what it
  does and can be swapped without touching the data.
- **`/privacy` and `/terms` describe what the code actually does** — the
  fields collected, where they go, who sees them. They are accurate, not
  boilerplate, but they have not been reviewed by a lawyer and should be
  before launch.
- **No transactional email.** Password reset is documented as
  `pnpm db:seed:admin`; the Kundali is delivered by on-screen link only.

## What landed, and where to look

| Area               | Entry point                                             |
| ------------------ | ------------------------------------------------------- |
| Booking + Kundali  | `apps/api/src/routes/bookings.ts`, `src/lib/kundali/*`  |
| Birth-place lookup | `apps/web/lib/content/cities.ts` (156 cities, offline)  |
| Courses (CR-1)     | `apps/api/src/routes/courses.ts`, `app/courses/*`       |
| Admin auth         | `apps/api/src/routes/admin/session.ts`                  |
| Admin CRUD         | `apps/api/src/routes/admin/collection.ts` (one factory) |
| Image pipeline     | `apps/api/src/routes/admin/upload.ts`                   |
| Admin UI           | `apps/web/app/(admin)/admin/*`, `components/admin/*`    |
| Field config       | `apps/web/lib/admin/collections.ts`, `copy-fields.ts`   |
| Editable page copy | `packages/contract/src/schemas/site-content.ts`         |
| SEO                | `app/sitemap.ts`, `app/robots.ts`, `components/seo/*`   |

Two rules worth knowing before editing the admin:

1. **Never put `.default()` in an admin write schema.** A PATCH body is
   `schema.partial()`, and zod still fills a defaulted key when it is absent —
   so a default there silently resets every field the editor did not send.
   Prisma already declares column defaults, so "absent" means "leave alone".
   This bit once; the comment in `schemas/admin.ts` says so.
2. **Publish validation runs against the record as saved**, not the posted
   body, and rolls the publish back if it fails. That is why create writes a
   draft first and then flips it.
3. **There is one admin surface**, `/api/admin/*`, behind a session. The
   shared `ADMIN_API_KEY` no longer guards anything: it used to protect a
   second copy of the booking and prediction reads, which meant two doors to
   the same personal data and one of them opened with a static string.
4. **Every public list filters `published: true`.** A draft must never reach
   a public response, a sitemap or a JSON-LD block.

## Phase 6 — SEO, performance, accessibility

`sitemap.ts` and `robots.ts` (admin disallowed), JSON-LD for `Organization`,
`Service`, `Product` and `Course`, OpenGraph images, canonical URLs. Then the
accessibility floor from AGENTS.md: 4.5:1 contrast, visible focus rings,
keyboard nav, `prefers-reduced-motion`, alt text, 44px touch targets.

## Patterns to copy, not reinvent

| Need                            | Copy from                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| A public read endpoint          | `apps/api/src/routes/services.ts`                           |
| Filters + pagination            | `apps/api/src/routes/products.ts`                           |
| Loose JSON validated per family | the `serialize()` in `routes/products.ts`                   |
| A public POST intake            | `apps/api/src/routes/predictions.ts`                        |
| Page data fetching              | `apps/web/lib/api/content.ts` (5-min ISR, empty on failure) |
| Price and spec display          | `apps/web/lib/format.ts`                                    |
| Listing page shape              | `apps/web/app/products/page.tsx`                            |
| Detail page shape               | `apps/web/app/products/[slug]/page.tsx`                     |
| Section shells                  | `apps/web/components/section.tsx`                           |

Prices are whole rupees. `null` means "Enquire for price" and `0` means
"Free" — never render a bare zero. Dates cross the wire as ISO strings, and
`serialize()` in each route file is the only place a `Date` is converted.
