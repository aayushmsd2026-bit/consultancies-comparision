import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ne"],
  defaultLocale: "en",
  // Every address starts with /en or /ne. Simple for search engines and for caching.
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
