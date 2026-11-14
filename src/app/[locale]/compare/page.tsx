import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Award, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ClientMessages } from "@/components/client-messages";
import { CompareAdd } from "@/components/compare/compare-add";
import { EmptyState } from "@/components/ui/empty-state";
import { Monogram } from "@/components/ui/monogram";
import { RegistrationBadge } from "@/components/ui/registration-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { bestIndex, compareHref, parseCompareSlugs } from "@/lib/compare";
import { getConsultancy, getConsultancyReviews } from "@/lib/data/public";
import { formatNpr, formatNumber, formatPercent, formatScore } from "@/lib/format";
import { computeConsultancyStats } from "@/lib/stats";
import { RATING_KEYS } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("compare");
  return { title: t("metaTitle", { siteName: SITE_NAME }), description: t("metaDescription") };
}

type Row = { label: string; cells: ReactNode[]; best: number | null };

async function Comparison({ searchParams }: Pick<PageProps<"/[locale]/compare">, "searchParams">) {
  const slugs = parseCompareSlugs((await searchParams).c);
  const locale = await getLocale();
  const t = await getTranslations("compare");
  const tRatings = await getTranslations("ui.ratings");
  const tScore = await getTranslations("ui.score");

  const loaded = await Promise.all(
    slugs.map(async (slug) => {
      const [consultancy, reviews] = await Promise.all([
        getConsultancy(slug, locale),
        getConsultancyReviews(slug, locale),
      ]);
      return consultancy ? { consultancy, stats: computeConsultancyStats(reviews) } : null;
    }),
  );
  const columns = loaded.filter((column) => column !== null);
  const current = columns.map((column) => column.consultancy.slug);
  const quiet = <span className="text-small font-normal text-ink-soft">{t("noData")}</span>;

  // Each row: the numbers used to pick the best column, and how each cell is written.
  const numberRow = (
    label: string,
    values: (number | null)[],
    write: (value: number) => string,
    better: "higher" | "lower" = "higher",
    empty: ReactNode = quiet,
  ): Row => ({
    label,
    best: bestIndex(values, better),
    cells: values.map((value) => (value === null ? empty : write(value))),
  });

  const scores = columns.map((c) => c.consultancy.score);
  const rows: Row[] = [
    {
      label: t("registration"),
      best: null,
      cells: columns.map((c) => <RegistrationBadge key={c.consultancy.slug} status={c.consultancy.registrationStatus} />),
    },
    numberRow(t("overall"), scores, (v) => formatScore(v, locale), "higher", (
      <span className="text-small font-normal text-ink-soft">{tScore("notEnough")}</span>
    )),
    ...RATING_KEYS.map((key) =>
      numberRow(
        tRatings(key),
        // Rating averages follow the same "3 reviews" rule as the overall score.
        columns.map((c) => (c.consultancy.score === null ? null : (c.stats.ratingAverages?.[key] ?? null))),
        (v) => formatScore(v, locale),
      ),
    ),
    numberRow(t("visa"), columns.map((c) => c.stats.visaGrantedShare), (v) => formatPercent(v, locale)),
    {
      label: t("charge"),
      best: bestIndex(
        columns.map((c) => (c.stats.serviceChargeRange ? (c.stats.serviceChargeRange.low + c.stats.serviceChargeRange.high) / 2 : null)),
        "lower",
      ),
      cells: columns.map((c) =>
        c.stats.serviceChargeRange ? (
          <span key={c.consultancy.slug} className="text-body">
            <span className="whitespace-nowrap">{formatNpr(c.stats.serviceChargeRange.low, locale)} –</span>{" "}
            <span className="whitespace-nowrap">{formatNpr(c.stats.serviceChargeRange.high, locale)}</span>
          </span>
        ) : (
          quiet
        ),
      ),
    },
    numberRow(t("reviews"), columns.map((c) => c.consultancy.reviewCount), (v) => formatNumber(v, locale)),
  ];

  return (
    <>
      <div className="mt-8 max-w-xl">
        {columns.length < 3 ? (
          <ClientMessages>
            <p className="mb-2 font-semibold">{t("add")}</p>
            <CompareAdd slugs={current} />
            <p className="mt-2 text-small text-ink-soft">{t("addHint")}</p>
          </ClientMessages>
        ) : (
          <p className="text-ink-soft">{t("full")}</p>
        )}
      </div>

      {columns.length === 0 ? (
        <EmptyState className="mt-10" title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <>
          {columns.length === 1 && <p className="mt-8 font-semibold">{t("oneMore")}</p>}
          {columns.length > 1 && <p className="mt-8 text-small text-ink-soft md:hidden">{t("swipe")}</p>}
          {/* Phone: swipe sideways between consultancies. The row labels stay fixed on the left. */}
          <div className="relative -mx-(--spacing-gutter) mt-4 snap-x snap-mandatory overflow-x-auto scroll-pl-32 px-(--spacing-gutter) md:mx-0 md:px-0">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-28 min-w-28 bg-paper align-bottom md:w-48 md:min-w-48">
                    <span className="sr-only">{t("rowHeader")}</span>
                  </th>
                  {columns.map(({ consultancy }) => (
                    <th
                      key={consultancy.slug}
                      scope="col"
                      className="min-w-[62vw] snap-start px-3 pb-4 align-top font-normal md:min-w-0"
                    >
                      <div className="flex items-start gap-3">
                        <Monogram name={consultancy.slug} letter={consultancy.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/consultancies/${consultancy.slug}`}
                            className="font-display text-heading font-semibold break-words underline-offset-4 hover:underline"
                          >
                            {consultancy.name}
                          </Link>
                          {consultancy.city && <p className="text-small text-ink-soft">{consultancy.city}</p>}
                        </div>
                        <Link
                          href={compareHref(current.filter((slug) => slug !== consultancy.slug))}
                          scroll={false}
                          className="press grid size-12 shrink-0 place-items-center rounded-full hover:bg-paper-sunk"
                        >
                          <X aria-hidden="true" className="size-5" />
                          <span className="sr-only">{t("remove", { name: consultancy.name })}</span>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-t border-line bg-paper py-4 pr-3 align-middle text-small font-semibold"
                    >
                      {row.label}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td key={columns[i].consultancy.slug} className="border-t border-line p-1.5 align-middle">
                        <div
                          className={cn(
                            "tabular flex min-h-12 items-center gap-2 rounded-control px-3 py-2 font-display text-heading font-semibold",
                            row.best === i && "bg-signature-tint",
                          )}
                        >
                          {cell}
                          {row.best === i && (
                            <>
                              <Award aria-hidden="true" className="size-5 shrink-0 text-signature-strong" />
                              <span className="sr-only">{t("best")}</span>
                            </>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default async function ComparePage({ searchParams }: PageProps<"/[locale]/compare">) {
  const t = await getTranslations("compare");
  return (
    <div className="page py-12 md:py-16">
      <h1 className="text-display">{t("title")}</h1>
      <p className="mt-4 max-w-prose text-lead text-ink-soft">{t("intro")}</p>
      <Suspense fallback={<Skeleton className="mt-8 h-64 rounded-card" />}>
        <Comparison searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
