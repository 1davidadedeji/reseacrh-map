#!/usr/bin/env node
/**
 * Applies stem-building seed data via Supabase REST (requires service role key).
 * Usage: node scripts/seed-stem-building.mjs
 *
 * Or run supabase/migrations/002_seed_stem_building_research.sql in the
 * Supabase Dashboard → SQL Editor.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Run this SQL in Supabase Dashboard instead:\n" +
      "  supabase/migrations/002_seed_stem_building_research.sql"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const researcher = {
  id: "a1111111-1111-4111-8111-111111111111",
  building_id: "stem-building",
  name: "Dr. Marcus Webb",
  title: "Associate Professor",
  department: "Physics",
  email: "mwebb@uapb.edu",
  specializations: ["Computational Modeling", "STEM Education"],
};

const project = {
  id: "b2222222-2222-4222-8222-222222222222",
  building_id: "stem-building",
  title: "NSF HBCU-UP STEM Initiative",
  abstract:
    "Supports undergraduate research pathways and STEM faculty development at UAPB.",
  status: "active",
  funding_source: "National Science Foundation",
  grant_amount: 450000,
  grant_number: "NSF-HBCU-UP-2024",
  tags: ["STEM", "NSF", "Undergraduate Research"],
};

const { error: rErr } = await supabase.from("researchers").upsert(researcher);
if (rErr) {
  console.error("Researcher seed failed:", rErr.message);
  process.exit(1);
}

const { error: pErr } = await supabase.from("research_projects").upsert(project);
if (pErr) {
  console.error("Project seed failed:", pErr.message);
  process.exit(1);
}

const { error: jErr } = await supabase.from("project_researchers").upsert({
  project_id: project.id,
  researcher_id: researcher.id,
  role: "Principal Investigator",
});

if (jErr) {
  console.error("Join seed failed:", jErr.message);
  process.exit(1);
}

console.log("✅ Seeded stem-building research project + researcher");
