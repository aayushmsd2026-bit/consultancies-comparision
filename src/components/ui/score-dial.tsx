"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CountUp } from "@/components/motion/count-up";
import { useInView } from "@/components/motion/use-in-view";
import { cn } from "@/lib/cn";
import { formatScore } from "@/lib/format";

type Props = {
  /** 0 to 5. */
  score: number;
  size?: "md" | "lg";
  className?: string;
};

const R = 44; // ring radius inside a 100 x 100 box
const STROKE = 9;

/**
 * One big number out of 5 inside a ring that fills when it scrolls into view.
 *
 * The ring is two half circles that rotate into place. Only "transform" is
 * animated, so it stays smooth on slow phones.
 */
export function ScoreDial({ score, size = "lg", className }: Props) {
  const t = useTranslations("ui.score");
  const id = useId();
  const locale = useLocale();
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const clamped = Math.min(5, Math.max(0, score));
  const angle = (clamped / 5) * 360;
  const first = Math.min(angle, 180);
  const second = Math.max(angle - 180, 0);
  // Total fill time 900ms, shared between the halves by how far each turns.
  const firstMs = angle ? Math.round((first / angle) * 900) : 0;
  const secondMs = 900 - firstMs;

  const half = `M 50 ${50 - R} A ${R} ${R} 0 0 1 50 ${50 + R}`; // right half, top to bottom
  const origin = { transformOrigin: "50px 50px" } as const;
  // First half: waits hidden on the left, turns into the right half.
  const firstStyle = {
    ...origin,
    transform: `rotate(${inView ? first - 180 : -180}deg)`,
    transition: `transform ${firstMs}ms ${second > 0 ? "linear" : "var(--ease-soft)"}`,
  };
  // Second half: waits hidden on the right, then turns into the left half.
  const secondStyle = {
    ...origin,
    transform: `rotate(${inView ? second : 0}deg)`,
    transition: `transform ${secondMs}ms var(--ease-soft) ${firstMs}ms`,
  };
  const rightClip = `${id}-right`;
  const leftClip = `${id}-left`;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={t("outOfFive", { score: formatScore(clamped, locale) })}
      className={cn("relative shrink-0", size === "lg" ? "size-44 sm:size-52" : "size-28", className)}
    >
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
        <defs>
          <clipPath id={rightClip}>
            <rect x="50" y="0" width="50" height="100" />
          </clipPath>
          <clipPath id={leftClip}>
            <rect x="0" y="0" width="50" height="100" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth={STROKE} className="stroke-paper-sunk" />
        <g clipPath={`url(#${rightClip})`}>
          <path
            d={half}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-signature-graphic"
            data-motion="transform"
            style={firstStyle}
          />
        </g>
        <g clipPath={`url(#${leftClip})`}>
          <path
            d={half}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-signature-graphic"
            data-motion="transform"
            style={secondStyle}
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center" aria-hidden="true">
        <div>
          <CountUp
            value={clamped}
            decimals={1}
            className={cn(
              "block font-display font-semibold leading-none tracking-tight",
              size === "lg" ? "text-display" : "text-title",
            )}
          />
          <span className="mt-1 block text-small text-ink-soft">{t("outOf")}</span>
        </div>
      </div>
    </div>
  );
}
