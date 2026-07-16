import type { ResearchProject, Researcher } from "@/types";

const NOW = "2026-01-01T00:00:00.000Z";

/** Local fallback — mirrors supabase/migrations/002_seed_stem_building_research.sql. */
export const RESEARCH_SEED: Record<
  string,
  { projects: ResearchProject[]; researchers: Researcher[] }
> = {
  "stem-building": {
    researchers: [
      {
        id: "a1111111-1111-4111-8111-111111111111",
        building_id: "stem-building",
        name: "Dr. Marcus Webb",
        title: "Associate Professor",
        department: "Physics",
        email: "mwebb@uapb.edu",
        avatar_url: null,
        specializations: ["Computational Modeling", "STEM Education"],
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    projects: [
      {
        id: "b2222222-2222-4222-8222-222222222222",
        building_id: "stem-building",
        title: "NSF HBCU-UP STEM Initiative",
        abstract:
          "Supports undergraduate research pathways and STEM faculty development at UAPB.",
        status: "active",
        funding_source: "National Science Foundation",
        grant_amount: 450000,
        grant_number: "NSF-HBCU-UP-2024",
        start_date: null,
        end_date: null,
        tags: ["STEM", "NSF", "Undergraduate Research"],
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  },
};

export function getResearchSeed(buildingId: string) {
  return RESEARCH_SEED[buildingId] ?? { projects: [], researchers: [] };
}
