"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { Link, useRouter } from "@/i18n/navigation";
import { rejectReviewAction, resolveReportAction } from "@/lib/admin/actions";
import type { AdminReport } from "@/lib/admin/data";

const button =
  "inline-flex min-h-9 items-center rounded-[0.5rem] border border-line-strong px-3 font-semibold hover:bg-paper-sunk disabled:opacity-50";

/** Open reports from visitors. Two choices: keep the review, or reject it. Both close the report. */
export function ReportsList({ reports, dates }: { reports: AdminReport[]; dates: Record<string, string> }) {
  const t = useTranslations("admin.reports");
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState(reports);
  const [busy, setBusy] = useState(false);

  async function close(report: AdminReport, rejectReview: boolean) {
    setBusy(true);
    if (rejectReview) {
      const rejected = await rejectReviewAction(report.review.id, `Reported: ${t(`reasons.${report.reason as "fake"}`)}`);
      if (!rejected.ok) {
        setBusy(false);
        return toast(rejected.error, "bad");
      }
    }
    const result = await resolveReportAction(report.id, rejectReview ? "Review rejected" : "Review kept");
    setBusy(false);
    if (!result.ok) return toast(result.error, "bad");
    toast(t("resolved"));
    setItems((list) => list.filter((item) => item.id !== report.id));
    router.refresh();
  }

  if (items.length === 0) return <p className="py-10 text-body font-semibold">{t("empty")}</p>;

  return (
    <ol className="grid gap-3">
      {items.map((report) => (
        <li key={report.id} className="rounded-[0.75rem] border border-line-strong bg-paper-raised p-3">
          <p>
            <span className="font-semibold">{t("reason")}:</span> {t(`reasons.${report.reason as "fake"}`)}
            {report.details && <> · {report.details}</>} <span className="tabular text-ink-soft">· {dates[report.id]}</span>
          </p>
          <p className="mt-2 font-semibold">
            {t("review")}:{" "}
            <Link href={`/consultancies/${report.review.consultancySlug}`} className="underline underline-offset-2">
              {report.review.consultancyName}
            </Link>{" "}
            <span className="font-normal text-ink-soft">({report.review.status})</span>
          </p>
          <p className="mt-1 whitespace-pre-line break-words text-body">{report.review.wentWell}</p>
          <p className="mt-1 whitespace-pre-line break-words text-body">{report.review.wentBadly}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={button} disabled={busy} onClick={() => close(report, false)}>
              {t("keep")}
            </button>
            {report.review.status !== "rejected" && (
              <button type="button" className={`${button} border-bad text-bad`} disabled={busy} onClick={() => close(report, true)}>
                {t("rejectReview")}
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
