import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { errorSchema } from "../schemas/common";

const c = initContract();

/**
 * Kundali delivery (CR-2).
 *
 * The PDF holds birth details, so it is never on a guessable public URL: the
 * download needs the booking id plus the one-time token handed to the person
 * who submitted the form (docs/PLAN.md §3.2).
 */
export const kundaliContract = c.router({
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
