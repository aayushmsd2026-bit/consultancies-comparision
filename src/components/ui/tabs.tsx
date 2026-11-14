"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { id: string; label: string; content: ReactNode };

type Props = {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** A name for screen readers, for example "Top rated by country". */
  label: string;
  /** "big" is the row of large country tabs on the home page. */
  size?: "md" | "big";
  className?: string;
};

/** Tabs with full keyboard support: arrows move, Home and End jump. */
export function Tabs({ items, value, onChange, label, size = "md", className }: Props) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, items.findIndex((item) => item.id === value));

  function onKeyDown(event: KeyboardEvent) {
    const last = items.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="-mx-(--spacing-gutter) flex gap-2 overflow-x-auto px-(--spacing-gutter) py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const selected = i === index;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              className={cn(
                "press shrink-0 rounded-full font-semibold whitespace-nowrap",
                size === "big"
                  ? "min-h-14 px-6 font-display text-heading sm:min-h-16 sm:px-8"
                  : "min-h-12 px-5 text-body",
                selected ? "bg-ink text-paper" : "bg-paper-sunk text-ink hover:bg-line",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={i !== index}
          tabIndex={0}
          className="mt-6 animate-fade-in"
        >
          {i === index && item.content}
        </div>
      ))}
    </div>
  );
}
