import { env } from "../env";
import { logger } from "./logger";

/**
 * Tells the web app to rebuild the pages a write affects.
 *
 * Public pages are statically rendered with a 5-minute revalidate floor, so
 * this is the "appear now" path rather than the only path: if the call fails
 * the change still shows up within that window, which is why there is no
 * queue and no retry (docs/PLAN.md §3.3).
 */
export function revalidate(paths: string[]): void {
  if (!env.REVALIDATE_SECRET) return;

  void fetch(`${env.WEB_URL}/api/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-revalidate-secret": env.REVALIDATE_SECRET,
    },
    body: JSON.stringify({ paths }),
    signal: AbortSignal.timeout(5000),
  })
    .then((response) => {
      if (!response.ok) {
        logger.warn("revalidate rejected", { status: response.status, paths });
      }
    })
    .catch((error) => {
      logger.warn("revalidate failed", { error: String(error), paths });
    });
}
