import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { ImportForm } from "@/components/admin/import-form";
import { isAdminSession } from "@/lib/admin/auth";

export default async function AdminImportPage() {
  // The layout shows the sign-in form to everyone else. Nothing is loaded for them.
  if (!(await isAdminSession())) return null;
  // "Today" depends on when the page is asked for.
  await connection();
  const t = await getTranslations({ locale: "en", namespace: "admin.import" });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());
  return (
    <>
      <h1 className="mb-3 font-sans text-heading font-semibold">{t("title")}</h1>
      <ImportForm today={today} />
    </>
  );
}
