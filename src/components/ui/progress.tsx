import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { localizeDigits } from "@/lib/format";

/** The thin line at the top of the review form. It grows as the visitor moves forward. */
export function ProgressLine({
  current,
  total,
  className,
}: {
  /** The step the visitor is on, starting at 1. */
  current: number;
  total: number;
  className?: string;
}) {
  const t = useTranslations("ui.progress");
  const locale = useLocale();
  const stepText = t("stepOf", {
    current: localizeDigits(current, locale),
    total: localizeDigits(total, locale),
  });
  const fraction = Math.min(1, Math.max(0, current / total));
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-label={t("label")}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={stepText}
        className="h-1.5 overflow-hidden rounded-full bg-paper-sunk"
      >
        <span
          data-motion="transform"
          className="block h-full origin-left rounded-full bg-signature-graphic transition-transform duration-500 ease-soft"
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
      <p aria-hidden="true" className="tabular mt-2 text-small text-ink-soft">
        {stepText}
      </p>
    </div>
  );
}

/** Numbered steps with names. Shows what is done, where you are, and what is left. */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: string[];
  /** Index of the current step, starting at 0. */
  current: number;
  className?: string;
}) {
  const t = useTranslations("ui.progress");
  const locale = useLocale();
  return (
    <ol className={cn("flex flex-wrap gap-x-6 gap-y-3", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li
            key={step}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-small font-semibold",
              state === "upcoming" && "font-normal text-ink-soft",
            )}
          >
            <span
              className={cn(
                "tabular grid size-8 shrink-0 place-items-center rounded-full border-2",
                state === "done" && "border-ink bg-ink text-paper",
                state === "current" && "border-signature-graphic bg-signature text-signature-ink",
                state === "upcoming" && "border-line-strong",
              )}
            >
              {state === "done" ? <Check aria-hidden="true" className="size-4" /> : localizeDigits(i + 1, locale)}
            </span>
            {state === "done" && <span className="sr-only">{t("done")} </span>}
            {step}
          </li>
        );
      })}
    </ol>
  );
}
