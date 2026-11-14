import { getTranslations } from "next-intl/server";
import { getAuditLog } from "@/lib/admin/data";
import { isAdminSession } from "@/lib/admin/auth";

/** Every admin action, newest first. Nobody can edit or delete these rows. */
export default async function AdminLogPage() {
  // The layout shows the sign-in form to everyone else. Nothing is loaded for them.
  if (!(await isAdminSession())) return null;
  const t = await getTranslations({ locale: "en", namespace: "admin.log" });
  const rows = await getAuditLog();
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kathmandu" });

  return (
    <>
      <h1 className="mb-3 font-sans text-heading font-semibold">{t("title")}</h1>
      {rows.length === 0 ? (
        <p className="py-6 font-semibold">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line-strong">
                {(["when", "who", "action", "target", "note"] as const).map((column) => (
                  <th key={column} scope="col" className="py-1.5 pr-4 font-semibold">
                    {t(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line align-top">
                  <td className="tabular py-1.5 pr-4 whitespace-nowrap">{when.format(new Date(row.createdAt))}</td>
                  <td className="py-1.5 pr-4">{row.actor}</td>
                  <td className="py-1.5 pr-4 font-semibold">{row.action}</td>
                  <td className="py-1.5 pr-4 text-ink-soft">
                    {row.table}
                    {row.targetId && <span className="tabular"> · {row.targetId.slice(0, 8)}</span>}
                  </td>
                  <td className="py-1.5">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
