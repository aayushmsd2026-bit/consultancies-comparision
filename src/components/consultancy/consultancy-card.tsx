import { ViewTransition } from "react";
import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Monogram } from "@/components/ui/monogram";
import { RegistrationBadge } from "@/components/ui/registration-badge";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatScore, localizeDigits } from "@/lib/format";
import type { ConsultancyCardData } from "@/lib/types";

/**
 * One consultancy in a list. The whole card is one big tap target.
 * The name and the score "morph" into the profile header when the page changes.
 */
export function ConsultancyCard({ consultancy, className }: { consultancy: ConsultancyCardData; className?: string }) {
  const t = useTranslations("card");
  const tScore = useTranslations("ui.score");
  const locale = useLocale();
  const { slug, name, cities, score, reviewCount, registrationStatus } = consultancy;
  const scoreText = score === null ? null : formatScore(score, locale);

  return (
    <article
      className={cn(
        "press relative flex h-full flex-col gap-4 rounded-card bg-paper-raised p-5 shadow-soft hover:bg-paper-sunk sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <Monogram name={slug} letter={name} />
        <div className="min-w-0 flex-1">
          <h3 className="text-heading break-words">
            <Link href={`/consultancies/${slug}`} className="after:absolute after:inset-0 after:rounded-card">
              <ViewTransition name={`consultancy-name-${slug}`}>
                <span className="inline-block">{name}</span>
              </ViewTransition>
            </Link>
          </h3>
          {cities.length > 0 && (
            <p className="mt-1 flex items-center gap-1 text-small text-ink-soft">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">
                {cities.slice(0, 2).join(", ")}
                {cities.length > 2 && ` ${t("moreCities", { n: localizeDigits(cities.length - 2, locale) })}`}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
        <div>
          {scoreText ? (
            <p className="flex items-center gap-2">
              <ViewTransition name={`consultancy-score-${slug}`}>
                <span className="tabular inline-block font-display text-title font-semibold leading-none">
                  {scoreText}
                </span>
              </ViewTransition>
              <Stars value={score!} label={tScore("outOfFive", { score: scoreText })} />
            </p>
          ) : (
            <p className="font-semibold text-ink-soft">{tScore("notEnough")}</p>
          )}
          <p className="mt-1 text-small text-ink-soft">
            {t("reviews", { count: reviewCount, n: localizeDigits(reviewCount, locale) })}
          </p>
        </div>
        <RegistrationBadge status={registrationStatus} />
      </div>
    </article>
  );
}
