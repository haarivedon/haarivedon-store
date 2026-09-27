import { z } from "zod";

export const predictionSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(20),
  dateOfBirth: z.coerce.date(),
  timeOfBirth: z.string().trim().max(10).optional().default(""),
  placeOfBirth: z.string().trim().min(2, "Please enter your place of birth."),
  focusArea: z
    .enum(["career", "relationships", "health", "finance", "general"])
    .default("general"),
  question: z.string().trim().max(1000).optional().default(""),
});

export type PredictionInput = z.infer<typeof predictionSchema>;
