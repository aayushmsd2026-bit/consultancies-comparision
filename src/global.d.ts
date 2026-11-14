import type messages from "../messages/en.json";
import type { routing } from "@/i18n/routing";

// Makes message keys and locales type-checked. A typo in a key is a build error.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
