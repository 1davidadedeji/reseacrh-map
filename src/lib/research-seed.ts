import type { ResearchProject, Researcher } from "@/types";
import { BUILDINGS_SEED } from "@/lib/buildings-seed";

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
        bio: "Dr. Webb studies computational approaches to condensed-matter physics and leads UAPB's NSF-funded STEM education initiative, mentoring undergraduate researchers in scientific computing.",
        photo_url: null,
        awards: [
          "UAPB Faculty Excellence in Research Award (2023)",
          "NSF Early Career Mentor Recognition (2021)",
        ],
        publications: [
          { title: "Computational Models of Disordered Lattice Systems", year: 2023, url: "https://doi.org/10.1000/example-webb-2023" },
          { title: "Bridging Undergraduate Research and STEM Retention at HBCUs", year: 2022 },
        ],
        website_url: "https://www.uapb.edu/academics/physics/webb",
        google_scholar_url: "https://scholar.google.com/citations?user=example-webb",
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
  "caldwell-hall": {
    projects: [],
    researchers: [
      {
        id: "c3333333-3333-4333-8333-333333333333",
        building_id: "caldwell-hall",
        name: "Dr. Amara Johnson",
        title: "Associate Professor",
        department: "Biology",
        email: "ajohnson@uapb.edu",
        avatar_url: null,
        specializations: ["Molecular Genetics", "Plant Pathology"],
        bio: "Dr. Johnson's lab investigates gene expression in stress-tolerant crop varieties, with NIH-funded infrastructure supporting undergraduate genomics training.",
        photo_url: null,
        awards: ["NIH Research Infrastructure Investigator Award (2022)"],
        publications: [
          { title: "Stress-Responsive Gene Networks in Arkansas Row Crops", year: 2022 },
        ],
        website_url: "https://www.uapb.edu/academics/biology/johnson",
        google_scholar_url: "https://scholar.google.com/citations?user=example-johnson",
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  },
  "parker-ag-research": {
    projects: [],
    researchers: [
      {
        id: "d4444444-4444-4444-8444-444444444444",
        building_id: "parker-ag-research",
        name: "Dr. Raymond Tate",
        title: "Professor",
        department: "Agriculture",
        email: "rtate@uapb.edu",
        avatar_url: null,
        specializations: ["Soil Science", "Sustainable Agriculture"],
        bio: "Dr. Tate leads USDA-funded field trials on soil health and sustainable row-crop systems across Arkansas, partnering with regional growers on applied research.",
        photo_url: null,
        awards: ["USDA Sustainable Agriculture Research Fellow (2020)"],
        publications: [
          { title: "Soil Carbon Dynamics in Delta Row-Crop Rotations", year: 2021, url: "https://doi.org/10.1000/example-tate-2021" },
        ],
        website_url: null,
        google_scholar_url: "https://scholar.google.com/citations?user=example-tate",
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  },
  "walker-research-center": {
    projects: [],
    researchers: [
      {
        id: "e5555555-5555-4555-8555-555555555555",
        building_id: "walker-research-center",
        name: "Dr. Priya Nair",
        title: "Assistant Professor",
        department: "Engineering",
        email: "pnair@uapb.edu",
        avatar_url: null,
        specializations: ["Robotics", "Applied Machine Learning"],
        bio: "Dr. Nair directs the Applied Robotics Lab at the Walker Research Center, developing low-cost sensing platforms for agricultural and environmental monitoring.",
        photo_url: null,
        awards: ["UAPB Early Career Innovation Award (2024)"],
        publications: [
          { title: "Low-Cost Multispectral Sensing for Precision Agriculture", year: 2024 },
        ],
        website_url: "https://www.uapb.edu/academics/engineering/nair",
        google_scholar_url: null,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: "f6666666-6666-4666-8666-666666666666",
        building_id: "walker-research-center",
        name: "Dr. Marian Evans",
        title: "Program Coordinator, MISRGO / Interim Director, MRC",
        department: "Division of Research, Innovation & Economic Development",
        email: "evansm@uapb.edu",
        avatar_url: "/researchers/marian-evans.png",
        specializations: ["Public Health", "Tobacco Prevention", "Community Program Evaluation"],
        bio:
          "Dr. Marian S. Evans coordinates the Minority Initiative Sub-Recipient Grant Office and serves as interim director of the Minority Research Center on Tobacco and Addictions at UAPB. With more than 25 years in community-based program planning, policy development, and grant evaluation, she leads statewide efforts to reduce tobacco-related health disparities in minority and rural communities.",
        photo_url: "/researchers/marian-evans.png",
        awards: [
          "Quantum Leap Leadership Development Program Cohort VI (2025)",
          "Certified Tobacco Treatment Specialist — MD Anderson",
        ],
        publications: [],
        website_url: "https://armrc.org",
        google_scholar_url: null,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: "f7777777-7777-4777-8777-777777777777",
        building_id: "walker-research-center",
        name: "Dr. Jai Starling",
        title: "Director of Research and Sponsored Programs",
        department: "Division of Research, Innovation & Economic Development",
        email: "starlingj@uapb.edu",
        avatar_url: "/researchers/jai-starling.png",
        specializations: ["Grant Administration", "Federal Compliance", "Research Infrastructure"],
        bio:
          "Jacquese \"Jai\" Starling directs UAPB's Office of Research and Sponsored Programs, overseeing the full grant lifecycle from pre-award through post-award compliance. A U.S. Navy veteran with an MBA and Master of Data Science, she brings deep expertise in 2 CFR 200 federal compliance, audit readiness, and building sustainable research administration systems.",
        photo_url: "/researchers/jai-starling.png",
        awards: [],
        publications: [],
        website_url: "https://uapb.edu/administration/research-innovation-and-economic-development/",
        google_scholar_url: null,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  },
};

export function getResearchSeed(buildingId: string) {
  return RESEARCH_SEED[buildingId] ?? { projects: [], researchers: [] };
}

export interface DirectoryResearcher extends Researcher {
  building_name: string;
}

/** Every seeded researcher across all buildings, for the Faculty & Researchers local fallback. */
export function getAllResearchSeed(): DirectoryResearcher[] {
  const buildingNames = new Map(BUILDINGS_SEED.map((b) => [b.id, b.name]));
  return Object.values(RESEARCH_SEED)
    .flatMap((entry) => entry.researchers)
    .map((r) => ({ ...r, building_name: buildingNames.get(r.building_id) ?? r.building_id }));
}
