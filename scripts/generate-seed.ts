/**
 * Writes supabase/seed.sql from supabase/seed-data.ts.
 * Run: npm run seed:build
 */
import { writeFileSync } from "node:fs";
import { buildSeedSql } from "../src/lib/seed-sql";

writeFileSync("supabase/seed.sql", buildSeedSql());
console.log("Wrote supabase/seed.sql");
