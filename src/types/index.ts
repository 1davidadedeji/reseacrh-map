// These interfaces mirror the Supabase table schemas exactly.

export interface Building {
  id: string;           // TEXT PK — matches building_id in buildings.geojson
  name: string;
  code: string;
  lat: number;
  lng: number;
  description: string | null;
  image_url: string | null;
  floors: number | null;
  year_built: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchProject {
  id: string;
  building_id: string;
  title: string;
  abstract: string | null;
  status: "active" | "completed" | "pending" | "on_hold";
  funding_source: string | null;
  grant_amount: number | null;
  grant_number: string | null;
  start_date: string | null;
  end_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Publication {
  title: string;
  year?: number;
  url?: string;
}

export interface Researcher {
  id: string;
  building_id: string;
  name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  avatar_url: string | null;
  specializations: string[];
  bio: string | null;
  photo_url: string | null;
  awards: string[];
  publications: Publication[];
  website_url: string | null;
  google_scholar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectResearcher {
  project_id: string;
  researcher_id: string;
  role: string | null;
}

// Supabase typed-client schema — lives here so supabase-server.ts can import it
// without pulling in supabase.ts (which imports createClient, causing a Turbopack
// module-concatenation name collision).
export type Database = {
  public: {
    Tables: {
      buildings: {
        Row: Building;
        Insert: Omit<Building, "created_at" | "updated_at">;
        Update: Partial<Omit<Building, "id" | "created_at" | "updated_at">>;
      };
      research_projects: {
        Row: ResearchProject;
        Insert: Omit<ResearchProject, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ResearchProject, "id" | "created_at" | "updated_at">>;
      };
      researchers: {
        Row: Researcher;
        Insert: Omit<Researcher, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Researcher, "id" | "created_at" | "updated_at">>;
      };
      project_researchers: {
        Row: ProjectResearcher;
        Insert: ProjectResearcher;
        Update: Partial<ProjectResearcher>;
      };
    };
  };
};
