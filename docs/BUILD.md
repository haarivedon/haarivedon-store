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
pnpm dev                        # web :3000, api :4000
```

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

| Phase | Scope                           | Status                                |
| ----- | ------------------------------- | ------------------------------------- |
| 0     | Setup, flags, sign-offs         | code done; client sign-offs open      |
| 1     | About, Services, Products       | **done**                              |
| 2     | Book, Predictions               | next — blocked on PLAN.md §7 item 4   |
| 3     | Courses (CR-1)                  | not started                           |
| 4     | Kundali PDF (CR-2)              | not started — blocked on §7 items 6–7 |
| 5     | Admin platform (CR-3)           | not started — blocked on §7 item 1    |
| 6     | SEO, performance, accessibility | not started                           |
| 7     | Deploy and handover             | not started                           |

Phase 1 landed: `Product` gained `family` / `attributes` / `images` /
`published`, `Service` gained `summary` / `highlights` / `published`, public
read endpoints for both, the structure-only seed (61 products, 4 services),
and `/about`, `/services`, `/products`, `/products/[slug]`. The site chrome
moved to `app/layout.tsx`, and the blog sits behind `apps/web/lib/flags.ts`.

## Phase 2 — Book and Predictions

Blocked on the exact prediction fields (§7 item 4). The booking half is not
blocked: §3.2 has the confirmed field list.

1. **Schema** — `packages/db/prisma/schema.prisma`. `Booking` gains
   `dateOfBirth`, `timeOfBirth`, `birthPlace`, `birthLat`, `birthLng`,
   `birthTz`, and `kundaliStatus` (`pending | ready | failed`) so Phase 4 is
   additive. `email` becomes optional; `sessionType`, `preferredDate` and
   `preferredTime` leave the required set. `pnpm db:generate && pnpm db:push`.
2. **Contract** — `packages/contract/src/schemas/booking.ts`. Mirror the field
   changes. Mobile normalises to E.164 before storage; date of birth is bounded
   between 1900 and today; time of birth is required (§13).
3. **API** — `apps/api/src/routes/bookings.ts` follows the existing
   `serialize()` pattern. Add the rate limit to both public POSTs.
4. **Pages** — `app/book/page.tsx` and `app/predictions/page.tsx`. Client
   components for the forms, zod resolver off the shared schema, field-level
   errors from the API's 422 `issues`, and a confirmation state keyed by the
   returned id so a refresh does not resubmit.
5. **Birth place** — bundled Indian city list with a manual lat/lng/timezone
   override behind a "can't find your city?" disclosure (§3.2). Do not add a
   geocoding API.

## Phase 3 — Courses (CR-1)

1. `Course` and `CourseEnquiry` models exactly as written in PLAN.md §3.1.
2. Seed the 70 courses from PLAN.md §10: title, slug, category, level and
   `relatedSlugs` only, `published: false`. Extend
   `packages/db/prisma/seed-data.ts` the way the product rows are built there.
3. Contract + routes for `GET /api/courses`, `GET /api/courses/:slug`,
   `POST /api/course-enquiries`, and the admin-guarded enquiry list.
4. `/courses` groups by the 14 categories with client-side category and level
   filters over an already-loaded index — no request per filter click. Flat
   `/courses/[slug]` URLs.
5. Detail page cross-links basic/advanced pairs through `relatedSlugs`,
   dropping any link whose target is missing or unpublished.
6. Switch the home `Courses` section from the hardcoded `courses` array in
   `lib/content/site.ts` to `?featured=true`.

## Phase 4 — Kundali PDF (CR-2)

Do not start before the §7 item 6 sign-offs (chart style, language, contents,
and verified sample charts). Order matters here:

1. Chart source behind one module in `apps/api` — licensed API for v1, swappable
   later. Verify against the client's sample charts **before** any layout work.
2. PDF with `@react-pdf/renderer`, charts drawn as SVG, brand tokens reused.
3. Private R2 bucket, signed 15-minute URLs, key stored on `Booking`.
4. Generation is async with three attempts. A failure must still leave a saved,
   confirmed booking and a Re-generate action in the admin (§13).

## Phase 5 — Admin platform (CR-3)

Follow PLAN.md §3.3 and the phase breakdown in §5 in that order. The first task
is the only risky one: prove the Better Auth session cookie works from
`apps/web` against the real `api.` subdomain before writing any admin UI. If
the DNS decision (§7 item 1) has not happened, do not start Phase 5.

Collections are courses, products, services, testimonials, media — **not
blog** (§4). Page copy is the six `SiteContent` keys in §12, not fourteen.

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
