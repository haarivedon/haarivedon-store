import { z } from "zod";
import { phoneSchema, timeZoneSchema } from "./booking";

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

/** The chart is cast after the request is saved, same as a booking. */
export const predictionKundaliStatuses = ["pending", "ready", "failed"] as const;

/** Client -> server payload. Shared by the predictions form and the API. */
export const createPredictionSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: phoneSchema,
  dateOfBirth: z.coerce
    .date()
    .refine((d) => d.getUTCFullYear() >= 1900, {
      message: "Please enter a date of birth after 1900.",
    })
    .refine((d) => d.getTime() <= Date.now(), {
      message: "Date of birth cannot be in the future.",
    }),
  // Required now that a chart is generated — a Kundali cannot be cast without it.
  timeOfBirth: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please enter the time as HH:MM."),
  placeOfBirth: z.string().trim().min(2, "Please enter your place of birth."),
  // Coordinates + zone from the city picker, so the chart is not mis-geocoded.
  birthLat: z.coerce.number().min(-90).max(90),
  birthLng: z.coerce.number().min(-180).max(180),
  birthTz: timeZoneSchema,
  focusArea: z.enum(focusAreas).default("general"),
  question: z.string().trim().max(1000).optional().default(""),
});
export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;

/**
 * Request acknowledgement. Carries the one-time download token so the
 * confirmation screen can poll for the chart without the URL being guessable.
 */
export const predictionCreatedSchema = z.object({
  id: z.string(),
  message: z.string(),
  kundaliToken: z.string(),
});

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
  /** Admin-only triage note; never rendered publicly. */
  internalNote: z.string(),
  status: z.enum(predictionStatuses),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PredictionRequest = z.infer<typeof predictionSchema>;
