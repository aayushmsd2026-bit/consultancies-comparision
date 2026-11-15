import type { Metadata } from "next";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ClientMessages } from "@/components/client-messages";
import { ConsultancyCard } from "@/components/consultancy/consultancy-card";
import { DirectoryFilters, type DirectoryFilterValues } from "@/components/directory/directory-filters";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES, isCountryCode } from "@/config/countries";
import { SITE_NAME } from "@/config/site";
import { DIRECTORY_SORTS, getCities, listConsultancies, type DirectorySort } from "@/lib/data/public";
import { formatScore, localizeDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

const RATING_STEPS = ["4", "3"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("directory");
  return pageMetadata({
    locale: await getLocale(),
    path: "/consultancies",
    title: t("metaTitle", { siteName: SITE_NAME }),
    description: t("metaDescription"),
  });
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** Reads the filters from the address and throws away anything unexpected. */
function readFilters(params: Record<string, string | string[] | undefined>): DirectoryFilterValues & { page: number } {
  const country = first(params.country).toUpperCase();
  const rating = first(params.rating);
  const sort = first(params.sort);
  return {
    q: first(params.q).slice(0, 80),
    country: isCountryCode(country) ? country : "",
    city: first(params.city).slice(0, 60),
    rating: (RATING_STEPS as readonly string[]).includes(rating) ? rating : "",
    sort: (DIRECTORY_SORTS as readonly string[]).includes(sort) ? sort : "rating",
    registered: first(params.registered) === "1",
    page: Math.min(500, Math.max(1, Number.parseInt(first(params.page), 10) || 1)),
  };
}

function pageHref(filters: DirectoryFilterValues, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.country) params.set("country", filters.country);
  if (filters.city) params.set("city", filters.city);
  if (filters.rating) params.set("rating", filters.rating);
  if (filters.sort !== "rating") params.set("sort", filters.sort);
  if (filters.registered) params.set("registered", "1");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/consultancies?${query}` : "/consultancies";
}

async function DirectoryContent({ searchParams }: Pick<PageProps<"/[locale]/consultancies">, "searchParams">) {
  const filters = readFilters(await searchParams);
  const locale = await getLocale();
  const t = await getTranslations("directory");
  const tCountry = await getTranslations("countries");

  const [result, cities] = await Promise.all([
    listConsultancies(
      {
        q: filters.q,
        country: filters.country || undefined,
        city: filters.city || undefined,
        registeredOnly: filters.registered,
        minRating: filters.rating ? Number(filters.rating) : undefined,
        sort: filters.sort as DirectorySort,
        page: filters.page,
      },
      locale,
    ),
    getCities(),
  ]);

  return (
    <>
      <ClientMessages namespaces={["directory"]}>
        <DirectoryFilters
        values={filters}
        cities={filters.city && !cities.includes(filters.city) ? [filters.city, ...cities] : cities}
        countries={COUNTRIES.filter((code) => code !== "OTHER").map((code) => ({ code, name: tCountry(code) }))}
        ratingLabels={RATING_STEPS.map((value) => ({
          value,
          label: t("ratingMin", { score: formatScore(Number(value), locale) }),
        }))}
        />
      </ClientMessages>

      <p role="status" className="mt-10 font-semibold">
        {t("count", { count: result.total, n: localizeDigits(result.total, locale) })}
      </p>
      {filters.sort === "rating" && result.total > 0 && (
        <p className="text-small text-ink-soft">{t("sortNote")}</p>
      )}

      {result.items.length === 0 ? (
        <EmptyState className="mt-6" title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((consultancy) => (
            <li key={consultancy.slug} className="min-w-0">
              <ConsultancyCard consultancy={consultancy} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav aria-label={t("pagination")} className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {result.page > 1 ? (
            <ButtonLink
              href={pageHref(filters, result.page - 1)}
              variant="secondary"
              icon={<ChevronLeft aria-hidden="true" className="size-5" />}
            >
              {t("previous")}
            </ButtonLink>
          ) : (
            <span />
          )}
          <p className="tabular text-small text-ink-soft">
            {t("pageOf", {
              page: localizeDigits(result.page, locale),
              total: localizeDigits(result.pageCount, locale),
            })}
          </p>
          {result.page < result.pageCount ? (
            <ButtonLink
              href={pageHref(filters, result.page + 1)}
              variant="secondary"
              iconAfter={<ChevronRight aria-hidden="true" className="size-5" />}
            >
              {t("next")}
            </ButtonLink>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function DirectorySkeleton() {
  return (
    <div aria-hidden="true" className="min-h-[100svh]">
      <Skeleton className="h-14 w-full" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-44 rounded-card" />
        ))}
      </div>
    </div>
  );
}

export default async function DirectoryPage({ searchParams }: PageProps<"/[locale]/consultancies">) {
  const t = await getTranslations("directory");
  return (
    <div className="page py-12 md:py-16">
      <h1 className="text-display">{t("title")}</h1>
      <div className="mt-8">
        {/* The filters live in the address, which is only known when a visitor asks for the page. */}
        <Suspense fallback={<DirectorySkeleton />}>
          <DirectoryContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
