import { z } from "zod";

/** Session types offered on the Book a Session page. */
export const sessionTypes = [
  "personal-consultation",
  "prediction-reading",
  "guidance-session",
  "other",
] as const;

export const bookingStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

/** The Kundali PDF is generated after the booking is saved (PLAN.md §3.2). */
export const kundaliStatuses = ["pending", "ready", "failed"] as const;

/**
 * Indian mobile numbers arrive written every which way — "+91 98765 43210",
 * "098765 43210", "9876543210". Normalise to E.164 before storage so the
 * admin inbox can be searched by number (PLAN.md §13).
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => {
    const hadPlus = value.startsWith("+");
    let digits = value.replace(/\D/g, "");

    // "098765 43210" — the domestic trunk prefix is not part of the number.
    if (!hadPlus) digits = digits.replace(/^0+/, "");

    // Bare 10 digits are Indian; anything longer already carries its country
    // code (91XXXXXXXXXX, 447..., and so on).
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  })
  .refine((value) => /^\+[1-9]\d{9,14}$/.test(value), {
    message: "Enter a 10-digit mobile number, optionally with a country code.",
  });

/** Birth dates are bounded: a typo'd year must not reach the chart maths. */
const dateOfBirthSchema = z.coerce
  .date()
  .refine((d) => d.getUTCFullYear() >= 1900, {
    message: "Please enter a date of birth after 1900.",
  })
  .refine((d) => d.getTime() <= Date.now(), {
    message: "Date of birth cannot be in the future.",
  });

/** 24-hour "HH:MM". Required — a Kundali cannot be cast without it. */
const timeOfBirthSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please enter the time as HH:MM.");

/**
 * Client -> server payload. Shared by the booking form and the API.
 *
 * Coordinates come from the bundled city list (or the manual override), not
 * from geocoding the place name server-side — a silent mis-geocode produces a
 * wrong chart, which is worse than asking (PLAN.md §3.2).
 */
export const createBookingSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  phone: phoneSchema,
  email: z.email("Please enter a valid email address.").optional(),
  sessionType: z.enum(sessionTypes).default("personal-consultation"),
  dateOfBirth: dateOfBirthSchema,
  timeOfBirth: timeOfBirthSchema,
  birthPlace: z.string().trim().min(2, "Please enter your place of birth."),
  birthLat: z.coerce.number().min(-90).max(90),
  birthLng: z.coerce.number().min(-180).max(180),
  birthTz: z.string().trim().min(1).default("Asia/Kolkata"),
  message: z.string().trim().max(1000).optional().default(""),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/** Server -> client representation. Dates are ISO strings over the wire. */
export const bookingSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  sessionType: z.enum(sessionTypes),
  dateOfBirth: z.iso.datetime(),
  timeOfBirth: z.string(),
  birthPlace: z.string(),
  birthLat: z.number(),
  birthLng: z.number(),
  birthTz: z.string(),
  message: z.string(),
  status: z.enum(bookingStatuses),
  kundaliStatus: z.enum(kundaliStatuses),
  /** True once a PDF exists; the file itself is fetched via a signed URL. */
  hasKundali: z.boolean(),
  internalNote: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Booking = z.infer<typeof bookingSchema>;

/**
 * Booking acknowledgement. Carries the download token so the confirmation
 * screen can poll for the Kundali without anyone being able to guess the URL.
 */
export const bookingCreatedSchema = z.object({
  id: z.string(),
  message: z.string(),
  kundaliToken: z.string(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatuses),
});
