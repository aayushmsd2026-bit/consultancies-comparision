import type { Metadata } from "next";
import { FileWarning } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SITE_NAME } from "@/config/site";
import { loadTrustPage, type TrustPage } from "@/lib/content";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/seo";

export async function trustMetadata(page: TrustPage): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("trust");
  const { meta } = await loadTrustPage(page, locale);
  return pageMetadata({
    locale,
    path: `/${page}`,
    title: t("pageMeta", { title: meta.title, siteName: SITE_NAME }),
    description: meta.description,
  });
}

/** The shared layout of the review policy, about, privacy and terms pages. The text is in content/pages. */
export async function TrustPageView({ page }: { page: TrustPage }) {
  const locale = await getLocale();
  const t = await getTranslations("trust");
  const tNav = await getTranslations("nav");
  const { default: Content, meta } = await loadTrustPage(page, locale);

  return (
    <article className="page py-10 md:py-16">
      <Breadcrumbs items={[{ label: tNav("home"), href: "/" }, { label: meta.title }]} />
      <header className="mt-8 max-w-3xl">
        <h1 className="text-display">{meta.title}</h1>
        <p className="mt-4 text-lead text-ink-soft">{meta.description}</p>
        {meta.updated && (
          <p className="mt-4 text-small text-ink-soft">
            {t("updated", { date: formatDate(`${meta.updated}T12:00:00+05:45`, locale) })}
          </p>
        )}
        {meta.draft && (
          <p className="mt-6 flex items-start gap-3 rounded-card bg-warn-tint p-4 font-semibold text-warn">
            <FileWarning aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {t("draft")}
          </p>
        )}
      </header>
      <div className="mt-8">
        <Content />
      </div>
    </article>
  );
}
