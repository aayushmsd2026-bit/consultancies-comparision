"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { SearchField } from "@/components/ui/search-field";
import { useRouter } from "@/i18n/navigation";
import type { ConsultancySummary } from "@/lib/types";

type Props = {
  size?: "md" | "hero";
  autoFocus?: boolean;
  className?: string;
  /** Called right before the page changes. The search dialog uses it to close itself. */
  onNavigate?: () => void;
  /** Do something else with the chosen consultancy instead of opening its page (used by Compare). */
  onPick?: (item: ConsultancySummary) => void;
  /** Set this when the search sits inside another form, such as the review form. */
  nested?: boolean;
};

/** The search field wired to the real search and to the pages it leads to. */
export function ConsultancySearch({ size, autoFocus, className, onNavigate, onPick, nested }: Props) {
  const locale = useLocale();
  const router = useRouter();

  const search = useCallback(
    async (query: string, signal: AbortSignal): Promise<ConsultancySummary[]> => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`, { signal });
      if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
      const body = (await response.json()) as { results: ConsultancySummary[] };
      return body.results;
    },
    [locale],
  );

  return (
    <SearchField
      size={size}
      autoFocus={autoFocus}
      nested={nested}
      className={className}
      search={search}
      onSelect={(item) => {
        if (onPick) return onPick(item);
        onNavigate?.();
        router.push(`/consultancies/${item.slug}`);
      }}
      onSubmit={(query) => {
        onNavigate?.();
        router.push(`/consultancies?q=${encodeURIComponent(query)}`);
      }}
    />
  );
}
