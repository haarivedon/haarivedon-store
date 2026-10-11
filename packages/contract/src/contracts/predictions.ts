import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  createPredictionSchema,
  predictionSchema,
  predictionStatuses,
} from "../schemas/prediction";
import {
  createdSchema,
  errorSchema,
  paginated,
  paginationQuerySchema,
} from "../schemas/common";

const c = initContract();

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
  list: {
    method: "GET",
    path: "/predictions",
    query: paginationQuerySchema.extend({
      status: z.enum(predictionStatuses).optional(),
    }),
    responses: {
      200: paginated(predictionSchema),
    },
    summary: "List prediction requests (admin).",
  },
  getById: {
    method: "GET",
    path: "/predictions/:id",
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: predictionSchema,
      404: errorSchema,
    },
    summary: "Fetch one prediction request (admin).",
  },
});
