"use client";

import { BookOpen, House, PenLine, Search, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const tabs: { href: string; key: "home" | "search" | "writeShort" | "guides"; icon: LucideIcon }[] = [
  { href: "/", key: "home", icon: House },
  { href: "/consultancies", key: "search", icon: Search },
  { href: "/review/new", key: "writeShort", icon: PenLine },
  { href: "/guides", key: "guides", icon: BookOpen },
];

/** Phone navigation: four thumb-sized tabs fixed to the bottom of the screen. */
export function BottomTabBar({ preview = false }: { /** Styleguide only: show it inside a box at any screen width. */ preview?: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("tabs")}
      className={cn(
        "inset-x-0 bottom-0 border-t border-line bg-paper/95 backdrop-blur-sm",
        preview ? "absolute" : "fixed z-30 pb-[env(safe-area-inset-bottom)] md:hidden",
      )}
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, key, icon: Icon }) => {
          const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "press flex min-h-16 flex-col items-center justify-center gap-1 text-micro",
                  current ? "font-semibold text-ink" : "text-ink-soft",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors duration-150",
                    current && "bg-signature text-signature-ink",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
