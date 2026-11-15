import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight, Search, ShieldX } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { RegistrationBadge } from "@/components/ui/registration-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getConsultancy, getSiteStats, searchConsultancies } from "@/lib/data/public";
import { formatDate } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("check");
  return pageMetadata({
    locale: await getLocale(),
    path: "/check",
    title: t("metaTitle", { siteName: SITE_NAME }),
    description: t("metaDescription"),
  });
}

/** One field, one answer. Works as a plain form, so it needs no JavaScript at all. */
async function Checker({ searchParams }: Pick<PageProps<"/[locale]/check">, "searchParams">) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? "").trim().slice(0, 80);
  const locale = await getLocale();
  const t = await getTranslations("check");

  const matches = query.length >= 2 ? await searchConsultancies(query.toLowerCase(), locale, 6) : [];
  // The full record of the closest match has the date and the source link.
  const best = matches[0] ? await getConsultancy(matches[0].slug, locale) : null;
  const others = matches.slice(1);

  return (
    <>
      <form method="get" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
        <TextField
          key={query}
          name="q"
          type="search"
          label={t("label")}
          placeholder={t("placeholder")}
          defaultValue={query}
          autoComplete="off"
          enterKeyHint="search"
          minLength={2}
          required
          wrapperClassName="flex-1"
          className="min-h-16 text-lead"
        />
        <Button type="submit" size="lg" className="min-h-16" icon={<Search aria-hidden="true" className="size-5" />}>
          {t("button")}
        </Button>
      </form>

      {query.length === 1 && <p className="mt-4 font-semibold text-bad">{t("tooShort")}</p>}

      {query.length >= 2 && (
        <section aria-labelledby="result-title" className="mt-12 max-w-2xl">
          <h2 id="result-title" className="font-sans text-body font-semibold text-ink-soft">
            {t("resultTitle", { query })}
          </h2>

          {best ? (
            <div className="mt-3">
              <p className="text-small text-ink-soft">{t("bestMatch")}</p>
              <p className="font-display text-title font-semibold break-words">{best.name}</p>
              {best.cities.length > 0 && <p className="text-ink-soft">{best.cities.join(", ")}</p>}
              <RegistrationBadge
                className="mt-4"
                size="lg"
                status={best.registrationStatus}
                checkedOn={best.registrationCheckedAt ? formatDate(best.registrationCheckedAt, locale) : null}
                sourceUrl={best.registrationSourceUrl}
              />
              <p className="mt-4">
                <Link
                  href={`/consultancies/${best.slug}`}
                  className="inline-flex min-h-12 items-center gap-2 font-semibold underline decoration-2 underline-offset-4"
                >
                  {t("viewProfile")}
                  <ArrowRight aria-hidden="true" className="size-5" />
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-4 rounded-card bg-bad-tint p-5 text-bad sm:p-6">
              <ShieldX aria-hidden="true" className="mt-0.5 size-10 shrink-0 sm:size-12" strokeWidth={1.75} />
              <div>
                <p className="font-display text-heading font-semibold">{t("notFoundTitle")}</p>
                <p className="mt-1 text-small text-ink">{t("notFoundBody", { query })}</p>
              </div>
            </div>
          )}

          {others.length > 0 && (
            <>
              <h3 className="mt-10 font-sans text-body font-semibold">{t("otherMatches")}</h3>
              <ul className="mt-2 divide-y divide-line">
                {others.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/consultancies/${item.slug}`}
                      className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 hover:bg-paper-sunk"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold break-words">{item.name}</span>
                        {item.city && <span className="block text-small text-ink-soft">{item.city}</span>}
                      </span>
                      <RegistrationBadge status={item.registrationStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-10 max-w-prose text-small text-ink-soft">{t("reminder")}</p>
        </section>
      )}
    </>
  );
}

export default async function CheckPage({ searchParams }: PageProps<"/[locale]/check">) {
  const t = await getTranslations("check");
  const locale = await getLocale();
  const stats = await getSiteStats();
  return (
    <div className="page py-12 md:py-20">
      <h1 className="text-display">{t("title")}</h1>
      <p className="mt-4 max-w-prose text-lead text-ink-soft">
        {t("intro")}{" "}
        {stats.consultancies > 0 && t("listSize", { n: formatNumber(stats.consultancies, locale) })}
      </p>
      <Suspense fallback={<div className="min-h-[70svh]"><Skeleton className="mt-8 h-16 max-w-2xl" /></div>}>
        <Checker searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
