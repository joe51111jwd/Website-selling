import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/config";

// With v3Mode on. Unlisted and hidden paths are never added here.
const paths = ["/", "/agents", "/pricing", "/how-it-works", "/faq", "/about", "/zack", "/library", "/getstarted", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({ url: `${siteConfig.url}${p}` }));
}
