import { BadgeCheck, Flag, ThumbsDown, ThumbsUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { isCountryCode } from "@/config/countries";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatScore, localizeDigits } from "@/lib/format";
import type { PublicReview } from "@/lib/types";
import { RatingBars } from "./rating-bars";
import { ReplyBlock } from "./reply-block";
import { Stars } from "./stars";
import { OutcomeTag } from "./tag";

type Props = {
  review: PublicReview;
  /** Already formatted dates (the page decides between AD and Bikram Sambat). */
  date: string;
  replyDate?: string;
  /** Show which consultancy the review is about. Used on the home page. */
  showConsultancy?: boolean;
  className?: string;
};

/** One student's experience. Large and quiet. */
export function ReviewCard({ review, date, replyDate, showConsultancy, className }: Props) {
  const t = useTranslations("ui.review");
  const tCountry = useTranslations("countries");
  const tLevel = useTranslations("ui.studyLevel");
  const tScore = useTranslations("ui.score");
  const locale = useLocale();
  const country = isCountryCode(review.country) ? review.country : "OTHER";
  const overall = formatScore(review.overall, locale);

  return (
    <article className={cn("rounded-card bg-paper-raised p-5 shadow-soft sm:p-8", className)}>
      {showConsultancy && (
        <p className="mb-4">
          <Link
            href={`/consultancies/${review.consultancySlug}`}
            className="font-display text-heading font-semibold underline-offset-4 hover:underline"
          >
            {review.consultancyName}
          </Link>
        </p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
            <span>{review.displayName ?? t("anonymous")}</span>
            {review.isVerified && (
              <span className="inline-flex items-center gap-1 text-small text-ok">
                <BadgeCheck aria-hidden="true" className="size-4 shrink-0" />
                {t("verified")}
              </span>
            )}
          </p>
          <p className="text-small text-ink-soft">
            {tCountry(country)} · {tLevel(review.studyLevel)} ·{" "}
            {t("intake", { year: localizeDigits(review.intakeYear, locale) })}
          </p>
        </div>
        <OutcomeTag outcome={review.outcome} />
      </header>

      <div className="mt-5 flex items-center gap-3">
        <span className="tabular font-display text-title font-semibold leading-none">{overall}</span>
        <Stars value={review.overall} label={tScore("outOfFive", { score: overall })} />
      </div>

      <div className="mt-6 grid gap-6">
        <section>
          <h3 className="font-sans text-small font-semibold text-ink-soft">{t("wentWell")}</h3>
          <p className="mt-1 max-w-prose whitespace-pre-line break-words">{review.wentWell}</p>
        </section>
        <section>
          <h3 className="font-sans text-small font-semibold text-ink-soft">{t("wentBadly")}</h3>
          <p className="mt-1 max-w-prose whitespace-pre-line break-words">{review.wentBadly}</p>
        </section>
      </div>

      <details className="group mt-6">
        <summary className="inline-flex min-h-12 cursor-pointer list-none items-center text-small font-semibold underline decoration-line-strong decoration-2 underline-offset-4 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">{t("showRatings")}</span>
          <span className="hidden group-open:inline">{t("hideRatings")}</span>
        </summary>
        <RatingBars ratings={review.ratings} variant="compact" className="mt-2 max-w-md" />
      </details>

      <p className="mt-4 flex items-center gap-2 font-semibold">
        {review.wouldRecommend ? (
          <ThumbsUp aria-hidden="true" className="size-5 shrink-0 text-ok" />
        ) : (
          <ThumbsDown aria-hidden="true" className="size-5 shrink-0 text-bad" />
        )}
        {review.wouldRecommend ? t("recommends") : t("doesNotRecommend")}
      </p>

      {review.reply && replyDate && (
        <ReplyBlock body={review.reply.body} date={replyDate} className="mt-6" />
      )}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-small text-ink-soft">
        <span>{t("postedOn", { date })}</span>
        <Link
          href={`/report/${review.id}`}
          className="inline-flex min-h-12 items-center gap-1.5 underline-offset-4 hover:text-ink hover:underline"
        >
          <Flag aria-hidden="true" className="size-4" />
          {t("report")}
        </Link>
      </footer>
    </article>
  );
}
