/**
 * The one place for the site name.
 * The name is not decided yet. Change it here and it changes everywhere.
 * Never write the name directly in a page or a message file.
 */
export const SITE_NAME = "[SITE_NAME]";

/** Public address of the site. Set NEXT_PUBLIC_SITE_URL on Vercel. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** True only on the real, live site. Everywhere else we show the demo banner. */
export const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_SITE_ENV === "production";
