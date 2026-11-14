import { PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlobalSearch } from "@/components/consultancy/global-search";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "./button";
import { LanguageSwitch } from "./language-switch";
import { Logo } from "./logo";

const links = [
  { href: "/compare", key: "compare" },
  { href: "/guides", key: "guides" },
] as const;

/**
 * Top bar: logo, Search, Compare, Guides, the language switch and one primary button.
 * On phones and tablets the links move to the bottom tab bar. The language switch always stays.
 */
export function Header() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="page flex min-h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={t("home")} className="rounded-control">
          <Logo />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label={t("main")} className="hidden lg:block">
            <ul className="flex items-center">
              <li>
                <GlobalSearch />
              </li>
              {links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-12 items-center rounded-full px-4 font-semibold hover:bg-paper-sunk"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitch />
          <div className="hidden lg:block">
            <ButtonLink href="/review/new" icon={<PenLine aria-hidden="true" className="size-5" />}>
              {t("write")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
