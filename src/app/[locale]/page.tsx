import type { Metadata } from "next";
import { ArrowRight, PenLine, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { ConsultancyCard } from "@/components/consultancy/consultancy-card";
import { ConsultancySearch } from "@/components/consultancy/consultancy-search";
import { CountryTabs } from "@/components/home/country-tabs";
import { HeroBlocks } from "@/components/home/hero-blocks";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ReviewCard } from "@/components/ui/review-card";
import { FEATURED_COUNTRIES } from "@/config/countries";
import { Link } from "@/i18n/navigation";
import { getLatestReviews, getSiteStats, getTopRatedByCountry } from "@/lib/data/public";
import { formatDate } from "@/lib/dates";
import { localizeDigits } from "@/lib/format";
import { pageMetadata, websiteJsonLd } from "@/lib/seo";
import { SITE_NAME } from "@/config/site";

/** Below this many reviews the big numbers would look empty, so we hide them. */
const MIN_REVIEWS_FOR_FACTS = 10;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("meta");
  return pageMetadata({ locale, path: "/", title: t("title", { siteName: SITE_NAME }), description: t("description") });
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const tMeta = await getTranslations("meta");
  const tCountry = await getTranslations("countries");

  const [stats, latest, topLists] = await Promise.all([
    getSiteStats(),
    getLatestReviews(locale, 4),
    Promise.all(
      FEATURED_COUNTRIES.map(async (code) => ({ code, items: await getTopRatedByCountry(code, locale, 4) })),
    ),
  ]);
  const topWithData = topLists.filter((list) => list.items.length > 0);

  return (
    <>
      <JsonLd data={websiteJsonLd(locale, tMeta("description"))} />
      {/* 1. Hero: one giant line and the search field. Nothing else above the fold. */}
      <section className="on-signature relative overflow-hidden bg-signature text-signature-ink">
        <HeroBlocks />
        <div className="page relative flex min-h-[min(78svh,46rem)] flex-col justify-center py-16 md:py-24">
          <h1 className="max-w-[11ch] text-hero">{t("heroTitle")}</h1>
          <p className="mt-6 max-w-md text-lead">{t("heroBody")}</p>
          <div className="mt-8 max-w-2xl">
            <ConsultancySearch size="hero" />
          </div>
          <p className="mt-4">
            <Link
              href="/check"
              className="inline-flex min-h-12 items-center gap-2 font-semibold underline decoration-2 underline-offset-4"
            >
              <ShieldCheck aria-hidden="true" className="size-5 shrink-0" />
              {t("checkLink")}
            </Link>
          </p>
        </div>
      </section>

      {/* 2. Three large facts. Hidden until there is enough real data. */}
      {stats.reviews >= MIN_REVIEWS_FOR_FACTS && (
        <section aria-labelledby="facts-title" className="py-section">
          <div className="page">
            <h2 id="facts-title" className="sr-only">
              {t("factsTitle")}
            </h2>
            <dl className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
              {(
                [
                  ["reviews", stats.reviews],
                  ["consultancies", stats.consultancies],
                  ["verified", stats.verifiedReviews],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="flex flex-col-reverse gap-2">
                  <dt className="text-lead text-ink-soft">{t(`facts.${key}`)}</dt>
                  <dd className="font-display text-numeral font-semibold text-signature-graphic">
                    <CountUp value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* 3. How it works. Each step appears as it scrolls into view. */}
      <section aria-labelledby="how-title" className="bg-paper-sunk py-section">
        <div className="page">
          <h2 id="how-title" className="text-display">
            {t("howTitle")}
          </h2>
          <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {(["1", "2", "3"] as const).map((step, i) => (
              <Reveal as="li" key={step} delay={i * 120}>
                <span aria-hidden="true" className="tabular font-display text-display font-semibold text-signature-graphic">
                  {localizeDigits(step, locale)}
                </span>
                <h3 className="mt-2 text-title">{t(`how.${step}.title`)}</h3>
                <p className="mt-2 max-w-xs text-lead text-ink-soft">{t(`how.${step}.body`)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Latest reviews: large, quiet cards. */}
      {latest.length > 0 && (
        <section aria-labelledby="latest-title" className="py-section">
          <div className="page">
            <h2 id="latest-title" className="text-display">
              {t("latestTitle")}
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {latest.map((review, i) => (
                <Reveal key={review.id} delay={(i % 2) * 100}>
                  <ReviewCard
                    review={review}
                    showConsultancy
                    date={formatDate(review.approvedAt, locale)}
                    replyDate={review.reply ? formatDate(review.reply.createdAt, locale) : undefined}
                    className="h-full"
                  />
                </Reveal>
              ))}
            </div>
            <p className="mt-10">
              <ButtonLink href="/consultancies" variant="secondary" iconAfter={<ArrowRight aria-hidden="true" className="size-5" />}>
                {t("latestAll")}
              </ButtonLink>
            </p>
          </div>
        </section>
      )}

      {/* 5. Top rated by country: a row of big tabs. */}
      {topWithData.length > 0 && (
        <section aria-labelledby="top-title" className="bg-paper-sunk py-section">
          <div className="page">
            <h2 id="top-title" className="text-display">
              {t("topTitle")}
            </h2>
            <CountryTabs
              label={t("topTitle")}
              items={topWithData.map(({ code, items }) => ({
                id: code,
                label: tCountry(code),
                content: (
                  <>
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {items.map((consultancy) => (
                        <li key={consultancy.slug}>
                          <ConsultancyCard consultancy={consultancy} />
                        </li>
                      ))}
                    </ul>
                    <p className="mt-6">
                      <Link
                        href={`/consultancies?country=${code}`}
                        className="inline-flex min-h-12 items-center gap-2 font-semibold underline decoration-2 underline-offset-4"
                      >
                        {t("topAll", { country: tCountry(code) })}
                        <ArrowRight aria-hidden="true" className="size-5" />
                      </Link>
                    </p>
                  </>
                ),
              }))}
            />
          </div>
        </section>
      )}

      {/* 6. The trust promise, on a full dark ink section. */}
      <section data-theme="dark" aria-labelledby="trust-title" className="py-section">
        <div className="page">
          <Reveal>
            <h2 id="trust-title" className="max-w-[14ch] text-hero">
              {t("trustTitle")}
            </h2>
            <p className="mt-8 max-w-prose text-lead text-ink-soft">{t("trustBody")}</p>
            <p className="mt-8">
              <ButtonLink href="/review-policy" variant="secondary" iconAfter={<ArrowRight aria-hidden="true" className="size-5" />}>
                {t("trustLink")}
              </ButtonLink>
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7. Closing call. */}
      <section aria-labelledby="closing-title" className="on-signature bg-signature py-section text-signature-ink">
        <div className="page">
          <h2 id="closing-title" className="max-w-[18ch] text-display">
            {t("closingTitle")}
          </h2>
          <p className="mt-6 max-w-prose text-lead">{t("closingBody")}</p>
          <p className="mt-8">
            <ButtonLink
              href="/review/new"
              size="lg"
              variant="inverse"
              icon={<PenLine aria-hidden="true" className="size-5" />}
            >
              {t("closingCta")}
            </ButtonLink>
          </p>
        </div>
      </section>
    </>
  );
}
