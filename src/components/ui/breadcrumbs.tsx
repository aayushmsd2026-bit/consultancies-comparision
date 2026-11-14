import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

/** The path back. The last item is the current page and is not a link. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const t = useTranslations("ui.breadcrumbs");
  return (
    <nav aria-label={t("label")} className={cn("text-small", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-8 items-center text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate font-semibold">
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
