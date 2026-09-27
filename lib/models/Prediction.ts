import { Schema, model, models, type InferSchemaType } from "mongoose";

const PredictionRequestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    timeOfBirth: { type: String, trim: true, default: "" },
    placeOfBirth: { type: String, required: true, trim: true },
    focusArea: {
      type: String,
      enum: ["career", "relationships", "health", "finance", "general"],
      default: "general",
    },
    question: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export type PredictionRequest = InferSchemaType<typeof PredictionRequestSchema>;

export default models.PredictionRequest ??
  model("PredictionRequest", PredictionRequestSchema);
