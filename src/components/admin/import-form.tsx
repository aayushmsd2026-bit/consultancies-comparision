"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { importCsvAction, type ImportActionResult } from "@/lib/admin/actions";
import { REGISTRATION_STATUSES, type RegistrationStatus } from "@/lib/types";

const input = "min-h-10 w-full rounded-[0.5rem] border border-line-strong bg-paper px-2 text-body";
const button =
  "inline-flex min-h-10 items-center rounded-[0.5rem] border border-line-strong px-4 font-semibold hover:bg-paper-sunk disabled:opacity-50";

/** Upload a CSV, check it, then import it. Uses the same code as the import script. */
export function ImportForm({ today }: { today: string }) {
  const t = useTranslations("admin.import");
  const tStatus = useTranslations("admin.consultancies");
  const toast = useToast();
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState<RegistrationStatus>("registered");
  const [sourceUrl, setSourceUrl] = useState("");
  const [checkedOn, setCheckedOn] = useState(today);
  const [busy, setBusy] = useState<"check" | "import" | null>(null);
  const [result, setResult] = useState<Extract<ImportActionResult, { ok: true }> | null>(null);

  async function go(dryRun: boolean) {
    setBusy(dryRun ? "check" : "import");
    const answer = await importCsvAction(csv, { registrationStatus: status, sourceUrl, checkedOn, dryRun });
    setBusy(null);
    if (!answer.ok) {
      setResult(null);
      return toast(answer.error, "bad");
    }
    setResult(answer);
  }

  const numbers = result && {
    added: result.summary.consultanciesAdded,
    updated: result.summary.consultanciesUpdated,
    branchesAdded: result.summary.branchesAdded,
    branchesUpdated: result.summary.branchesUpdated,
  };

  return (
    <div className="grid max-w-2xl gap-3">
      <p className="text-ink-soft">{t("intro")}</p>
      <label className="block font-semibold">
        {t("file")}
        <input
          className={`${input} py-1.5`}
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            setResult(null);
            setCsv((await e.target.files?.[0]?.text()) ?? "");
          }}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block font-semibold">
          {t("status")}
          <select className={input} value={status} onChange={(e) => setStatus(e.target.value as RegistrationStatus)}>
            {REGISTRATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {tStatus(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-semibold">
          {t("checkedOn")}
          <input className={input} type="date" value={checkedOn} onChange={(e) => setCheckedOn(e.target.value)} />
        </label>
      </div>
      <label className="block font-semibold">
        {t("sourceUrl")}
        <input className={input} type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={!csv || busy !== null} onClick={() => go(true)}>
          {busy === "check" ? t("checking") : t("check")}
        </button>
        {/* Import is offered only after a successful check of this exact file. */}
        <button
          type="button"
          className={`${button} border-ink bg-ink text-paper hover:bg-ink`}
          disabled={!result?.summary.dryRun || busy !== null}
          onClick={() => go(false)}
        >
          {busy === "import" ? t("importing") : t("run")}
        </button>
      </div>

      {result && numbers && (
        <div role="status" className="rounded-[0.5rem] border border-line-strong p-3">
          <p>{t("readResult", { consultancies: result.consultancies, branches: result.branches })}</p>
          <p className="font-semibold">{result.summary.dryRun ? t("wouldAdd", numbers) : t("didAdd", numbers)}</p>
          {result.problems.length === 0 ? (
            <p className="text-ok">{t("noProblems")}</p>
          ) : (
            <>
              <p className="mt-2 font-semibold text-bad">{t("problems", { count: result.problems.length })}</p>
              <ul className="max-h-64 overflow-auto">
                {result.problems.map((problem) => (
                  <li key={`${problem.line}-${problem.message}`}>
                    {t("line", { line: problem.line })}: {problem.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
