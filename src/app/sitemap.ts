import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { GUIDES, TRUST_PAGES } from "@/lib/content";
import { getAllConsultancySlugs } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/seo";

/** Every public page, in both languages, with a link to the other language. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const consultancies = await getAllConsultancySlugs();

  const paths: { path: string; priority: number; lastModified?: string }[] = [
    { path: "/", priority: 1 },
    { path: "/consultancies", priority: 0.9 },
    { path: "/check", priority: 0.8 },
    { path: "/compare", priority: 0.5 },
    { path: "/guides", priority: 0.7 },
    ...GUIDES.map((guide) => ({ path: `/guides/${guide.slug}`, priority: 0.7 })),
    ...TRUST_PAGES.map((page) => ({ path: `/${page}`, priority: 0.3 })),
    ...consultancies.map((c) => ({ path: `/consultancies/${c.slug}`, priority: 0.8, lastModified: c.updatedAt })),
  ];

  return paths.flatMap(({ path, priority, lastModified }) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      lastModified,
      priority,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, path)])),
      },
    })),
  );
}
