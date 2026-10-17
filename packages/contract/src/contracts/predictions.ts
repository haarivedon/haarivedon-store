import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  createPredictionSchema,
  predictionCreatedSchema,
} from "../schemas/prediction";
import { errorSchema } from "../schemas/common";

const c = initContract();

/** Public intake only — the inbox lives under /api/admin (see bookings). */
export const predictionsContract = c.router({
  create: {
    method: "POST",
    path: "/predictions",
    body: createPredictionSchema,
    responses: {
      201: predictionCreatedSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Submit a prediction / reading request.",
  },
  status: {
    method: "GET",
    path: "/predictions/:id/status",
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
    summary: "Poll whether a prediction request's chart PDF is ready.",
  },
});
