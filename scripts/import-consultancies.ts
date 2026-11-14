/**
 * Imports consultancies from a CSV file into the database.
 *
 *   npm run import -- --file data/sample-consultancies.csv --dry-run
 *   npm run import -- --file data/consultancies.csv --source-url https://... 
 *
 * Options
 *   --file <path>         The CSV file. Required.
 *   --dry-run             Check the file and show what would happen. Writes nothing.
 *   --status <status>     registered (default), unknown, expired or not_found.
 *   --source-url <url>    Link to the official list. Shown next to the registration badge.
 *   --checked-on <date>   The day the list was checked, as YYYY-MM-DD. Default: today.
 *
 * The script reads the database address and the secret key from .env.local.
 * It adds and updates consultancies and branches. It never touches reviews.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { readConsultancyCsv } from "../src/lib/import/consultancy-csv";
import { importConsultancies } from "../src/lib/import/run-import";
import { REGISTRATION_STATUSES, type RegistrationStatus } from "../src/lib/types";

function loadEnvFile(path: string) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // No file: the values must already be in the environment.
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      file: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      status: { type: "string", default: "registered" },
      "source-url": { type: "string" },
      "checked-on": { type: "string" },
    },
  });

  if (!values.file) throw new Error("Tell me which file to import: --file data/consultancies.csv");
  if (!REGISTRATION_STATUSES.includes(values.status as RegistrationStatus)) {
    throw new Error(`--status must be one of: ${REGISTRATION_STATUSES.join(", ")}`);
  }
  const checkedOn = values["checked-on"] ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) throw new Error("--checked-on must look like 2026-11-14");

  const { consultancies, problems } = readConsultancyCsv(readFileSync(values.file, "utf8"));
  const branchCount = consultancies.reduce((sum, c) => sum + c.branches.length, 0);
  console.log(`Read ${values.file}: ${consultancies.length} consultancies, ${branchCount} branches.`);

  if (problems.length > 0) {
    console.log(`\n${problems.length} row(s) have a problem and will be skipped:`);
    for (const problem of problems) console.log(`  line ${problem.line}: ${problem.message}`);
    console.log("");
  }
  if (consultancies.length === 0) throw new Error("Nothing to import.");

  loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local.");
  }
  console.log(`Database: ${url}`);

  const client = createClient(url, secret, { auth: { persistSession: false } });
  const summary = await importConsultancies(client, consultancies, {
    registrationStatus: values.status as RegistrationStatus,
    sourceUrl: values["source-url"] ?? null,
    checkedAt: `${checkedOn}T06:00:00+05:45`,
    dryRun: values["dry-run"],
  });

  const verb = summary.dryRun ? "Would add" : "Added";
  const verb2 = summary.dryRun ? "would update" : "updated";
  console.log(`${verb} ${summary.consultanciesAdded} consultancies, ${verb2} ${summary.consultanciesUpdated}.`);
  console.log(`${verb} ${summary.branchesAdded} branches, ${verb2} ${summary.branchesUpdated}.`);
  console.log(summary.dryRun ? "Dry run: nothing was written." : "Done. No reviews were created or changed.");
}

main().catch((error: unknown) => {
  console.error(`\nImport stopped: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
