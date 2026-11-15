/**
 * The list of guides and trust pages. The text lives in content/ as MDX files,
 * one per language. To add a guide: write the two files, then add it here.
 */
import type { ComponentType } from "react";

export type ContentMeta = {
  title: string;
  description: string;
  /** Guides only: about how long it takes to read. */
  minutes?: number;
  /** Trust pages only: true until a lawyer has checked the text. Shows a "Draft" note. */
  draft?: boolean;
  /** Trust pages only: the day the text last changed, as YYYY-MM-DD. */
  updated?: string;
};

type Module = { default: ComponentType; meta: ContentMeta };
type Loader = () => Promise<Module>;
type Entry = { en: Loader; ne: Loader };

/** The colour of a guide's opening block. One per guide, from the palette. */
export type GuideTone = "signature" | "ink" | "spark";

export const GUIDES: { slug: string; tone: GuideTone; load: Entry }[] = [
  {
    slug: "how-to-choose-a-consultancy",
    tone: "signature",
    load: {
      en: () => import("../../content/guides/en/how-to-choose-a-consultancy.mdx"),
      ne: () => import("../../content/guides/ne/how-to-choose-a-consultancy.mdx"),
    },
  },
  {
    slug: "ten-red-flags-before-you-pay",
    tone: "ink",
    load: {
      en: () => import("../../content/guides/en/ten-red-flags-before-you-pay.mdx"),
      ne: () => import("../../content/guides/ne/ten-red-flags-before-you-pay.mdx"),
    },
  },
  {
    slug: "how-to-check-registration",
    tone: "spark",
    load: {
      en: () => import("../../content/guides/en/how-to-check-registration.mdx"),
      ne: () => import("../../content/guides/ne/how-to-check-registration.mdx"),
    },
  },
];

export const TRUST_PAGES = ["review-policy", "about", "privacy", "terms"] as const;
export type TrustPage = (typeof TRUST_PAGES)[number];

const trustLoaders: Record<TrustPage, Entry> = {
  "review-policy": {
    en: () => import("../../content/pages/en/review-policy.mdx"),
    ne: () => import("../../content/pages/ne/review-policy.mdx"),
  },
  about: {
    en: () => import("../../content/pages/en/about.mdx"),
    ne: () => import("../../content/pages/ne/about.mdx"),
  },
  privacy: {
    en: () => import("../../content/pages/en/privacy.mdx"),
    ne: () => import("../../content/pages/ne/privacy.mdx"),
  },
  terms: {
    en: () => import("../../content/pages/en/terms.mdx"),
    ne: () => import("../../content/pages/ne/terms.mdx"),
  },
};

const pick = (entry: Entry, locale: string) => (locale === "ne" ? entry.ne : entry.en);

export async function loadGuide(slug: string, locale: string): Promise<(Module & { tone: GuideTone }) | null> {
  const guide = GUIDES.find((item) => item.slug === slug);
  if (!guide) return null;
  return { ...(await pick(guide.load, locale)()), tone: guide.tone };
}

export async function loadTrustPage(page: TrustPage, locale: string): Promise<Module> {
  return pick(trustLoaders[page], locale)();
}
