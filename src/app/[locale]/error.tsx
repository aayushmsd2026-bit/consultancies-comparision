"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("ui.error");
  return (
    <div className="page py-section">
      <EmptyState title={t("title")} body={t("body")} action={<Button onClick={reset}>{t("retry")}</Button>} />
    </div>
  );
}
