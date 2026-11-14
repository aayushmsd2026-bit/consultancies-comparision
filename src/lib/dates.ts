import NepaliDate from "nepali-date-converter";

const TIME_ZONE = "Asia/Kathmandu";

/** The calendar day in Nepal for a moment in time. */
function kathmanduDay(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * A date written for people.
 * English pages: "29 Oct 2026" (AD).
 * Nepali pages: "१२ कार्तिक २०८३" (Bikram Sambat).
 */
export function formatDate(value: string | Date, locale: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  if (locale === "ne") {
    const { year, month, day } = kathmanduDay(date);
    return new NepaliDate(new Date(year, month - 1, day)).format("D MMMM YYYY", "np");
  }
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
