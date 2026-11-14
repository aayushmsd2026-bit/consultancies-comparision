"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { COUNTRIES, type CountryCode } from "@/config/countries";
import { Link, useRouter } from "@/i18n/navigation";
import { addBranchAction, deleteBranchAction, saveConsultancyAction, type ConsultancyFormInput } from "@/lib/admin/actions";
import { REGISTRATION_STATUSES } from "@/lib/types";

const input = "min-h-10 w-full rounded-[0.5rem] border border-line-strong bg-paper px-2 text-body";
const label = "block font-semibold";
const button =
  "inline-flex min-h-10 items-center rounded-[0.5rem] border border-line-strong px-4 font-semibold hover:bg-paper-sunk disabled:opacity-50";

export type BranchRow = { id: string; city: string | null; district: string | null; address: string | null; phone: string | null; is_head_office: boolean };

type Props = {
  consultancyId: string | null;
  initial: ConsultancyFormInput;
  branches: BranchRow[];
};

/** Add or edit a consultancy: details, registration status, the date last checked, and branches. */
export function ConsultancyForm({ consultancyId, initial, branches }: Props) {
  const t = useTranslations("admin.consultancies");
  const tCountry = useTranslations("countries");
  const toast = useToast();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [branch, setBranch] = useState({ city: "", district: "", address: "", phone: "", isHeadOffice: branches.length === 0 });

  const set = <K extends keyof ConsultancyFormInput>(key: K, value: ConsultancyFormInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const text = (key: keyof ConsultancyFormInput) => ({
    value: (values[key] as string | null) ?? "",
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never),
  });

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await saveConsultancyAction(consultancyId, values);
    setBusy(false);
    if (!result.ok) return toast(result.error, "bad");
    toast(t("saved"));
    if (consultancyId) router.refresh();
    else router.push(`/admin/consultancies/${result.id}`);
  }

  async function addBranch() {
    if (!consultancyId) return;
    setBusy(true);
    const result = await addBranchAction(consultancyId, branch);
    setBusy(false);
    if (!result.ok) return toast(result.error, "bad");
    toast(t("branchAdded"));
    setBranch({ city: "", district: "", address: "", phone: "", isHeadOffice: false });
    router.refresh();
  }

  async function removeBranch(branchId: string) {
    setBusy(true);
    const result = await deleteBranchAction(branchId);
    setBusy(false);
    if (!result.ok) return toast(result.error, "bad");
    toast(t("branchDeleted"));
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <form onSubmit={save} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>
            {t("name")}
            <input className={input} required {...text("name")} />
          </label>
          <label className={label}>
            {t("nameNe")}
            <input className={input} lang="ne" {...text("nameNe")} />
          </label>
        </div>
        <label className={label}>
          {t("slug")}
          <input className={input} {...text("slug")} />
          <span className="font-normal text-ink-soft">{t("slugHint")}</span>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>
            {t("listingStatus")}
            <select className={input} value={values.listingStatus} onChange={(e) => set("listingStatus", e.target.value as "approved" | "pending")}>
              <option value="approved">{t("listingApproved")}</option>
              <option value="pending">{t("listingPending")}</option>
            </select>
          </label>
          <label className={label}>
            {t("registrationStatus")}
            <select
              className={input}
              value={values.registrationStatus}
              onChange={(e) => set("registrationStatus", e.target.value as ConsultancyFormInput["registrationStatus"])}
            >
              {REGISTRATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(status)}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            {t("checkedOn")}
            <input className={input} type="date" {...text("registrationCheckedOn")} />
          </label>
          <label className={label}>
            {t("registrationNumber")}
            <input className={input} {...text("registrationNumber")} />
          </label>
        </div>
        <label className={label}>
          {t("sourceUrl")}
          <input className={input} type="url" {...text("registrationSourceUrl")} />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>
            {t("website")}
            <input className={input} type="url" {...text("website")} />
          </label>
          <label className={label}>
            {t("grade")}
            <input className={input} {...text("officialGrade")} />
          </label>
          <label className={label}>
            {t("phone")}
            <input className={input} {...text("phone")} />
          </label>
          <label className={label}>
            {t("email")}
            <input className={input} type="email" {...text("email")} />
          </label>
        </div>
        <label className={label}>
          {t("description")}
          <textarea className={`${input} py-2`} rows={4} {...text("description")} />
        </label>

        <fieldset>
          <legend className="font-semibold">{t("countries")}</legend>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {COUNTRIES.filter((code) => code !== "OTHER").map((code) => (
              <label key={code} className="inline-flex min-h-8 items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={values.countries.includes(code)}
                  onChange={(e) =>
                    set(
                      "countries",
                      e.target.checked
                        ? [...values.countries, code]
                        : values.countries.filter((c: CountryCode) => c !== code),
                    )
                  }
                />
                {tCountry(code)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="inline-flex min-h-8 items-center gap-1.5">
          <input type="checkbox" checked={values.isClaimed} onChange={(e) => set("isClaimed", e.target.checked)} />
          {t("claimed")}
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={`${button} border-ink bg-ink text-paper hover:bg-ink`} disabled={busy}>
            {t("save")}
          </button>
          {consultancyId && values.listingStatus === "approved" && (
            <Link href={`/consultancies/${initial.slug}`} className="underline underline-offset-2">
              {t("view")}
            </Link>
          )}
        </div>
      </form>

      <section>
        <h2 className="font-sans text-body font-semibold">{t("branches")}</h2>
        {!consultancyId ? (
          <p className="mt-2 text-ink-soft">{t("saveFirst")}</p>
        ) : (
          <>
            <ul className="mt-2 grid gap-2">
              {branches.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-2 rounded-[0.5rem] border border-line-strong p-2">
                  <span>
                    <span className="font-semibold">{row.city ?? "—"}</span>
                    {row.is_head_office && ` (${t("headOffice")})`}
                    <br />
                    {[row.address, row.district, row.phone].filter(Boolean).join(" · ")}
                  </span>
                  <button type="button" className={button} disabled={busy} onClick={() => removeBranch(row.id)}>
                    {t("deleteBranch")}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 rounded-[0.5rem] border border-dashed border-line-strong p-2">
              {(["city", "district", "address", "phone"] as const).map((field) => (
                <label key={field} className={label}>
                  {t(field)}
                  <input className={input} value={branch[field]} onChange={(e) => setBranch({ ...branch, [field]: e.target.value })} />
                </label>
              ))}
              <label className="inline-flex min-h-8 items-center gap-1.5">
                <input type="checkbox" checked={branch.isHeadOffice} onChange={(e) => setBranch({ ...branch, isHeadOffice: e.target.checked })} />
                {t("headOffice")}
              </label>
              <button type="button" className={button} disabled={busy} onClick={addBranch}>
                {t("addBranch")}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
