"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { localizeDigits } from "@/lib/format";
import type { ConsultancySummary } from "@/lib/types";
import { Monogram } from "./monogram";
import { RegistrationBadge } from "./registration-badge";

type Props = {
  /** Finds consultancies for the typed text. Called a moment after the visitor stops typing. */
  search: (query: string, signal: AbortSignal) => Promise<ConsultancySummary[]>;
  /** The visitor picked a consultancy from the list. */
  onSelect: (item: ConsultancySummary) => void;
  /** The visitor pressed Enter without picking one: show all results for the text. */
  onSubmit: (query: string) => void;
  /** "hero" is the very large field on the home page. */
  size?: "md" | "hero";
  autoFocus?: boolean;
  className?: string;
};

const MIN_CHARS = 2;

/**
 * "Search a consultancy" with suggestions as you type.
 * Each suggestion shows the name, the city and the registration badge.
 * Works with the keyboard: arrows move, Enter picks, Escape closes.
 */
export function SearchField({ search, onSelect, onSubmit, size = "md", autoFocus, className }: Props) {
  const t = useTranslations("ui.search");
  const id = useId();
  const locale = useLocale();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConsultancySummary[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();

  // Search a moment after typing stops. Cancel the previous search if a new one starts.
  useEffect(() => {
    if (trimmed.length < MIN_CHARS) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      search(trimmed, controller.signal)
        .then((items) => {
          setResults(items);
          setActive(-1);
          setStatus("done");
        })
        .catch((error: unknown) => {
          if ((error as Error)?.name !== "AbortError") setStatus("error");
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, search]);

  // Close when the visitor taps somewhere else.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const showList = open && trimmed.length >= MIN_CHARS && status !== "idle";
  const optionCount = results.length;

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1 >= optionCount ? -1 : i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i < 0 ? optionCount - 1 : i - 1));
    } else if (event.key === "Escape") {
      if (open) event.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if (event.key === "Enter" && showList && active >= 0 && results[active]) {
      event.preventDefault();
      setOpen(false);
      onSelect(results[active]);
    }
  }

  const hero = size === "hero";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmed) return;
          setOpen(false);
          onSubmit(trimmed);
        }}
      >
        <label htmlFor={id} className="sr-only">
          {t("label")}
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-soft",
              hero ? "left-5 size-6 sm:left-7 sm:size-7" : "left-4 size-5",
            )}
          />
          <input
            id={id}
            type="search"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            autoFocus={autoFocus}
            placeholder={t("placeholder")}
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              setOpen(true);
              if (next.trim().length < MIN_CHARS) {
                setResults([]);
                setStatus("idle");
              }
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={cn(
              "w-full rounded-full border-2 border-ink bg-paper-raised text-ink placeholder:text-ink-soft",
              "[&::-webkit-search-cancel-button]:hidden",
              hero
                ? "min-h-16 pr-16 pl-14 text-lead shadow-soft sm:min-h-20 sm:pr-20 sm:pl-18"
                : "min-h-14 pr-14 pl-12 text-body",
            )}
          />
          <button
            type="submit"
            className={cn(
              "press absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full bg-ink text-paper",
              hero ? "right-2 size-12 sm:right-3 sm:size-14" : "right-1.5 size-11",
            )}
          >
            {status === "loading" ? (
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-5" />
            )}
            <span className="sr-only">{t("submit")}</span>
          </button>
        </div>
      </form>

      <div
        className={cn(
          "absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-card bg-paper-raised text-ink shadow-soft ring-1 ring-line",
          !showList && "hidden",
        )}
      >
        <ul id={listId} role="listbox" aria-label={t("suggestions")} className="max-h-[60vh] overflow-y-auto p-2">
          {results.map((item, i) => (
            <li
              key={item.slug}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerMove={() => setActive(i)}
              onClick={() => {
                setOpen(false);
                onSelect(item);
              }}
              className={cn(
                "flex min-h-16 cursor-pointer items-center gap-3 rounded-control px-3 py-2",
                i === active && "bg-paper-sunk",
              )}
            >
              <Monogram name={item.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.name}</span>
                {item.city && <span className="block truncate text-small text-ink-soft">{item.city}</span>}
              </span>
              <RegistrationBadge status={item.registrationStatus} />
            </li>
          ))}
        </ul>
        {status === "done" && results.length === 0 && (
          <p className="px-5 pb-5 text-ink-soft">{t("noResults", { query: trimmed })}</p>
        )}
        {status === "error" && <p className="px-5 pb-5 font-semibold text-bad">{t("error")}</p>}
      </div>

      {/* Tells screen readers how many suggestions there are. */}
      <p role="status" className="sr-only">
        {showList && status === "done" ? t("resultCount", { count: results.length, n: localizeDigits(results.length, locale) }) : ""}
      </p>
    </div>
  );
}
