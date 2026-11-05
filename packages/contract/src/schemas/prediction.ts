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
 * Free instant Kundli (teaser). Just the birth details — no email, phone or
 * question. The result is computed synchronously and never saved; it is the
 * public "Get a Free Kundli" summary that precedes the detailed PDF / booking.
 */
export const kundaliPreviewInputSchema = createPredictionSchema.pick({
  name: true,
  dateOfBirth: true,
  timeOfBirth: true,
  placeOfBirth: true,
  birthLat: true,
  birthLng: true,
  birthTz: true,
});
export type KundaliPreviewInput = z.infer<typeof kundaliPreviewInputSchema>;

const signRef = z.object({ sign: z.number().int().min(1).max(12), name: z.string() });

/** Server -> client shape of the free summary. A subset of the full chart. */
export const kundaliPreviewSchema = z.object({
  /** True when the built-in placeholder provider produced it (indicative only). */
  sample: z.boolean(),
  source: z.string(),
  ascendant: signRef,
  moon: signRef,
  sun: signRef,
  nakshatra: z.string(),
  panchang: z.object({
    tithi: z.string(),
    nakshatra: z.string(),
    yoga: z.string(),
    karana: z.string(),
    weekday: z.string(),
  }),
  currentDasha: z
    .object({ lord: z.string(), start: z.string(), end: z.string() })
    .nullable(),
  flags: z.array(
    z.object({ label: z.string(), present: z.boolean(), note: z.string() }),
  ),
  /** A few ready-to-read lines summarising the chart. */
  highlights: z.array(z.string()),
});
export type KundaliPreview = z.infer<typeof kundaliPreviewSchema>;

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
