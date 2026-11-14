import type { Metadata } from "next";
import { Suspense, ViewTransition, type ReactNode } from "react";
import { ExternalLink, GitCompareArrows, MapPin, PenLine } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClientMessages } from "@/components/client-messages";
import { ReviewList, type ListedReview } from "@/components/consultancy/review-list";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Monogram } from "@/components/ui/monogram";
import { RatingBars } from "@/components/ui/rating-bars";
import { RegistrationBadge } from "@/components/ui/registration-badge";
import { ScoreDial } from "@/components/ui/score-dial";
import { Skeleton } from "@/components/ui/skeleton";
import { isCountryCode } from "@/config/countries";
import { SITE_NAME } from "@/config/site";
import { getConsultancy, getConsultancyReviews, getTopSlugs } from "@/lib/data/public";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { formatNpr, formatPercent, localizeDigits } from "@/lib/format";
import { computeConsultancyStats } from "@/lib/stats";

type Props = PageProps<"/[locale]/consultancies/[slug]">;

/** The best-ranked profiles are built ahead of time. The rest are built on the first visit and then kept. */
export async function generateStaticParams() {
  const slugs = await getTopSlugs(50);
  // Next.js needs at least one value to check the page. An unknown name simply shows "not found".
  return (slugs.length > 0 ? slugs : ["example"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const consultancy = await getConsultancy(slug, locale);
  if (!consultancy) return {};
  const t = await getTranslations("profile");
  return {
    title: t("metaTitle", { name: consultancy.name, siteName: SITE_NAME }),
    description: t("metaDescription", { name: consultancy.name }),
  };
}

function Fact({ label, value, note, small }: { label: string; value: ReactNode; note?: string; small?: boolean }) {
  return (
    <div className="flex flex-col-reverse justify-end gap-1 rounded-card bg-paper-sunk p-4 sm:p-5">
      <dt className="text-small text-ink-soft">
        {label}
        {note && <span className="block">{note}</span>}
      </dt>
      <dd className={cn("tabular font-display font-semibold", small ? "text-heading" : "text-title")}>{value}</dd>
    </div>
  );
}

async function Profile({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const locale = await getLocale();
  const [consultancy, reviews] = await Promise.all([
    getConsultancy(slug, locale),
    getConsultancyReviews(slug, locale),
  ]);
  if (!consultancy) notFound();

  const t = await getTranslations("profile");
  const tNav = await getTranslations("nav");
  const tCountry = await getTranslations("countries");
  const tScore = await getTranslations("ui.score");

  const stats = computeConsultancyStats(reviews);
  const count = consultancy.reviewCount;
  const n = (value: number) => localizeDigits(value, locale);
  const noData = t("noData");

  const listed: ListedReview[] = reviews.map((review) => ({
    id: review.id,
    consultancySlug: review.consultancySlug,
    consultancyName: review.consultancyName,
    displayName: review.displayName,
    country: review.country,
    studyLevel: review.studyLevel,
    intakeYear: review.intakeYear,
    outcome: review.outcome,
    ratings: review.ratings,
    overall: review.overall,
    wentWell: review.wentWell,
    wentBadly: review.wentBadly,
    wouldRecommend: review.wouldRecommend,
    isVerified: review.isVerified,
    approvedAt: review.approvedAt,
    reply: review.reply,
    date: formatDate(review.approvedAt, locale),
    replyDate: review.reply ? formatDate(review.reply.createdAt, locale) : undefined,
  }));

  const writeHref = `/review/new?c=${consultancy.slug}`;
  const compareHref = `/compare?c=${consultancy.slug}`;

  return (
    <>
      <div className="page pt-6">
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("consultancies"), href: "/consultancies" },
            { label: consultancy.name },
          ]}
        />
      </div>

      {/* Top: name, city and the registration badge, large and unmistakable. */}
      <header className="page pt-6 pb-10">
        <div className="flex items-start gap-4 sm:gap-6">
          <Monogram name={consultancy.slug} letter={consultancy.name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-title break-words">
              <ViewTransition name={`consultancy-name-${consultancy.slug}`}>
                <span className="inline-block">{consultancy.name}</span>
              </ViewTransition>
            </h1>
            {consultancy.cities.length > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-lead text-ink-soft">
                <MapPin aria-hidden="true" className="size-5 shrink-0" />
                {consultancy.cities.join(", ")}
              </p>
            )}
          </div>
        </div>

        <RegistrationBadge
          className="mt-6 max-w-2xl"
          size="lg"
          status={consultancy.registrationStatus}
          checkedOn={consultancy.registrationCheckedAt ? formatDate(consultancy.registrationCheckedAt, locale) : null}
          sourceUrl={consultancy.registrationSourceUrl}
        />

        <div className="mt-6 hidden gap-3 lg:flex">
          <ButtonLink href={writeHref} icon={<PenLine aria-hidden="true" className="size-5" />}>
            {t("writeCta")}
          </ButtonLink>
          <ButtonLink href={compareHref} variant="secondary" icon={<GitCompareArrows aria-hidden="true" className="size-5" />}>
            {t("compare")}
          </ButtonLink>
        </div>
      </header>

      {/* Overall score, then the breakdown. Never an empty score. */}
      <section aria-labelledby="score-title" className="bg-paper-sunk py-12 md:py-16">
        <div className="page">
          {consultancy.score !== null && stats.ratingAverages ? (
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
              <div className="flex flex-col items-center gap-3 md:items-start">
                <h2 id="score-title" className="font-sans text-body font-semibold">
                  {t("scoreTitle")}
                </h2>
                <ViewTransition name={`consultancy-score-${consultancy.slug}`}>
                  <div>
                    <ScoreDial score={consultancy.score} />
                  </div>
                </ViewTransition>
                <p className="text-small text-ink-soft">{t("basedOn", { count, n: n(count) })}</p>
              </div>
              <div className="rounded-card bg-paper-raised p-6 sm:p-8">
                <h3 className="font-sans text-body font-semibold">{t("breakdownTitle")}</h3>
                <RatingBars ratings={stats.ratingAverages} className="mt-4" />
              </div>
            </div>
          ) : (
            <>
              <h2 id="score-title" className="sr-only">
                {t("scoreTitle")}
              </h2>
              <EmptyState
                className="bg-paper-raised"
                title={tScore("notEnough")}
                body={t("notEnoughBody", { count, n: n(count) })}
                action={
                  <ButtonLink href={writeHref} icon={<PenLine aria-hidden="true" className="size-5" />}>
                    {count === 0 ? t("firstCta") : t("writeCta")}
                  </ButtonLink>
                }
              />
            </>
          )}
        </div>
      </section>

      {/* Fact strip. */}
      {count > 0 && (
        <section aria-labelledby="facts-title" className="page pt-12">
          <h2 id="facts-title" className="sr-only">
            {t("factsTitle")}
          </h2>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Fact label={t("factReviews")} value={n(count)} />
            <Fact
              label={t("factVerified")}
              small={stats.verifiedShare === null}
              value={stats.verifiedShare === null ? noData : formatPercent(stats.verifiedShare, locale)}
            />
            <Fact
              label={t("factVisa")}
              small={stats.visaGrantedShare === null}
              value={stats.visaGrantedShare === null ? noData : formatPercent(stats.visaGrantedShare, locale)}
              note={
                stats.visaGrantedShare === null
                  ? undefined
                  : t("factVisaNote", { count: stats.decidedCount, n: n(stats.decidedCount) })
              }
            />
            <Fact
              label={t("factCharge")}
              small
              value={
                stats.serviceChargeRange ? (
                  <>
                    <span className="whitespace-nowrap">{formatNpr(stats.serviceChargeRange.low, locale)} –</span>{" "}
                    <span className="whitespace-nowrap">{formatNpr(stats.serviceChargeRange.high, locale)}</span>
                  </>
                ) : (
                  noData
                )
              }
              note={
                stats.serviceChargeRange
                  ? t("factChargeNote", { count: stats.serviceChargeRange.count, n: n(stats.serviceChargeRange.count) })
                  : undefined
              }
            />
          </dl>
        </section>
      )}

      {/* About: branches, countries, contact. */}
      <section aria-labelledby="about-title" className="page py-12">
        <h2 id="about-title" className="text-title">
          {t("aboutTitle")}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="min-w-0">
            {consultancy.description && <p className="max-w-prose whitespace-pre-line">{consultancy.description}</p>}
            <dl className="mt-4 grid gap-3">
              {consultancy.registrationNumber && (
                <div>
                  <dt className="text-small text-ink-soft">{t("registrationNumber")}</dt>
                  <dd className="tabular font-semibold">{consultancy.registrationNumber}</dd>
                </div>
              )}
              {consultancy.website && (
                <div>
                  <dt className="text-small text-ink-soft">{t("website")}</dt>
                  <dd>
                    <a
                      href={consultancy.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex min-h-12 items-center gap-1.5 font-semibold break-all underline underline-offset-4"
                    >
                      {consultancy.website.replace(/^https?:\/\//, "")}
                      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {consultancy.countries.length > 0 && (
              <>
                <h3 className="mt-6 font-sans text-body font-semibold">{t("countriesTitle")}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {consultancy.countries.map((code) => (
                    <li key={code}>
                      <Chip>{tCountry(isCountryCode(code) ? code : "OTHER")}</Chip>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {consultancy.branches.length > 0 && (
            <div className="min-w-0">
              <h3 className="font-sans text-body font-semibold">{t("branchesTitle")}</h3>
              <ul className="mt-2 grid gap-3">
                {consultancy.branches.map((branch) => (
                  <li key={branch.id} className="rounded-control bg-paper-raised p-4 shadow-soft">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {branch.city ?? branch.district ?? branch.address}
                      {branch.isHeadOffice && <Chip>{t("headOffice")}</Chip>}
                    </p>
                    {branch.address && <p className="text-small text-ink-soft">{branch.address}</p>}
                    {branch.phone && <p className="tabular text-small text-ink-soft">{branch.phone}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Reviews. */}
      {listed.length > 0 && (
        <section aria-labelledby="reviews-title" className="page pb-12">
          <h2 id="reviews-title" className="text-title">
            {t("reviewsTitle")}
          </h2>
          <div className="mt-6 max-w-4xl">
            <ClientMessages namespaces={["profile"]}>
              <ReviewList reviews={listed} />
            </ClientMessages>
          </div>
        </section>
      )}

      {/* Phone: the two main actions stay within reach of the thumb, just above the tab bar. */}
      <nav
        aria-label={t("actions")}
        className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-paper/95 backdrop-blur-sm lg:hidden"
      >
        <div className="page flex gap-2 py-2">
          <ButtonLink href={writeHref} className="flex-[1.5] px-3 whitespace-nowrap">
            {t("writeCta")}
          </ButtonLink>
          <ButtonLink href={compareHref} variant="secondary" className="flex-1 px-3 whitespace-nowrap">
            {t("compare")}
          </ButtonLink>
        </div>
      </nav>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-hidden="true" className="page py-10">
      <Skeleton className="h-5 w-56" />
      <div className="mt-8 flex gap-4">
        <Skeleton className="size-20 rounded-card" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-6 h-28 max-w-2xl rounded-card" />
      <Skeleton className="mt-10 h-64 rounded-card" />
    </div>
  );
}

export default function ConsultancyPage({ params }: Props) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Profile params={params} />
    </Suspense>
  );
}
