/**
 * The one place for the site name.
 * The name is not decided yet. Change it here and it changes everywhere.
 * Never write the name directly in a page or a message file.
 */
export const SITE_NAME = "Rate My Consultancy";

/** Public address of the site. Set NEXT_PUBLIC_SITE_URL on Vercel. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** True only on the real, live site. Everywhere else we show the demo banner. */
export const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_SITE_ENV === "production";

/**
 * Where visitors and consultancies can write to the owner.
 * Shown on the About, Privacy, Terms and Review policy pages. Set NEXT_PUBLIC_CONTACT_EMAIL.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com";
