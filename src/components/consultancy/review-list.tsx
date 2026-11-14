"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { Select } from "@/components/ui/field";
import { ReviewCard } from "@/components/ui/review-card";
import { isCountryCode } from "@/config/countries";
import { localizeDigits } from "@/lib/format";
import { OUTCOMES, type Outcome, type PublicReview } from "@/lib/types";

export type ListedReview = PublicReview & { date: string; replyDate?: string };

type Sort = "newest" | "verified" | "highest" | "lowest";
const PAGE = 8;

/** The reviews of one consultancy with filter chips and a sort. Filtering is instant: no page reload. */
export function ReviewList({ reviews }: { reviews: ListedReview[] }) {
  const t = useTranslations("profile");
  const tCountry = useTranslations("countries");
  const tOutcome = useTranslations("ui.outcome");
  const locale = useLocale();

  const [country, setCountry] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [shown, setShown] = useState(PAGE);

  const countries = useMemo(() => [...new Set(reviews.map((r) => r.country))], [reviews]);
  const outcomes = useMemo(() => OUTCOMES.filter((o) => reviews.some((r) => r.outcome === o)), [reviews]);
  const hasVerified = reviews.some((r) => r.isVerified);

  const visible = useMemo(() => {
    const list = reviews.filter(
      (r) =>
        (country === null || r.country === country) &&
        (outcome === null || r.outcome === outcome) &&
        (!verifiedOnly || r.isVerified),
    );
    const byDate = (a: ListedReview, b: ListedReview) => b.approvedAt.localeCompare(a.approvedAt);
    return list.sort((a, b) =>
      sort === "verified" ? Number(b.isVerified) - Number(a.isVerified) || byDate(a, b)
      : sort === "highest" ? b.overall - a.overall || byDate(a, b)
      : sort === "lowest" ? a.overall - b.overall || byDate(a, b)
      : byDate(a, b),
    );
  }, [reviews, country, outcome, verifiedOnly, sort]);

  const filtered = country !== null || outcome !== null || verifiedOnly;
  const reset = () => {
    setCountry(null);
    setOutcome(null);
    setVerifiedOnly(false);
    setShown(PAGE);
  };
  // Any change of filter starts again from the first few reviews.
  const change = (apply: () => void) => {
    apply();
    setShown(PAGE);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div role="group" aria-label={t("filterTitle")} className="flex flex-wrap gap-2">
          {countries.length > 1 &&
            countries.map((code) => (
              <FilterChip
                key={code}
                selected={country === code}
                onToggle={(on) => change(() => setCountry(on ? code : null))}
              >
                {tCountry(isCountryCode(code) ? code : "OTHER")}
              </FilterChip>
            ))}
          {outcomes.length > 1 &&
            outcomes.map((value) => (
              <FilterChip
                key={value}
                selected={outcome === value}
                onToggle={(on) => change(() => setOutcome(on ? value : null))}
              >
                {tOutcome(value)}
              </FilterChip>
            ))}
          {hasVerified && (
            <FilterChip selected={verifiedOnly} onToggle={(on) => change(() => setVerifiedOnly(on))}>
              {t("verifiedOnly")}
            </FilterChip>
          )}
        </div>
        <Select
          label={t("sortLabel")}
          value={sort}
          onChange={(e) => change(() => setSort(e.target.value as Sort))}
          wrapperClassName="md:w-56 shrink-0"
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="verified">{t("sortVerified")}</option>
          <option value="highest">{t("sortHighest")}</option>
          <option value="lowest">{t("sortLowest")}</option>
        </Select>
      </div>

      <p role="status" className="mt-6 text-small text-ink-soft">
        {t("showing", { count: visible.length, n: localizeDigits(visible.length, locale) })}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-card bg-paper-sunk p-6">
          <p className="font-semibold">{t("noMatch")}</p>
          {filtered && (
            <Button variant="quiet" className="mt-2" onClick={reset}>
              {t("clearFilters")}
            </Button>
          )}
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-5">
          {visible.slice(0, shown).map((review) => (
            <li key={review.id} className="min-w-0">
              <ReviewCard review={review} date={review.date} replyDate={review.replyDate} />
            </li>
          ))}
        </ul>
      )}

      {visible.length > shown && (
        <p className="mt-6">
          <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
            {t("showMore", { n: localizeDigits(Math.min(PAGE, visible.length - shown), locale) })}
          </Button>
        </p>
      )}
    </div>
  );
}
