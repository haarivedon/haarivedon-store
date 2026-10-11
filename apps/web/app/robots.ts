import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Uploaded imagery is proxied through /api/media, so the blanket
        // /api/ rule was hiding every product and course photo from image
        // search. Allow that one path back.
        allow: ["/", "/api/media/"],
        // The admin and the API itself are never indexed.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://haarivedon.com/sitemap.xml",
    host: "https://haarivedon.com",
  };
}
