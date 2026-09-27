import { Schema, model, models, type InferSchemaType } from "mongoose";

const BookingSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    sessionType: {
      type: String,
      required: true,
      enum: [
        "personal-consultation",
        "prediction-reading",
        "guidance-session",
        "other",
      ],
    },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    message: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export type Booking = InferSchemaType<typeof BookingSchema>;

export default models.Booking ?? model("Booking", BookingSchema);
