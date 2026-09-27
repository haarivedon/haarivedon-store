import { Schema, model, models, type InferSchemaType } from "mongoose";

const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quote: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    location: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type Testimonial = InferSchemaType<typeof TestimonialSchema>;

export default models.Testimonial ?? model("Testimonial", TestimonialSchema);
