import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { GUIDES, loadGuide, type GuideTone } from "@/lib/content";
import { localizeDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guides");
  return pageMetadata({
    locale: await getLocale(),
    path: "/guides",
    title: t("metaTitle", { siteName: SITE_NAME }),
    description: t("metaDescription"),
  });
}

/** Each guide has its own colour block from the palette. */
export const toneClass: Record<GuideTone, string> = {
  signature: "on-signature bg-signature text-signature-ink",
  ink: "bg-ink text-paper",
  spark: "bg-spark text-spark-ink",
};

export default async function GuidesPage() {
  const locale = await getLocale();
  const t = await getTranslations("guides");
  const guides = await Promise.all(GUIDES.map(async (guide) => ({ ...guide, meta: (await loadGuide(guide.slug, locale))!.meta })));

  return (
    <div className="page py-12 md:py-16">
      <h1 className="text-display">{t("title")}</h1>
      <p className="mt-4 max-w-prose text-lead text-ink-soft">{t("intro")}</p>
      <ul className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {guides.map((guide) => (
          <li key={guide.slug} className="min-w-0">
            <Link
              href={`/guides/${guide.slug}`}
              className={cn(
                "press group flex h-full min-h-72 flex-col justify-between gap-8 rounded-block p-6 sm:p-8",
                toneClass[guide.tone],
                guide.tone === "ink" && "[--color-focus:var(--color-spark)]",
              )}
            >
              <div>
                <p className="text-small font-semibold">
                  {t("minutes", { n: localizeDigits(guide.meta.minutes ?? 3, locale) })}
                </p>
                <h2 className="mt-3 text-title">{guide.meta.title}</h2>
                <p className="mt-3">{guide.meta.description}</p>
              </div>
              <span className="inline-flex items-center gap-2 font-semibold underline decoration-2 underline-offset-4">
                {t("read")}
                <ArrowRight aria-hidden="true" className="size-5 transition-transform duration-150 ease-soft group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
