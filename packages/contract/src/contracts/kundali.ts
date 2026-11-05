import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { errorSchema } from "../schemas/common";
import {
  kundaliPreviewInputSchema,
  kundaliPreviewSchema,
} from "../schemas/prediction";

const c = initContract();

/**
 * Kundali delivery (CR-2).
 *
 * The PDF holds birth details, so it is never on a guessable public URL: the
 * download needs the booking id plus the one-time token handed to the person
 * who submitted the form (docs/PLAN.md §3.2).
 */
export const kundaliContract = c.router({
  /**
   * Free instant summary for the public "Get a Free Kundli" flow. Computed
   * synchronously from the configured provider and never persisted — the
   * detailed PDF and a booking are offered as the next step.
   */
  preview: {
    method: "POST",
    path: "/kundali/preview",
    body: kundaliPreviewInputSchema,
    responses: {
      200: kundaliPreviewSchema,
      422: errorSchema,
      429: errorSchema,
      503: errorSchema,
    },
    summary: "Compute a free instant Kundli summary (no PDF, not saved).",
  },
  status: {
    method: "GET",
    path: "/kundali/:id/status",
    pathParams: z.object({ id: z.string() }),
    query: z.object({ token: z.string().min(1) }),
    responses: {
      200: z.object({
        status: z.enum(["pending", "ready", "failed"]),
        /** Present when ready; relative to the API base URL. */
        downloadPath: z.string().nullable(),
      }),
      404: errorSchema,
    },
    summary: "Poll whether a booking's Kundali PDF is ready.",
  },
});
