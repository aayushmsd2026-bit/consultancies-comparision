"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/** EN / ने. Always visible in the header. Keeps the visitor on the same page. */
export function LanguageSwitch({ className }: { className?: string }) {
  const t = useTranslations("language");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className={cn("inline-flex rounded-full bg-paper-sunk p-1", className)}>
      {routing.locales.map((locale) => {
        const selected = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            lang={locale}
            hrefLang={locale}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "press grid min-h-11 min-w-11 place-items-center rounded-full px-3 text-small font-semibold",
              selected ? "bg-ink text-paper" : "text-ink hover:bg-line",
            )}
          >
            <span aria-hidden="true">{t(`${locale}Short`)}</span>
            <span className="sr-only">{t(locale)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
