# Haarivedon

Turborepo monorepo: a Next.js site and a standalone typed API.

| Workspace           | What it is                                                 | Port |
| ------------------- | ---------------------------------------------------------- | ---- |
| `apps/web`          | Next.js 16 frontend                                        | 3000 |
| `apps/api`          | Hono + ts-rest REST API                                    | 4000 |
| `packages/contract` | ts-rest contract + zod schemas — the API's source of truth | —    |
| `packages/db`       | Prisma schema and cached client (MongoDB)                  | —    |
| `packages/tsconfig` | shared TypeScript presets                                  | —    |

## Setup

```bash
pnpm install
cp .env.example .env                       # DATABASE_URL, API_PORT, CORS_ORIGIN, ADMIN_API_KEY
cp apps/web/.env.example apps/web/.env.local   # NEXT_PUBLIC_API_URL
pnpm db:generate
pnpm dev
```

`pnpm dev` runs both apps. The web app talks to the API over
`NEXT_PUBLIC_API_URL`; nothing is proxied through Next.

## How a route gets added

1. Declare it in `packages/contract/src/contracts/<resource>.ts` (path, method,
   zod body/query/params, response per status).
2. Implement it in `apps/api/src/routes/<resource>.ts` — the handler signature
   is derived from the contract, so a mismatch is a type error.
3. Call it from the web app:

```ts
import { api } from "@/lib/api/client";

const res = await api.bookings.create({ body: form });
if (res.status === 201) router.push(`/thanks/${res.body.id}`);
```

## Scripts

| Command                                        | Does                                                  |
| ---------------------------------------------- | ----------------------------------------------------- |
| `pnpm dev`                                     | both apps in watch mode                               |
| `pnpm dev:web` / `pnpm dev:api`                | one app                                               |
| `pnpm build`                                   | `prisma generate` → `tsup` (api) → `next build` (web) |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | across every workspace                                |
| `pnpm db:generate` / `db:push` / `db:studio`   | Prisma, against the root `.env`                       |

## Deploying

- `apps/api` → any Node host (Railway, Fly, Render, a VM). `pnpm build` emits
  `apps/api/dist/index.js`; run it with `node dist/index.js`.
- `apps/web` → Vercel (root directory `apps/web`), or the same Node host.

Conventions and architecture rules live in [AGENTS.md](./AGENTS.md).
