/**
 * Reads the consultancy CSV and checks every row. Pure functions: no database here.
 * Used by scripts/import-consultancies.ts and by the admin import screen.
 *
 * Columns: name, registration_number, address, city, district, phone, website, countries
 * "countries" holds country codes separated by spaces or semicolons, for example "AU JP".
 * Extra columns are ignored.
 */
import { isCountryCode } from "@/config/countries";

export const CSV_COLUMNS = [
  "name",
  "registration_number",
  "address",
  "city",
  "district",
  "phone",
  "website",
  "countries",
] as const;

export type ImportBranch = {
  /** Line number in the file, counting the header as line 1. */
  line: number;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  isHeadOffice: boolean;
};

/** One consultancy. Rows with the same name are its branches. The first row is the head office. */
export type ImportConsultancy = {
  line: number;
  name: string;
  slug: string;
  registrationNumber: string | null;
  phone: string | null;
  website: string | null;
  countries: string[];
  branches: ImportBranch[];
};

export type ImportProblem = { line: number; message: string };

export type ImportResult = {
  consultancies: ImportConsultancy[];
  problems: ImportProblem[];
};

type CsvRow = { cells: string[]; line: number };

/**
 * Splits CSV text into rows. Handles quotes, commas inside quotes and line breaks
 * inside quotes. Remembers the line each row starts on. Empty rows are dropped.
 */
function parseCsvRows(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  const source = text.replace(/^\uFEFF/, "");

  const endRow = () => {
    cells.push(cell);
    if (cells.some((value) => value.trim() !== "")) rows.push({ cells, line: rowLine });
    cells = [];
    cell = "";
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      endRow();
      line++;
      rowLine = line;
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || cells.length > 0) endRow();
  return rows;
}

/** The cells of a CSV file, row by row. */
export function parseCsv(text: string): string[][] {
  return parseCsvRows(text).map((row) => row.cells);
}

/** "Example Education Pvt. Ltd." -> "example-education-pvt-ltd" */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * The web address of a consultancy page, made from its name.
 * Notes in brackets and company endings (Pvt. Ltd., P. Ltd., Private Limited) are left out:
 * "Example Education (P) Ltd." -> "example-education"
 */
export function consultancySlug(name: string): string {
  const tokens = slugify(name.replace(/\([^)]*\)/g, " ")).split("-");
  const endings = new Set(["pvt", "private", "p", "ltd", "limited"]);
  while (tokens.length > 1 && endings.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join("-");
}

const clean = (value: string | undefined): string | null => {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
};

function normalizeWebsite(value: string | null): string | null | undefined {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString().replace(/\/$/, "") : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Checks the whole file. Rows with a problem are left out and listed in `problems`.
 * Rows that share a name become one consultancy with several branches.
 */
export function readConsultancyCsv(text: string): ImportResult {
  const table = parseCsvRows(text);
  const problems: ImportProblem[] = [];
  if (table.length === 0) return { consultancies: [], problems: [{ line: 1, message: "The file is empty." }] };

  const header = table[0].cells.map((cell) => cell.trim().toLowerCase());
  const missing = CSV_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return { consultancies: [], problems: [{ line: 1, message: `Missing column(s): ${missing.join(", ")}.` }] };
  }
  const at = Object.fromEntries(CSV_COLUMNS.map((column) => [column, header.indexOf(column)])) as Record<
    (typeof CSV_COLUMNS)[number],
    number
  >;

  const bySlug = new Map<string, ImportConsultancy>();

  table.slice(1).forEach(({ cells, line }) => {
    const name = clean(cells[at.name]);
    if (!name || name.length < 2) {
      problems.push({ line, message: "The name is empty." });
      return;
    }
    if (name.length > 200) {
      problems.push({ line, message: "The name is longer than 200 characters." });
      return;
    }
    const slug = consultancySlug(name);
    if (!slug) {
      problems.push({ line, message: "The name has no Latin letters or numbers, so no web address can be made from it." });
      return;
    }

    const website = normalizeWebsite(clean(cells[at.website]));
    if (website === undefined) {
      problems.push({ line, message: `"${cells[at.website]}" is not a web address.` });
      return;
    }

    const countryCodes = (clean(cells[at.countries]) ?? "")
      .toUpperCase()
      .split(/[\s;|]+/)
      .filter(Boolean);
    const unknown = countryCodes.filter((code) => !isCountryCode(code));
    if (unknown.length > 0) {
      problems.push({ line, message: `Unknown country code(s): ${unknown.join(", ")}.` });
      return;
    }

    const branch: ImportBranch = {
      line,
      address: clean(cells[at.address]),
      city: clean(cells[at.city]),
      district: clean(cells[at.district]),
      phone: clean(cells[at.phone]),
      isHeadOffice: false,
    };
    const registrationNumber = clean(cells[at.registration_number]);

    const existing = bySlug.get(slug);
    if (!existing) {
      bySlug.set(slug, {
        line,
        name,
        slug,
        registrationNumber,
        phone: branch.phone,
        website,
        countries: [...new Set(countryCodes)],
        branches: [{ ...branch, isHeadOffice: true }],
      });
      return;
    }

    // Same name again: a branch of the consultancy we already have.
    if (registrationNumber && existing.registrationNumber && registrationNumber !== existing.registrationNumber) {
      problems.push({
        line,
        message: `Same name as line ${existing.line} but a different registration number. Give one of them a clearer name.`,
      });
      return;
    }
    const key = (b: ImportBranch) => `${(b.city ?? "").toLowerCase()}|${(b.address ?? "").toLowerCase()}`;
    if (existing.branches.some((b) => key(b) === key(branch))) {
      problems.push({ line, message: `Same name, city and address as line ${existing.line}. Skipped.` });
      return;
    }
    existing.branches.push(branch);
    existing.countries = [...new Set([...existing.countries, ...countryCodes])];
    existing.registrationNumber ??= registrationNumber;
    existing.website ??= website;
  });

  return { consultancies: [...bySlug.values()], problems };
}
