/**
 * Decides which column gets the quiet "best in this row" highlight on the compare page.
 * Returns the index of the single best value, or null when there is no clear winner.
 */
export function bestIndex(values: readonly (number | null)[], better: "higher" | "lower"): number | null {
  const known = values
    .map((value, index) => ({ value, index }))
    .filter((entry): entry is { value: number; index: number } => entry.value !== null);
  if (known.length < 2) return null;
  const sorted = [...known].sort((a, b) => (better === "higher" ? b.value - a.value : a.value - b.value));
  // A tie for first place means nobody is highlighted.
  return sorted[0].value === sorted[1].value ? null : sorted[0].index;
}

/** Reads "?c=a,b,c" into at most three clean, different slugs. */
export function parseCompareSlugs(raw: string | string[] | undefined): string[] {
  const text = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const slugs = text
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(part));
  return [...new Set(slugs)].slice(0, 3);
}

export function compareHref(slugs: readonly string[]): string {
  return slugs.length > 0 ? `/compare?c=${slugs.join(",")}` : "/compare";
}
