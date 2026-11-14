/**
 * Study destinations. The codes are stored in the database.
 * The names shown to visitors are in the message files under "countries".
 */
export const COUNTRIES = [
  "AU", "JP", "GB", "US", "CA", "KR", "NZ", "DE", "FR", "FI", "DK", "CY", "MT", "AE", "IN", "CN", "OTHER",
] as const;

export type CountryCode = (typeof COUNTRIES)[number];

/** The big tabs on the home page, in this order. */
export const FEATURED_COUNTRIES: CountryCode[] = ["AU", "JP", "GB", "US", "CA", "KR"];

export function isCountryCode(value: string): value is CountryCode {
  return (COUNTRIES as readonly string[]).includes(value);
}
