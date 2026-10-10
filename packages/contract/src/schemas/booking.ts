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

/** Client -> server payload. Shared by the booking form and the API. */
export const createBookingSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(20),
  sessionType: z.enum(sessionTypes),
  preferredDate: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now() - 86_400_000, {
      message: "Please choose a future date.",
    }),
  preferredTime: z.string().trim().min(1, "Please choose a preferred time."),
  message: z.string().trim().max(1000).optional().default(""),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/** Server -> client representation. Dates are ISO strings over the wire. */
export const bookingSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  sessionType: z.enum(sessionTypes),
  preferredDate: z.iso.datetime(),
  preferredTime: z.string(),
  message: z.string(),
  status: z.enum(bookingStatuses),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatuses),
});
