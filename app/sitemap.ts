import type { MetadataRoute } from "next";
import { getPublishedContent } from "../lib/content/repository";
import { PRODUCTION_SITE_URL } from "../lib/site-url";

const staticPaths = ["", "/about", "/legal", "/privacy"];
const locales = ["fr", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getPublishedContent();
  const projectPaths = content.projects
    .filter((project) => project.status === "published")
    .sort((a, b) => a.order - b.order)
    .map((project) => `/work/${project.slug}`);

  return locales.flatMap((locale) =>
    [...staticPaths, ...projectPaths].map((path) => ({
      url: `${PRODUCTION_SITE_URL}/${locale}${path}`,
    })),
  );
}
