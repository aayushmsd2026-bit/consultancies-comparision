import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { GUIDES, loadGuide } from "@/lib/content";
import { localizeDigits } from "@/lib/format";
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { toneClass } from "../page";

type Props = PageProps<"/[locale]/guides/[slug]">;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const guide = await loadGuide(slug, locale);
  if (!guide) return {};
  const t = await getTranslations("guides");
  return pageMetadata({
    locale,
    path: `/guides/${slug}`,
    title: t("articleMeta", { title: guide.meta.title, siteName: SITE_NAME }),
    description: guide.meta.description,
  });
}

async function Guide({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const locale = await getLocale();
  const guide = await loadGuide(slug, locale);
  if (!guide) notFound();
  const t = await getTranslations("guides");
  const tNav = await getTranslations("nav");
  const { default: Content, meta, tone } = guide;
  const others = await Promise.all(
    GUIDES.filter((item) => item.slug !== slug).map(async (item) => ({
      slug: item.slug,
      title: (await loadGuide(item.slug, locale))!.meta.title,
    })),
  );

  return (
    <article>
      <JsonLd data={articleJsonLd({ locale, path: `/guides/${slug}`, title: meta.title, description: meta.description })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: tNav("home"), url: absoluteUrl(locale, "/") },
          { name: t("title"), url: absoluteUrl(locale, "/guides") },
          { name: meta.title, url: absoluteUrl(locale, `/guides/${slug}`) },
        ])}
      />
      {/* A coloured opening block, different for each guide. */}
      <header className={cn(toneClass[tone], tone === "ink" && "[--color-focus:var(--color-spark)]")}>
        <div className="page pt-6 pb-14 md:pb-24">
          <Breadcrumbs
            className="[&_*]:text-current!"
            items={[{ label: tNav("home"), href: "/" }, { label: t("title"), href: "/guides" }, { label: meta.title }]}
          />
          <h1 className="mt-10 max-w-[18ch] text-hero md:mt-16">{meta.title}</h1>
          <p className="mt-6 max-w-prose text-lead">{meta.description}</p>
          <p className="mt-6 text-small font-semibold">
            {t("minutes", { n: localizeDigits(meta.minutes ?? 3, locale) })}
          </p>
        </div>
      </header>

      <div className="page py-10 md:py-16">
        <Content />
      </div>

      <aside aria-labelledby="more-guides" className="bg-paper-sunk py-12">
        <div className="page">
          <h2 id="more-guides" className="text-title">
            {t("more")}
          </h2>
          <ul className="mt-4 grid gap-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/guides/${other.slug}`}
                  className="inline-flex min-h-12 items-center gap-2 text-lead font-semibold underline decoration-2 underline-offset-4"
                >
                  {other.title}
                  <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </article>
  );
}

// The address is read outside any loading boundary, so the whole guide is in the first HTML.
export default async function GuidePage({ params }: Props) {
  return <Guide params={params} />;
}
