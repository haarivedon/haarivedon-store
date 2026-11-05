<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Haarivedon — Project Architecture & Conventions

> Read this before making changes. These rules are binding for all contributors and agents.
>
> Then read **`docs/BUILD.md`** — local setup (MongoDB needs a replica set),
> what is built so far, the next task per phase, and how to verify one.
> **`docs/PLAN.md`** holds the scope and the decisions behind it: §3 the three
> change requests, §3.4 and §4 what is deliberately not built, §13 the
> edge-case decisions.

## What this is

The **Haarivedon** marketing + services website for Neelam Niranjan — a spiritual
guidance practice. A Turborepo monorepo: a Next.js frontend and a standalone
Node API on MongoDB. See the client SRS at `client_stuff/HAARIVEDON_SRS.docx`.
Scope is six sections: **Home, About, Services, Book a Session, Products,
Predictions** (plus a Blog). Reference aesthetic: `https://astroarunpandit.org/`,
refined toward a calmer, botanical look.

## Stack (do not swap without approval)

| Layer        | Choice                                                                 | Notes                                                                    |
| ------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Monorepo     | Turborepo + pnpm workspaces                                            | `apps/*` are deployables, `packages/*` are shared source.                |
| Frontend     | Next.js 16 (App Router, RSC)                                           | `apps/web`. No Route Handlers — the API is a separate app.               |
| Backend      | Hono on Node                                                           | `apps/api`. Plain HTTP; no realtime in this project.                     |
| API contract | **ts-rest** `3.53.0-rc.1`                                              | `packages/contract` is the single source of truth for every route.       |
| Language     | TypeScript (strict)                                                    | `@/*` → app root in each app. Shared presets in `packages/tsconfig`.     |
| Styling      | Tailwind CSS v4 + shadcn/ui (Base UI)                                  | shadcn `style: base-rhea` uses `@base-ui/react`, **not** Radix.          |
| Icons        | `lucide-react`                                                         | No emoji as icons.                                                       |
| Validation   | `zod` (v4)                                                             | One schema per payload, shared by the form, the contract and the server. |
| Database     | MongoDB via **Prisma** (v6)                                            | `packages/db` owns the schema and the cached client.                     |
| Fonts        | Fraunces (display) · Mulish (body) · Tangerine (signature accent only) | Loaded via `next/font/google` in `apps/web/app/layout.tsx`.              |

ts-rest is pinned to the `3.53.0-rc` line because it is the first release with
Standard Schema support — i.e. the first that works with zod v4. Stable `3.52.x`
requires zod v3. Do not downgrade one without the other.

## Directory layout

```
turbo.json                    # task graph (build/dev/lint/typecheck)
pnpm-workspace.yaml           # apps/* + packages/*
.env.example                  # DATABASE_URL, PORT, CORS_ORIGIN, ADMIN_API_KEY

apps/web/                     # Next.js frontend
  app/                        # layout.tsx, page.tsx, globals.css
  components/{ui,layout,sections}/
  lib/
    api/client.ts             # ts-rest client built from the shared contract
    content/site.ts           # marketing copy & data (single source)
    utils.ts                  # cn() helper
  .env.example                # NEXT_PUBLIC_API_URL (Next reads env from its own dir)

apps/api/                     # Hono + ts-rest
  src/
    index.ts                  # server bootstrap, graceful shutdown
    app.ts                    # Hono app: CORS, logging, ts-rest handler, error mapping
    router.ts                 # implementation of the whole contract
    routes/<resource>.ts      # one file per contract sub-router
    lib/                      # auth guard, pagination, logger
    env.ts                    # zod-validated process env

packages/contract/            # @repo/contract — the API's source of truth
  src/schemas/                # zod schemas (input + wire shapes)
  src/contracts/              # ts-rest routers, composed in contracts/index.ts
packages/db/                  # @repo/db — prisma/schema.prisma + cached PrismaClient
packages/tsconfig/            # @repo/tsconfig — base / next / node presets
```

## Conventions

- **Adding an endpoint**: declare it in `packages/contract/src/contracts/`,
  implement it in `apps/api/src/routes/`, call it from the web app through
  `lib/api/client.ts`. Never hand-write a `fetch` against the API; never declare
  a route in only one of the two places — the types will not let you.
- **Validation flow**: one zod schema in `packages/contract/src/schemas/`, used
  by the client form _and_ the contract. ts-rest validates requests before a
  handler runs; failures return `422` with `{ error, issues }` (mapped in
  `apps/api/src/app.ts`).
- **Wire shapes**: entity schemas use ISO strings for dates. Prisma records are
  converted by the `serialize()` helper in each route file — keep that the only
  place a `Date` crosses the wire.
- **DB access**: `import { prisma } from "@repo/db"` inside `apps/api` only. The
  web app never touches Prisma. After editing `schema.prisma`, run
  `pnpm db:generate` (and `pnpm db:push` to sync the database).
- **Models**: defined in `packages/db/prisma/schema.prisma` (MongoDB). Enum-like
  fields with hyphenated values (sessionType, status, focusArea) are stored as
  `String` and constrained by the zod schema.
- **Auth**: placeholder only — a shared `ADMIN_API_KEY` checked in
  `apps/api/src/lib/auth.ts` (`x-api-key` header). Replace it in that one file
  when real auth lands.
- **Color**: never hardcode hex in components. Use the tokens defined in
  `apps/web/app/globals.css` — semantic (`bg-primary`, `text-muted-foreground`)
  or brand (`bg-forest`, `text-brand`, `bg-gold`, `bg-sage`, `bg-cream`,
  `bg-ivory`, `text-terracotta`). Primary CTA = **gold**; deep sections/footer =
  **forest**.
- **Server-first**: default to Server Components; add `"use client"` only for
  interactivity (forms, carousels, menus).
- **URL-driven state**: any multi-step flow (wizards), filter, tab, or prefill
  must live in the URL — a path segment or query param, never only in component
  state. The URL is the single source of truth, so a step/filter is shareable
  by link, survives refresh, and is never lost on browser Back/Forward. Reflect
  every step change into the URL (and read it back on load), carry prefill data
  as query params (e.g. Book-a-Session `?step=`, Free-Kundli → Predictions
  `?name=&dob=…`), and gate sensitive steps with a token in the URL rather than
  a flag held in memory.
- **Accessibility floor**: 4.5:1 contrast, visible focus rings, keyboard nav,
  `prefers-reduced-motion` respected, alt text on imagery, 44px touch targets.
- **Env**: repo-root `.env` feeds the API and Prisma (validated in
  `apps/api/src/env.ts`); `apps/web/.env.local` feeds Next
  (`NEXT_PUBLIC_API_URL`). The API's port is `API_PORT`, not `PORT` — `next dev`
  reads `PORT` too and the two apps share the root `.env`. New vars must be
  added to `turbo.json`'s `globalEnv` or turbo strips them. `.env*` is
  gitignored; both locations have `.example` files.
- **Assets**: source client assets live in `client_stuff/` (gitignored — raw
  photoshoot + brand frames). Web-optimized derivatives are committed under
  `apps/web/public/images/`. Product and blog imagery are still Unsplash
  placeholders (no client assets supplied yet).

## Commands

```
pnpm dev            # web (3000) + api (4000) together
pnpm dev:web        # one app only
pnpm dev:api
pnpm build          # turbo build: prisma generate -> tsup (api) -> next build (web)
pnpm typecheck      # every workspace
pnpm lint
pnpm db:generate | db:push | db:seed | db:studio
```

## Known gaps

- `@ts-rest/open-api` still requires zod v3, so OpenAPI generation is not wired
  up. Generate it from the zod v4 schemas (`z.toJSONSchema`) if it is needed.
- `apps/web/components/ui/carousel.tsx` (shadcn-generated) trips
  `react-hooks/set-state-in-effect` in some lint configurations. Pre-existing.
- No realtime layer here (not needed for this site). The
  `../freelance-starter` template carries a ready Socket.IO setup if a future
  requirement needs one.

## Design system (from the client)

Palette and typography are fixed by the client and encoded in `globals.css`:
Herbal Green `#7FAE3B` (brand), Forest `#214A2E`, Sage `#DDE8B8`, Sacred Gold
`#F3D85B` (CTA), Soft Yellow `#FFF4BF`, Ivory `#FFFDF4` (canvas), Cream `#F5F1D8`
(alt bands), Terracotta `#B8654A` (accent, sparing), Charcoal `#20261F` (text).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
