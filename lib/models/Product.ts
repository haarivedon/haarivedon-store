import { Schema, model, models, type InferSchemaType } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    image: { type: String, required: true },
    category: { type: String, trim: true, default: "sacred-objects" },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type Product = InferSchemaType<typeof ProductSchema>;

export default models.Product ?? model("Product", ProductSchema);
