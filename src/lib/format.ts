/**
 * Numbers written for people. Hand-made on purpose: the result is the same on
 * the server and on every phone, even phones that do not know the Nepali locale.
 *
 * English pages: 1,25,000 and 4.2      (Nepali-style grouping, Latin digits)
 * Nepali pages:  १,२५,००० and ४.२        (Devanagari digits)
 */

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/** Swaps 0-9 for Devanagari digits on Nepali pages. Leaves other text alone. */
export function localizeDigits(text: string | number, locale: string): string {
  const value = String(text);
  if (locale !== "ne") return value;
  return value.replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

/** 125000 -> "1,25,000". Last three digits, then groups of two. */
function groupLakh(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

export function formatNumber(value: number, locale: string, decimals = 0): string {
  if (!Number.isFinite(value)) return "";
  const [whole, fraction] = Math.abs(value).toFixed(decimals).split(".");
  const sign = value < 0 && Number(Math.abs(value).toFixed(decimals)) !== 0 ? "-" : "";
  const text = `${sign}${groupLakh(whole)}${fraction ? `.${fraction}` : ""}`;
  return localizeDigits(text, locale);
}

/** A score out of 5, always with one decimal: "4.2". */
export function formatScore(value: number, locale: string): string {
  return formatNumber(value, locale, 1);
}

/** Money in Nepali rupees: "Rs 45,000" or "रु ४५,०००". */
export function formatNpr(value: number, locale: string): string {
  return `${locale === "ne" ? "रु" : "Rs"} ${formatNumber(Math.round(value), locale)}`;
}

/** A share from 0 to 1 as a whole percent: 0.72 -> "72%". */
export function formatPercent(fraction: number, locale: string): string {
  return `${formatNumber(Math.round(fraction * 100), locale)}%`;
}
