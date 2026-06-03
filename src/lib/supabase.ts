import { createClient } from "@supabase/supabase-js";
import type {
  Building,
  Department,
  Researcher,
  ResearchProject,
} from "@/types";

type Database = {
  public: {
    Tables: {
      buildings: { Row: Building; Insert: Omit<Building, "id" | "created_at" | "updated_at">; Update: Partial<Building> };
      departments: { Row: Department; Insert: Omit<Department, "id" | "created_at" | "updated_at">; Update: Partial<Department> };
      researchers: { Row: Researcher; Insert: Omit<Researcher, "id" | "created_at" | "updated_at">; Update: Partial<Researcher> };
      research_projects: { Row: ResearchProject; Insert: Omit<ResearchProject, "id" | "created_at" | "updated_at">; Update: Partial<ResearchProject> };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
