"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { localizeDigits } from "@/lib/format";

type Props = {
  /** The question, for example "Honesty". */
  label: string;
  hint?: string;
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  error?: string;
  className?: string;
};

/**
 * Five large stars. Underneath they are real radio buttons, so the arrow keys
 * and screen readers work without extra code.
 */
export function StarInput({ label, hint, name, value, onChange, error, className }: Props) {
  const t = useTranslations("ui.stars");
  const id = useId();
  const locale = useLocale();
  const [hover, setHover] = useState<number | null>(null);
  const lit = hover ?? value ?? 0;

  return (
    <fieldset className={cn("min-w-0", className)} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-body font-semibold">{label}</legend>
      {hint && <p className="text-small text-ink-soft">{hint}</p>}
      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            onMouseEnter={() => setHover(n)}
            className="press relative grid size-12 cursor-pointer place-items-center rounded-full has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus sm:size-14"
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span className="sr-only">{t("value", { count: n, n: localizeDigits(n, locale) })}</span>
            <Star
              aria-hidden="true"
              strokeWidth={1.75}
              className={cn(
                "size-9 transition-transform duration-150 ease-soft sm:size-10",
                n <= lit ? "fill-signature text-signature-graphic" : "text-line-strong",
                value === n && "animate-pop",
              )}
            />
          </label>
        ))}
        <span aria-hidden="true" className="tabular ml-2 min-w-20 text-small font-semibold text-ink-soft">
          {lit ? t(`word.${lit as 1 | 2 | 3 | 4 | 5}`) : ""}
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-small font-semibold text-bad">
          {error}
        </p>
      )}
    </fieldset>
  );
}
