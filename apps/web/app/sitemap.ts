import type { MetadataRoute } from "next";
import { getCourses, getProducts } from "@/lib/api/content";
import { features } from "@/lib/flags";

const BASE = "https://haarivedon.com";

/**
 * Only published records appear: the API's public reads already filter them,
 * so a draft can never leak into the sitemap (docs/PLAN.md §13).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, products] = await Promise.all([getCourses(), getProducts()]);

  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/about", priority: 0.8 },
    { path: "/services", priority: 0.9 },
    { path: "/courses", priority: 0.9 },
    { path: "/products", priority: 0.9 },
    { path: "/predictions", priority: 0.8 },
    { path: "/book", priority: 0.9 },
    ...(features.blog ? [{ path: "/blog", priority: 0.6 }] : []),
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE}${route.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route.priority,
    })),
    ...courses.map((course) => ({
      url: `${BASE}/courses/${course.slug}`,
      lastModified: new Date(course.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${BASE}/products/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
