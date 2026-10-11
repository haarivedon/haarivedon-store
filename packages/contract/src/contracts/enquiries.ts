import { initContract } from "@ts-rest/core";
import { createEnquirySchema } from "../schemas/enquiry";
import { createdSchema, errorSchema } from "../schemas/common";

const c = initContract();

/** Public intake for "ask about this course / product". */
export const enquiriesContract = c.router({
  create: {
    method: "POST",
    path: "/enquiries",
    body: createEnquirySchema,
    responses: {
      201: createdSchema,
      404: errorSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Ask about a specific course or product.",
  },
});
