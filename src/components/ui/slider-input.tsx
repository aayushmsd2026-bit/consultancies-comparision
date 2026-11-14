"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  hint?: string;
  name?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** Turns the number into the text shown above the thumb, for example "Rs 25,000". */
  formatValue?: (value: number) => string;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
};

/** A slider with a large thumb. It is the browser's own range input, so it is keyboard friendly. */
export function SliderInput({
  label,
  hint,
  name,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = String,
  minLabel,
  maxLabel,
  className,
}: Props) {
  const id = useId();
  const fraction = (value - min) / (max - min || 1);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-body font-semibold">
          {label}
        </label>
        <output htmlFor={id} className="tabular font-display text-heading font-semibold">
          {formatValue(value)}
        </output>
      </div>
      {hint && <p className="-mt-1 text-small text-ink-soft">{hint}</p>}
      <div className="relative flex h-12 items-center">
        <span aria-hidden="true" className="absolute inset-x-0 h-2 overflow-hidden rounded-full bg-paper-sunk">
          <span
            className="block h-full origin-left bg-signature-graphic"
            style={{ transform: `scaleX(${fraction})` }}
          />
        </span>
        <input
          id={id}
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={formatValue(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider relative h-12 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
      {(minLabel || maxLabel) && (
        <div aria-hidden="true" className="flex justify-between text-small text-ink-soft">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
