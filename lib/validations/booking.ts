import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(20),
  sessionType: z.enum([
    "personal-consultation",
    "prediction-reading",
    "guidance-session",
    "other",
  ]),
  preferredDate: z.coerce.date().refine((d) => d.getTime() > Date.now() - 86_400_000, {
    message: "Please choose a future date.",
  }),
  preferredTime: z.string().trim().min(1, "Please choose a preferred time."),
  message: z.string().trim().max(1000).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;
