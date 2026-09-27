import { Schema, model, models, type InferSchemaType } from "mongoose";

const ServiceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, default: "sparkles" },
    startingPrice: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Service = InferSchemaType<typeof ServiceSchema>;

export default models.Service ?? model("Service", ServiceSchema);
