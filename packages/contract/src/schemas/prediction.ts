import { z } from "zod";

export const focusAreas = [
  "career",
  "relationships",
  "health",
  "finance",
  "general",
] as const;

export const predictionStatuses = [
  "pending",
  "in-progress",
  "delivered",
] as const;

/** Client -> server payload. Shared by the predictions form and the API. */
export const createPredictionSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(20),
  dateOfBirth: z.coerce.date(),
  timeOfBirth: z.string().trim().max(10).optional().default(""),
  placeOfBirth: z.string().trim().min(2, "Please enter your place of birth."),
  focusArea: z.enum(focusAreas).default("general"),
  question: z.string().trim().max(1000).optional().default(""),
});
export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;

/** Server -> client representation. Dates are ISO strings over the wire. */
export const predictionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  dateOfBirth: z.iso.datetime(),
  timeOfBirth: z.string(),
  placeOfBirth: z.string(),
  focusArea: z.enum(focusAreas),
  question: z.string(),
  status: z.enum(predictionStatuses),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PredictionRequest = z.infer<typeof predictionSchema>;
