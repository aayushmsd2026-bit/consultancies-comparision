/**
 * Helpers for search engines: one way to build page titles, descriptions,
 * language links (hreflang) and structured data (JSON-LD).
 */
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { routing } from "@/i18n/routing";
import type { ConsultancyDetail } from "@/lib/types";

const OG_LOCALE: Record<string, string> = { en: "en_US", ne: "ne_NP" };

/** The full address of a page in one language. `path` starts with "/" ("/" is the home page). */
export function absoluteUrl(locale: string, path: string): string {
  return `${SITE_URL}/${locale}${path === "/" ? "" : path}`;
}

/**
 * Everything a public page tells search engines: title, description, its own
 * address (canonical), the same page in the other language (hreflang), and the
 * card shown when the link is shared.
 */
export function pageMetadata(input: { locale: string; path: string; title: string; description: string }): Metadata {
  const { locale, path, title, description } = input;
  const url = absoluteUrl(locale, path);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, path)])),
        "x-default": absoluteUrl(routing.defaultLocale, path),
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Structured data for a consultancy profile. A rating is included only from 3 approved reviews. */
export function consultancyJsonLd(consultancy: ConsultancyDetail, locale: string) {
  const head = consultancy.branches.find((branch) => branch.isHeadOffice) ?? consultancy.branches[0];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl(locale, `/consultancies/${consultancy.slug}`)}#organization`,
    name: consultancy.name,
    ...(consultancy.nameNe && locale !== "ne" && { alternateName: consultancy.nameNe }),
    url: absoluteUrl(locale, `/consultancies/${consultancy.slug}`),
    ...(consultancy.website && { sameAs: [consultancy.website] }),
    ...(head && {
      address: {
        "@type": "PostalAddress",
        ...(head.address && { streetAddress: head.address }),
        ...(head.city && { addressLocality: head.city }),
        ...(head.district && { addressRegion: head.district }),
        addressCountry: "NP",
      },
    }),
    // consultancy.score is null below 3 approved reviews, so no rating is claimed then.
    ...(consultancy.score !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(consultancy.score.toFixed(1)),
        bestRating: 5,
        worstRating: 1,
        reviewCount: consultancy.reviewCount,
      },
    }),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function websiteJsonLd(locale: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(locale, "/"),
    description,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(locale, "/consultancies")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function articleJsonLd(input: { locale: string; path: string; title: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    inLanguage: input.locale,
    mainEntityOfPage: absoluteUrl(input.locale, input.path),
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}
