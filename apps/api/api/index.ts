import { createApp } from "../src/app";

/**
 * Vercel Functions entry for the API — the serverless counterpart of
 * src/index.ts (which stays for self-hosting on a persistent Node host).
 *
 * `createApp()` returns a standard Hono app whose `app.fetch` is a Web
 * `(Request) => Response` handler — exactly what Vercel's Node runtime accepts
 * as a default export, so we hand it straight through. vercel.json rewrites
 * every path to this one function; Hono routes from the original `/api/...` URL.
 *
 * Node runtime (the default for files under `api/`), NOT Edge: the API uses
 * Prisma, sharp and pdfkit, which are Node-only.
 *
 * CAVEAT: the booking / prediction routes kick off Kundali generation as
 * fire-and-forget background work (`void queueKundali(...)`). A Vercel function
 * freezes after the response, so that work must be wrapped in `waitUntil()`
 * from `@vercel/functions` to run to completion here — see DEPLOY notes.
 */
const app = createApp();

export default function handler(
  request: Request,
): Response | Promise<Response> {
  return app.fetch(request);
}
