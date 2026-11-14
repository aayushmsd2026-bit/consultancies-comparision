import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listAdminConsultancies } from "@/lib/admin/data";
import { isAdminSession } from "@/lib/admin/auth";

/** Find a consultancy to edit. Suggestions that wait for approval are listed first. */
export default async function AdminConsultanciesPage({ searchParams }: PageProps<"/[locale]/admin/consultancies">) {
  // The layout shows the sign-in form to everyone else. Nothing is loaded for them.
  if (!(await isAdminSession())) return null;
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";
  const t = await getTranslations({ locale: "en", namespace: "admin.consultancies" });
  const rows = await listAdminConsultancies(q);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-sans text-heading font-semibold">{t("title")}</h1>
        <Link href="/admin/consultancies/new" className="inline-flex min-h-10 items-center rounded-[0.5rem] border border-ink bg-ink px-4 font-semibold text-paper">
          {t("add")}
        </Link>
      </div>
      <form method="get" className="my-3 flex max-w-lg gap-2">
        <label className="sr-only" htmlFor="admin-q">
          {t("search")}
        </label>
        <input
          id="admin-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t("search")}
          className="min-h-10 flex-1 rounded-[0.5rem] border border-line-strong bg-paper px-2 text-body"
        />
        <button type="submit" className="min-h-10 rounded-[0.5rem] border border-line-strong px-4 font-semibold">
          {t("go")}
        </button>
      </form>
      {rows.length === 0 ? (
        <p className="py-6 font-semibold">{t("none")}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/admin/consultancies/${row.id}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 hover:bg-paper-sunk">
                <span className="text-body font-semibold">{row.name}</span>
                {row.listingStatus === "pending" && (
                  <span className="rounded bg-warn-tint px-1.5 font-semibold text-warn">{t("pendingListing")}</span>
                )}
                <span className="text-ink-soft">
                  {row.city ?? "—"} · {t(row.registrationStatus)} · {row.reviewCount} {t("reviews")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
