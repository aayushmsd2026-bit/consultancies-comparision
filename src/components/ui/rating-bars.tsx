"use client";

import { useLocale, useTranslations } from "next-intl";
import { useInView } from "@/components/motion/use-in-view";
import { cn } from "@/lib/cn";
import { formatScore } from "@/lib/format";
import { RATING_KEYS, type Ratings } from "@/lib/types";

type Props = {
  ratings: Ratings;
  /** "compact" is used inside review cards. */
  variant?: "full" | "compact";
  className?: string;
};

/**
 * Five thin bars: honesty, communication, documents, speed, after-visa support.
 * Name and number sit on one line, the bar runs below at full width, so it
 * never gets cramped on a small phone. Screen readers hear "Honesty 4.0".
 */
export function RatingBars({ ratings, variant = "full", className }: Props) {
  const t = useTranslations("ui.ratings");
  const locale = useLocale();
  const { ref, inView } = useInView<HTMLUListElement>(0.2);
  const full = variant === "full";

  return (
    <ul ref={ref} className={cn("grid min-w-0", full ? "gap-4" : "gap-2.5 text-small", className)}>
      {RATING_KEYS.map((key, i) => {
        const value = ratings[key];
        return (
          <li key={key}>
            <p className="flex items-baseline justify-between gap-4">
              <span className={cn(full && "font-medium")}>{t(key)}</span>
              <span className="tabular font-semibold">
                {value === null ? (
                  <span className="font-normal text-ink-soft">{t("notRated")}</span>
                ) : (
                  formatScore(value, locale)
                )}
              </span>
            </p>
            <span
              aria-hidden="true"
              className={cn("mt-1.5 block overflow-hidden rounded-full bg-paper-sunk", full ? "h-2" : "h-1.5")}
            >
              {value !== null && (
                <span
                  data-motion="transform"
                  className="block h-full origin-left rounded-full bg-signature-graphic transition-transform duration-700 ease-soft"
                  style={{
                    transform: `scaleX(${inView ? value / 5 : 0})`,
                    transitionDelay: `${i * 70}ms`,
                  }}
                />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
