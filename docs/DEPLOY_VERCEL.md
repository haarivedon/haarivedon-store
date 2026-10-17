# Deploying Haarivedon to Vercel

Two Vercel projects from this one monorepo: **web** (`apps/web`, Next.js) and
**api** (`apps/api`, Hono on Vercel Functions). MongoDB runs on **Atlas**.

```
Vercel (one account/team)
├─ haarivedon-web   root: apps/web    → Next.js (auto-detected)
└─ haarivedon-api   root: apps/api    → hono/vercel function (api/index.ts)
Atlas (M0+)         DATABASE_URL (replica set — Prisma requires it)
R2 / Vercel Blob    Kundali PDFs + admin media (disk is ephemeral on Vercel)
```

## 1. Database — MongoDB Atlas

Prisma + MongoDB needs a **replica set**; Atlas gives you one by default (even
on the free M0 tier). Create a cluster, a DB user, allow network access
(`0.0.0.0/0` or Vercel's ranges), and copy the SRV string into `DATABASE_URL`:

```
mongodb+srv://USER:PASS@cluster.mongodb.net/haarivedon?retryWrites=true&w=majority
```

Then, once per environment (from a machine with that `DATABASE_URL` in the root `.env`):

```
pnpm db:push            # create collections/indexes
pnpm db:seed            # base content (idempotent)
pnpm db:seed:places     # birth-place gazetteer — REQUIRED for the booking search
pnpm db:seed:admin      # ADMIN_EMAIL + ADMIN_PASSWORD must be set
```

## 2. API project (`apps/api`)

Already wired in-repo:

- `apps/api/api/index.ts` — the function; hands requests to `createApp().fetch`.
- `apps/api/vercel.json` — rewrites every path to the function, runs
  `prisma generate` at build, Node runtime, `maxDuration: 300`.
- `schema.prisma` — `binaryTargets` now include `rhel-openssl-3.0.x` so the
  query engine ships in the serverless bundle.

In the Vercel dashboard: **New Project → this repo → Root Directory =
`apps/api`**. Framework preset: **Other** (vercel.json already sets it). Vercel
installs at the workspace root (pnpm) automatically.

### ⚠️ Required code change: background Kundali jobs

`routes/bookings.ts` and `routes/predictions.ts` start Kundali generation as
fire-and-forget (`void queueKundali(id)`). A Vercel function **freezes after the
response**, so that work won't finish. Wrap those calls so the invocation stays
alive until the job completes:

```ts
// apps/api/src/lib/background.ts
import { waitUntil } from "@vercel/functions"; // pnpm add @vercel/functions --filter api

export function runInBackground(p: Promise<unknown>) {
  p.catch(() => {});           // a background failure must never crash the request
  try { waitUntil(p); }        // Vercel: extend the invocation until p settles
  catch { /* self-hosted: the promise just runs detached */ }
}
```

Then `void queueKundali(booking.id)` → `runInBackground(queueKundali(booking.id))`
(same for predictions). Generation (external chart API + PDF + upload) fits well
within `maxDuration`. Self-hosting is unaffected — `waitUntil` throws outside a
Vercel request and we fall back to detached.

### API env vars (Vercel → Settings → Environment Variables)

| Var | Value |
| --- | --- |
| `DATABASE_URL` | Atlas SRV string |
| `CORS_ORIGIN` | the web production origin, e.g. `https://haarivedon.com` |
| `WEB_URL` | same web origin (revalidation callbacks) |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` / `AUTH_COOKIE_DOMAIN` | admin auth |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seeded admin |
| `REVALIDATE_SECRET` | shared with the web app's on-publish hook |
| `R2_*` (account, keys, buckets, `R2_PUBLIC_URL`) | **required** — disk is ephemeral |
| `KUNDALI_PROVIDER` / `KUNDALI_*` | chart engine (optional; sample if unset) |
| `RAZORPAY_KEY_ID` / `KEY_SECRET` / `WEBHOOK_SECRET` | store (optional until go-live) |

`API_PORT` / `HOST` are **not** used on Vercel. Point the Razorpay webhook at
`https://<api-domain>/api/razorpay/webhook`.

## 3. Web project (`apps/web`)

**New Project → Root Directory = `apps/web`.** Next.js is auto-detected; no code
changes. One env var:

| Var | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | the API production origin, e.g. `https://api.haarivedon.com` |

## 4. Deploy order

1. Atlas up, `DATABASE_URL` known, seeds run.
2. Deploy **api** first; note its URL; set the webhook.
3. Set `NEXT_PUBLIC_API_URL` on **web**, then deploy web. (The home page reads the
   API at build time; `lib/api/content.ts` fails soft to empty lists if the API
   is down, so build won't break — but the catalogue would be empty.)
4. Set `CORS_ORIGIN` / `WEB_URL` on api to the final web domain; redeploy api.

## Notes / caveats

- **Storage is the main gotcha.** Without `R2_*` (or a Blob swap), Kundali PDFs
  and admin uploads write to a disk that vanishes between invocations.
- **sharp / pdfkit / Prisma** run on the Node runtime (not Edge) — already the
  default for `api/` functions here.
- **Store go-live** still needs Razorpay KYC + policy pages + the webhook secret.
- If Vercel's Node runtime rejects the Web-handler default export, install
  `@hono/vercel` and `export default handle(app)` instead — same effect.
