import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.meditationstudio.live";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    "",
    "/pricing",
    "/login",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
