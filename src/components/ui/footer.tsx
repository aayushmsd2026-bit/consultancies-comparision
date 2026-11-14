import { useTranslations } from "next-intl";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";

const columns = [
  {
    key: "explore",
    links: [
      { href: "/consultancies", key: "search" },
      { href: "/check", key: "check" },
      { href: "/compare", key: "compare" },
      { href: "/guides", key: "guides" },
      { href: "/review/new", key: "write" },
    ],
  },
  {
    key: "trust",
    links: [
      { href: "/review-policy", key: "reviewPolicy" },
      { href: "/about", key: "about" },
      { href: "/privacy", key: "privacy" },
      { href: "/terms", key: "terms" },
    ],
  },
] as const;

/** Dark ink block at the end of every page. Extra bottom space on phones for the tab bar. */
export function Footer() {
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");
  return (
    <footer data-theme="dark" className="pt-16 pb-28 md:pb-16">
      <div className="page grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm font-display text-heading">{tFooter("promise")}</p>
          <p className="mt-2 max-w-sm text-small text-ink-soft">{tFooter("independent")}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.key} aria-label={tFooter(column.key)}>
            <h2 className="font-sans text-small font-semibold text-ink-soft">{tFooter(column.key)}</h2>
            <ul className="mt-2">
              {column.links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-12 items-center font-semibold underline-offset-4 hover:underline"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="page mt-12 text-small text-ink-soft">{tFooter("copyright", { siteName: SITE_NAME })}</p>
    </footer>
  );
}
