// AI assistant context only — not used for UI rendering.
// This data feeds the /api/chat system prompt and local fallback assistant.
// The live UI reads from Supabase.

export interface CampusGrant {
  id: string;
  title: string;
  amount: string;
  status: "Active" | "Pending";
}

export interface CampusResearcher {
  name: string;
  dept: string;
  specialty: string;
}

export interface CampusBuilding {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  floors: number;
  year_built: number | null;
  grants: CampusGrant[];
  researchers: CampusResearcher[];
}

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: "stem-building",
    name: "STEM Building",
    code: "STEM",
    category: "Research",
    floors: 4,
    year_built: 2016,
    description: "State-of-the-art facility supporting science, technology, engineering, and mathematics research across campus.",
    grants: [
      { id: "G-001", title: "NSF HBCU-UP STEM Initiative", amount: "$450,000", status: "Active" },
      { id: "G-002", title: "DOE Energy Research Fellowship", amount: "$275,000", status: "Pending" },
    ],
    researchers: [
      { name: "Dr. Marcus Webb", dept: "Physics", specialty: "Computational Modeling" },
      { name: "Dr. Latoya Fields", dept: "Chemistry", specialty: "Organic Synthesis" },
    ],
  },
  {
    id: "caldwell-hall",
    name: "Caldwell Hall",
    code: "CALD",
    category: "Academic",
    floors: 3,
    year_built: 1958,
    description: "Home to biology and agricultural sciences programs with active field and lab research.",
    grants: [
      { id: "G-003", title: "NIH Research Infrastructure Grant", amount: "$1,200,000", status: "Active" },
    ],
    researchers: [
      { name: "Dr. Amara Johnson", dept: "Biology", specialty: "Molecular Genetics" },
    ],
  },
  {
    id: "parker-ag-research",
    name: "S.J. Parker Agriculture Research Bldg",
    code: "PARB",
    category: "Research",
    floors: 1,
    year_built: 2001,
    description: "Applied research in sustainable agriculture, soil science, and food systems.",
    grants: [
      { id: "G-004", title: "USDA Sustainable Agriculture Grant", amount: "$380,000", status: "Active" },
    ],
    researchers: [
      { name: "Dr. Raymond Tate", dept: "Agriculture", specialty: "Soil Science" },
    ],
  },
  {
    id: "walker-research-center",
    name: "Walker Research Center",
    code: "WRC",
    category: "Research",
    floors: 2,
    year_built: null,
    description: "Dedicated research facility for applied sciences and engineering.",
    grants: [],
    researchers: [],
  },
  {
    id: "john-b-watson-library",
    name: "John B. Watson Library",
    code: "JBWL",
    category: "Academic",
    floors: 3,
    year_built: null,
    description: "Main campus library providing research resources and study spaces.",
    grants: [],
    researchers: [],
  },
];
