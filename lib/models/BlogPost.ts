import { Schema, model, models, type InferSchemaType } from "mongoose";

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    coverImage: { type: String, required: true },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export type BlogPost = InferSchemaType<typeof BlogPostSchema>;

export default models.BlogPost ?? model("BlogPost", BlogPostSchema);
