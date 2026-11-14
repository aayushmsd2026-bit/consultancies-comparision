"use client";

import { useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { TextArea } from "@/components/ui/field";
import { submitReportAction } from "@/lib/review/actions";
import { REPORT_REASONS } from "@/lib/review/schema";

type Reason = (typeof REPORT_REASONS)[number];

/** A simple form: pick a reason, add detail if you want, send. */
export function ReportForm({ reviewId, consultancySlug }: { reviewId: string; consultancySlug: string }) {
  const t = useTranslations("report");
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!reason) return setError(t("errors.required"));
    setSending(true);
    setError(null);
    const result = await submitReportAction({ reviewId, reason, details });
    setSending(false);
    if (result.ok) setDone(true);
    else setError(t(`errors.${result.error}`));
  }

  if (done) {
    return (
      <div role="status" className="rounded-block bg-ok-tint p-8">
        <CircleCheck aria-hidden="true" className="size-10 animate-pop text-ok" />
        <h2 className="mt-4 text-title">{t("thanksTitle")}</h2>
        <p className="mt-2 text-ink">{t("thanksBody")}</p>
        <p className="mt-6">
          <ButtonLink href={`/consultancies/${consultancySlug}`} variant="secondary">
            {t("back")}
          </ButtonLink>
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-6">
      <ChoiceCards
        legend={t("reasonTitle")}
        name="reason"
        value={reason}
        onChange={(value) => {
          setReason(value);
          setError(null);
        }}
        choices={REPORT_REASONS.map((value) => ({ value, label: t(`reasons.${value}`) }))}
      />
      <TextArea
        label={t("details")}
        hint={t("detailsHint")}
        rows={4}
        maxLength={1000}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      {error && (
        <p role="alert" className="font-semibold text-bad">
          {error}
        </p>
      )}
      <p>
        <Button type="submit" size="lg" loading={sending}>
          {sending ? t("sending") : t("submit")}
        </Button>
      </p>
    </form>
  );
}
