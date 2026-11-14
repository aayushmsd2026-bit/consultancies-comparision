"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { formatNumber } from "@/lib/format";
import { prefersReducedMotion, useInView } from "./use-in-view";

type Props = {
  value: number;
  /** Digits after the decimal point. */
  decimals?: number;
  durationMs?: number;
  className?: string;
};

/**
 * Counts from 0 to the value once, when it scrolls into view.
 * The server and screen readers get the final number straight away.
 */
export function CountUp({ value, decimals = 0, durationMs = 900, className }: Props) {
  const locale = useLocale();
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShown(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, durationMs]);

  const text = (n: number) => formatNumber(n, locale, decimals);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular">
        {text(shown)}
      </span>
      <span className="sr-only">{text(value)}</span>
    </span>
  );
}
