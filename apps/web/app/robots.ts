import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin and the revalidation hook are never indexed.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://haarivedon.com/sitemap.xml",
    host: "https://haarivedon.com",
  };
}
