import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { IS_PRODUCTION } from "@/config/site";

/** "Demo data. Not real reviews." Shown everywhere except on the real, live site. */
export function DemoBanner() {
  const t = useTranslations("common");
  if (IS_PRODUCTION) return null;
  return (
    <p className="flex min-h-10 items-center justify-center gap-2 bg-spark px-4 py-1 text-center text-small font-semibold text-spark-ink">
      <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
      {t("demoBanner")}
    </p>
  );
}
