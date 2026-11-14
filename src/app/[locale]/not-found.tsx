import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <div className="page py-section">
      <EmptyState
        title={t("notFoundTitle")}
        body={t("notFoundBody")}
        action={<ButtonLink href="/">{t("backHome")}</ButtonLink>}
      />
    </div>
  );
}
