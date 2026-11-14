"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** A small, quiet label. Not clickable. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-paper-sunk px-3 text-small font-medium text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

type FilterChipProps = {
  selected: boolean;
  onToggle: (next: boolean) => void;
  children: ReactNode;
  className?: string;
};

/** A chip you can switch on and off. Used for review filters. */
export function FilterChip({ selected, onToggle, children, className }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(!selected)}
      className={cn(
        "press inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-small font-semibold whitespace-nowrap",
        selected
          ? "border-ink bg-ink text-paper"
          : "border-line-strong bg-transparent text-ink hover:border-ink",
        className,
      )}
    >
      {selected && <Check aria-hidden="true" className="size-4 animate-pop" />}
      {children}
    </button>
  );
}
