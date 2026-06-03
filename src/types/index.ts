export interface Building {
  id: string;
  name: string;
  code: string;
  longitude: number;
  latitude: number;
  floors: number;
  year_built: number | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  building_id: string;
  name: string;
  acronym: string;
  floor: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Researcher {
  id: string;
  department_id: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  specializations: string[];
  created_at: string;
  updated_at: string;
}

export interface ResearchProject {
  id: string;
  department_id: string;
  lead_researcher_id: string;
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

// Join types for convenient data fetching
export interface BuildingWithDepartments extends Building {
  departments: Department[];
}

export interface DepartmentWithResearchers extends Department {
  researchers: Researcher[];
}

export interface ResearchProjectWithRelations extends ResearchProject {
  department: Department;
  lead_researcher: Researcher;
  collaborators: Researcher[];
}
