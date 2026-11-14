import { getTranslations } from "next-intl/server";
import { ReportsList } from "@/components/admin/reports-list";
import { getOpenReports } from "@/lib/admin/data";
import { isAdminSession } from "@/lib/admin/auth";

export default async function AdminReportsPage() {
  // The layout shows the sign-in form to everyone else. Nothing is loaded for them.
  if (!(await isAdminSession())) return null;
  const t = await getTranslations({ locale: "en", namespace: "admin.reports" });
  const reports = await getOpenReports();
  const dates = Object.fromEntries(
    reports.map((report) => [
      report.id,
      new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kathmandu" }).format(
        new Date(report.createdAt),
      ),
    ]),
  );
  return (
    <>
      <h1 className="mb-3 font-sans text-heading font-semibold">{t("title")}</h1>
      <ReportsList reports={reports} dates={dates} />
    </>
  );
}
