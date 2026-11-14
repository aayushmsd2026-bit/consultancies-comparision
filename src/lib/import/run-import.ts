/**
 * Writes checked CSV rows into the database: adds new consultancies and branches,
 * updates the ones that already exist. It never creates, changes or deletes a review.
 *
 * Needs a Supabase client made with the secret (server) key.
 * Used by scripts/import-consultancies.ts and by the admin import screen.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegistrationStatus } from "@/lib/types";
import type { ImportConsultancy } from "./consultancy-csv";

export type ImportOptions = {
  /** What being on this list means. The ministry's approved list means "registered". */
  registrationStatus: RegistrationStatus;
  /** Link to the official list. Shown next to every registration badge. */
  sourceUrl: string | null;
  /** When the list was checked (ISO date). */
  checkedAt: string;
  /** Check everything but write nothing. */
  dryRun?: boolean;
};

export type ImportSummary = {
  consultanciesAdded: number;
  consultanciesUpdated: number;
  branchesAdded: number;
  branchesUpdated: number;
  dryRun: boolean;
};

const CHUNK = 200;

function chunks<T>(list: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));
}

/** Reads every row of a table, 1000 at a time. */
async function selectAll<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select(columns).order("id").range(from, from + 999);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    all.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return all;
  }
}

const branchKey = (city: string | null, address: string | null) =>
  `${(city ?? "").trim().toLowerCase()}|${(address ?? "").trim().toLowerCase()}`;

export async function importConsultancies(
  client: SupabaseClient,
  consultancies: ImportConsultancy[],
  options: ImportOptions,
): Promise<ImportSummary> {
  const dryRun = options.dryRun ?? false;
  const summary: ImportSummary = {
    consultanciesAdded: 0,
    consultanciesUpdated: 0,
    branchesAdded: 0,
    branchesUpdated: 0,
    dryRun,
  };

  const existing = await selectAll<{ id: string; slug: string }>(client, "consultancies", "id, slug");
  const idBySlug = new Map(existing.map((row) => [row.slug, row.id]));

  const registration = {
    registration_status: options.registrationStatus,
    registration_source_url: options.sourceUrl,
    registration_checked_at: options.checkedAt,
  };

  // 1. New consultancies, in batches.
  const fresh = consultancies.filter((c) => !idBySlug.has(c.slug));
  summary.consultanciesAdded = fresh.length;
  if (!dryRun) {
    for (const batch of chunks(fresh, CHUNK)) {
      const { data, error } = await client
        .from("consultancies")
        .insert(
          batch.map((c) => ({
            slug: c.slug,
            name: c.name,
            listing_status: "approved",
            registration_number: c.registrationNumber,
            website: c.website,
            phone: c.phone,
            countries: c.countries,
            ...registration,
          })),
        )
        .select("id, slug");
      if (error) throw new Error(`Could not add consultancies: ${error.message}`);
      for (const row of data ?? []) idBySlug.set(row.slug, row.id);
    }
  }

  // 2. Consultancies we already have. Only fields the file really has are overwritten.
  const known = consultancies.filter((c) => !fresh.includes(c));
  summary.consultanciesUpdated = known.length;
  if (!dryRun) {
    for (const c of known) {
      const { error } = await client
        .from("consultancies")
        .update({
          name: c.name,
          ...(c.registrationNumber && { registration_number: c.registrationNumber }),
          ...(c.website && { website: c.website }),
          ...(c.phone && { phone: c.phone }),
          ...(c.countries.length > 0 && { countries: c.countries }),
          ...registration,
        })
        .eq("slug", c.slug);
      if (error) throw new Error(`Could not update "${c.name}": ${error.message}`);
    }
  }

  // 3. Branches. A branch is "the same" when the city and address match.
  type BranchRow = { id: string; consultancy_id: string; city: string | null; address: string | null };
  const existingBranches = await selectAll<BranchRow>(client, "branches", "id, consultancy_id, city, address");
  const branchIds = new Map(existingBranches.map((b) => [`${b.consultancy_id}|${branchKey(b.city, b.address)}`, b.id]));

  const newBranches: Record<string, unknown>[] = [];
  for (const c of consultancies) {
    const consultancyId = idBySlug.get(c.slug);
    for (const b of c.branches) {
      const row = {
        city: b.city,
        district: b.district,
        address: b.address,
        phone: b.phone,
        is_head_office: b.isHeadOffice,
      };
      const branchId = consultancyId && branchIds.get(`${consultancyId}|${branchKey(b.city, b.address)}`);
      if (branchId) {
        summary.branchesUpdated += 1;
        if (!dryRun) {
          const { error } = await client.from("branches").update(row).eq("id", branchId);
          if (error) throw new Error(`Could not update a branch of "${c.name}": ${error.message}`);
        }
      } else {
        summary.branchesAdded += 1;
        if (consultancyId) newBranches.push({ consultancy_id: consultancyId, ...row });
      }
    }
  }
  if (!dryRun) {
    for (const batch of chunks(newBranches, CHUNK)) {
      const { error } = await client.from("branches").insert(batch);
      if (error) throw new Error(`Could not add branches: ${error.message}`);
    }
  }

  return summary;
}
