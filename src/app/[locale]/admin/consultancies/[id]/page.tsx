import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ConsultancyForm, type BranchRow } from "@/components/admin/consultancy-form";
import type { ConsultancyFormInput } from "@/lib/admin/actions";
import { getAdminConsultancy } from "@/lib/admin/data";
import { isAdminSession } from "@/lib/admin/auth";

const EMPTY: ConsultancyFormInput = {
  name: "",
  nameNe: "",
  slug: "",
  listingStatus: "approved",
  registrationStatus: "unknown",
  registrationNumber: "",
  registrationSourceUrl: "",
  registrationCheckedOn: "",
  officialGrade: "",
  website: "",
  phone: "",
  email: "",
  description: "",
  countries: [],
  isClaimed: false,
};

// Admin pages are made when asked for. Next.js needs one example address to check the page.
export function generateStaticParams() {
  return [{ id: "new" }];
}

/** /admin/consultancies/new adds one. /admin/consultancies/<id> edits one. */
export default async function AdminConsultancyPage({ params }: PageProps<"/[locale]/admin/consultancies/[id]">) {
  // The layout shows the sign-in form to everyone else. Nothing is loaded for them.
  if (!(await isAdminSession())) return null;
  const { id } = await params;
  const t = await getTranslations({ locale: "en", namespace: "admin.consultancies" });

  if (id === "new") {
    return (
      <>
        <h1 className="mb-3 font-sans text-heading font-semibold">{t("newTitle")}</h1>
        <ConsultancyForm consultancyId={null} initial={EMPTY} branches={[]} />
      </>
    );
  }

  const row = await getAdminConsultancy(id);
  if (!row) notFound();
  const initial: ConsultancyFormInput = {
    name: row.name,
    nameNe: row.name_ne ?? "",
    slug: row.slug,
    listingStatus: row.listing_status,
    registrationStatus: row.registration_status,
    registrationNumber: row.registration_number ?? "",
    registrationSourceUrl: row.registration_source_url ?? "",
    // The calendar day in Nepal.
    registrationCheckedOn: row.registration_checked_at
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date(row.registration_checked_at))
      : "",
    officialGrade: row.official_grade ?? "",
    website: row.website ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    description: row.description ?? "",
    countries: row.countries ?? [],
    isClaimed: row.is_claimed,
  };

  return (
    <>
      <h1 className="mb-3 font-sans text-heading font-semibold">
        {t("editTitle")}: {row.name}
      </h1>
      {/* The key makes the form start fresh when the saved data changes. */}
      <ConsultancyForm key={row.updated_at} consultancyId={row.id} initial={initial} branches={(row.branches ?? []) as BranchRow[]} />
    </>
  );
}
