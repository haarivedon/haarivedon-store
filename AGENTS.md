<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Haarivedon — Project Architecture & Conventions

> Read this before making changes. These rules are binding for all contributors and agents.

## What this is

The **Haarivedon** marketing + services website for Neelam Niranjan — a spiritual
guidance practice. Full-stack Next.js (frontend + backend) on MongoDB. See the
client SRS at `client_stuff/HAARIVEDON_SRS.docx`. Scope is six sections: **Home,
About, Services, Book a Session, Products, Predictions** (plus a Blog). Reference
aesthetic: `https://astroarunpandit.org/`, refined toward a calmer, botanical look.

## Stack (do not swap without approval)

| Layer      | Choice                                | Notes |
|------------|---------------------------------------|-------|
| Framework  | Next.js 16 (App Router, RSC)          | Frontend **and** backend live here — Route Handlers are the API. |
| Language   | TypeScript (strict)                   | `@/*` path alias → repo root. |
| Styling    | Tailwind CSS v4 + shadcn/ui (Base UI) | shadcn `style: base-rhea` uses `@base-ui/react`, **not** Radix. |
| Icons      | `lucide-react`                        | No emoji as icons. |
| Validation | `zod` (v4)                            | Every API input and form is validated with a shared schema. |
| Database   | MongoDB via **Prisma** (v6)           | `prisma/schema.prisma` is the source of truth; cached `PrismaClient` in `lib/db/prisma.ts`. |
| Fonts      | Fraunces (display) · Mulish (body) · Tangerine (signature accent only) | Loaded via `next/font/google` in `app/layout.tsx`. |

## Directory layout

```
prisma/
  schema.prisma         # MongoDB models (Booking, PredictionRequest, Product, ...)
app/
  layout.tsx            # fonts, metadata, <html>/<body> shell
  page.tsx              # Home / landing page
  globals.css           # Tailwind v4 theme + brand tokens (source of truth for color)
  api/<resource>/route.ts   # Route Handlers = the backend API
components/
  ui/                   # shadcn primitives (generated — avoid hand-editing)
  layout/               # SiteHeader, SiteFooter, shared chrome
  sections/             # landing page sections (Hero, Services, Products, ...)
lib/
  db/prisma.ts          # cached PrismaClient (hot-reload safe)
  validations/          # zod schemas, shared client + server
  content/site.ts       # marketing copy & data (single source; easy client edits)
  utils.ts              # cn() helper
```

## Conventions

- **Color**: never hardcode hex in components. Use the tokens defined in
  `app/globals.css` — semantic (`bg-primary`, `text-muted-foreground`) or brand
  (`bg-forest`, `text-brand`, `bg-gold`, `bg-sage`, `bg-cream`, `bg-ivory`,
  `text-terracotta`). Primary CTA = **gold**; deep sections/footer = **forest**.
- **Validation flow**: define a zod schema in `lib/validations/`, import it in
  both the client form and the Route Handler. Handlers `safeParse` and return
  `422` with `z.treeifyError` on failure.
- **DB access**: import the shared client — `import { prisma } from "@/lib/db/prisma"`
  — and use it inside Route Handlers only. Never import `prisma` into Client
  Components. After editing `schema.prisma`, run `pnpm db:generate` (and
  `pnpm db:push` to sync the database).
- **Models**: defined in `prisma/schema.prisma` (MongoDB). Enum-like fields with
  hyphenated values (sessionType, status, focusArea) are stored as `String` and
  constrained by the zod schema.
- **Server-first**: default to Server Components; add `"use client"` only for
  interactivity (forms, carousels, menus).
- **Accessibility floor**: 4.5:1 contrast, visible focus rings, keyboard nav,
  `prefers-reduced-motion` respected, alt text on imagery, 44px touch targets.
- **Env**: `DATABASE_URL` (Prisma MongoDB connection string; MongoDB needs a
  replica set). See `.env.example`. `.env*` is gitignored.
- **Assets**: source client assets live in `client_stuff/` (gitignored — raw
  photoshoot + brand frames). Web-optimized derivatives are committed under
  `public/images/` (founder portraits, zodiac wheel). Product and blog imagery
  are still Unsplash placeholders (no client assets supplied yet).

## Design system (from the client)

Palette and typography are fixed by the client and encoded in `globals.css`:
Herbal Green `#7FAE3B` (brand), Forest `#214A2E`, Sage `#DDE8B8`, Sacred Gold
`#F3D85B` (CTA), Soft Yellow `#FFF4BF`, Ivory `#FFFDF4` (canvas), Cream `#F5F1D8`
(alt bands), Terracotta `#B8654A` (accent, sparing), Charcoal `#20261F` (text).
