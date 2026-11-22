import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/config";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments are never indexed.
  if (process.env.VERCEL_ENV !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/thanks/", "/for/", "/apply", "/setup", "/companies", "/packs/", "/workshops", "/refunds", "/app", "/admin", "/start", "/api"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
