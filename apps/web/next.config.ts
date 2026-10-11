import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** The R2 custom domain, when media is served from object storage. */
const mediaHost = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).hostname
  : null;

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source rather than a build output.
  transpilePackages: ["@repo/contract"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Media served from R2 in production.
      ...(mediaHost ? [{ protocol: "https" as const, hostname: mediaHost }] : []),
    ],
  },

  /**
   * Uploaded images are stored with a root-relative URL
   * (`/api/media/<hash>.webp`) so the same value works in the admin, on the
   * public pages and in next/image without anyone having to know which host
   * is serving it. Without R2 configured the bytes live on the API, so the
   * web app proxies that one path across — otherwise the browser resolves
   * the path against :3000, where nothing answers, and every uploaded image
   * silently fails to load.
   *
   * This is a static proxy, not business logic in Next (AGENTS.md's "no
   * Route Handlers" rule), and it stops mattering once R2_PUBLIC_URL is set
   * and stored URLs become absolute CDN links.
   */
  async rewrites() {
    return [
      {
        source: "/api/media/:file",
        destination: `${API_URL}/api/media/:file`,
      },
    ];
  },
};

export default nextConfig;
