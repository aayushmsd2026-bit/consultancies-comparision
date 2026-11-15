import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { IS_PRODUCTION } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** "Demo data. Not real reviews." Shown everywhere except on the real, live site. */
export function DemoBanner() {
  const t = useTranslations("common");
  if (IS_PRODUCTION) return null;
  return (
    <aside aria-label={t("notice")} className="bg-spark text-spark-ink">
      <p className="flex min-h-10 items-center justify-center gap-2 px-4 py-1 text-center text-small font-semibold">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        {t("demoBanner")}
      </p>
      {/* A reminder for the owner on a fresh deploy. Never shown on the live site. */}
      {!isSupabaseConfigured() && (
        <p className="border-t border-spark-ink/20 px-4 py-1 text-center text-small">{t("noDatabase")}</p>
      )}
    </aside>
  );
}
