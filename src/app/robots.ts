import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.meditationstudio.live";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/create", "/library", "/account", "/voice-lab", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
