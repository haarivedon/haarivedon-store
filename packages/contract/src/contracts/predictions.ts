import { initContract } from "@ts-rest/core";
import { createPredictionSchema } from "../schemas/prediction";
import { createdSchema, errorSchema } from "../schemas/common";

const c = initContract();

/** Public intake only — the inbox lives under /api/admin (see bookings). */
export const predictionsContract = c.router({
  create: {
    method: "POST",
    path: "/predictions",
    body: createPredictionSchema,
    responses: {
      201: createdSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Submit a prediction / reading request.",
  },
});
