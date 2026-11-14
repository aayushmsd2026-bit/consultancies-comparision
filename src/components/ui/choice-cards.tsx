"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type Choice<T extends string> = { value: T; label: string; hint?: string; icon?: ReactNode };

type Props<T extends string> = {
  /** The question. Read out by screen readers. Hide it visually when a heading above already asks it. */
  legend: string;
  hideLegend?: boolean;
  name: string;
  choices: Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Number of columns on a phone. */
  columns?: 1 | 2;
  error?: string;
  className?: string;
};

/** Big, thumb-friendly choices. Underneath they are radio buttons, so the keyboard works. */
export function ChoiceCards<T extends string>({
  legend,
  hideLegend,
  name,
  choices,
  value,
  onChange,
  columns = 1,
  error,
  className,
}: Props<T>) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className={cn("mb-3 text-body font-semibold", hideLegend && "sr-only")}>{legend}</legend>
      <div className={cn("grid gap-3", columns === 2 ? "grid-cols-2" : "grid-cols-1", "sm:grid-cols-2")}>
        {choices.map((choice) => {
          const selected = value === choice.value;
          return (
            <label
              key={choice.value}
              className={cn(
                "press flex min-h-14 cursor-pointer items-center gap-3 rounded-control border-2 px-4 py-3",
                "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                selected ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper-raised hover:border-ink",
              )}
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                checked={selected}
                onChange={() => onChange(choice.value)}
                // A click on the choice that is already selected still counts (used to move on).
                onClick={() => selected && onChange(choice.value)}
                className="sr-only"
              />
              {choice.icon}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{choice.label}</span>
                {choice.hint && (
                  <span className={cn("block text-small", selected ? "opacity-80" : "text-ink-soft")}>{choice.hint}</span>
                )}
              </span>
              {selected && <Check aria-hidden="true" className="size-5 shrink-0 animate-pop" />}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-small font-semibold text-bad">{error}</p>}
    </fieldset>
  );
}
