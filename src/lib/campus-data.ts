import type { Building } from "@/types";

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

export interface CampusBuilding extends Building {
  category: string;
  grants: CampusGrant[];
  researchers: CampusResearcher[];
}

export const NAV_ITEMS = [
  "Buildings",
  "Research",
  "Grants",
  "Departments",
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: "stem-academy",
    name: "STEM Academy",
    code: "STEM",
    longitude: -92.0178,
    latitude: 34.2378,
    floors: 4,
    year_built: 2016,
    description:
      "State-of-the-art facility supporting science, technology, engineering, and mathematics research across campus.",
    image_url: null,
    category: "Research",
    created_at: "",
    updated_at: "",
    grants: [
      {
        id: "G-001",
        title: "NSF HBCU-UP STEM Initiative",
        amount: "$450,000",
        status: "Active",
      },
      {
        id: "G-002",
        title: "DOE Energy Research Fellowship",
        amount: "$275,000",
        status: "Pending",
      },
    ],
    researchers: [
      {
        name: "Dr. Marcus Webb",
        dept: "Physics",
        specialty: "Computational Modeling",
      },
      {
        name: "Dr. Latoya Fields",
        dept: "Chemistry",
        specialty: "Organic Synthesis",
      },
    ],
  },
  {
    id: "caldwell-hall",
    name: "Caldwell Hall",
    code: "CAL",
    longitude: -92.0159,
    latitude: 34.2359,
    floors: 3,
    year_built: 1958,
    description:
      "Home to biology and agricultural sciences programs with active field and lab research.",
    image_url: null,
    category: "Academic",
    created_at: "",
    updated_at: "",
    grants: [
      {
        id: "G-003",
        title: "NIH Research Infrastructure Grant",
        amount: "$1,200,000",
        status: "Active",
      },
    ],
    researchers: [
      {
        name: "Dr. Amara Johnson",
        dept: "Biology",
        specialty: "Molecular Genetics",
      },
    ],
  },
  {
    id: "fine-arts",
    name: "Hathaway-Howard Fine Arts",
    code: "HHA",
    longitude: -92.0148,
    latitude: 34.2362,
    floors: 2,
    year_built: 1972,
    description:
      "Creative arts hub with interdisciplinary research in digital media and cultural studies.",
    image_url: null,
    category: "Arts",
    created_at: "",
    updated_at: "",
    grants: [],
    researchers: [],
  },
  {
    id: "union",
    name: "L.A. Davis Sr. University Union",
    code: "UNI",
    longitude: -92.0165,
    latitude: 34.2348,
    floors: 2,
    year_built: 1985,
    description:
      "Central campus hub connecting students, faculty, and community outreach programs.",
    image_url: null,
    category: "Student Life",
    created_at: "",
    updated_at: "",
    grants: [],
    researchers: [],
  },
  {
    id: "ag-research",
    name: "Agriculture Research Center",
    code: "ARC",
    longitude: -92.0188,
    latitude: 34.2352,
    floors: 1,
    year_built: 2001,
    description:
      "Applied research in sustainable agriculture, soil science, and food systems.",
    image_url: null,
    category: "Research",
    created_at: "",
    updated_at: "",
    grants: [
      {
        id: "G-004",
        title: "USDA Sustainable Agriculture Grant",
        amount: "$380,000",
        status: "Active",
      },
    ],
    researchers: [
      {
        name: "Dr. Raymond Tate",
        dept: "Agriculture",
        specialty: "Soil Science",
      },
    ],
  },
];
