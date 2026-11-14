"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { ConsultancySearch } from "./consultancy-search";

/**
 * The "Search" button in the header. It opens search in a window on top of the page.
 * Cmd + K (Mac) or Ctrl + K (Windows) opens it from anywhere.
 */
export function GlobalSearch() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="press inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-semibold hover:bg-paper-sunk"
      >
        <Search aria-hidden="true" className="size-5" />
        {t("search")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("searchTitle")} className="overflow-visible sm:mt-24">
        {/* Rendered only while open, so the field is fresh and focused each time. */}
        {open && <ConsultancySearch autoFocus onNavigate={() => setOpen(false)} />}
        <p className="mt-4 min-h-40 text-small text-ink-soft sm:min-h-0">{t("searchHint")}</p>
      </Dialog>
    </>
  );
}
