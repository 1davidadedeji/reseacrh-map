import { NextResponse } from "next/server";
import { getResearchSeed } from "@/lib/research-seed";
import { querySupabase } from "@/lib/supabase-server";
import type { ResearchProject, Researcher } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: buildingId } = await params;

  const [projects, researchers] = await Promise.all([
    querySupabase((client) =>
      client
        .from("research_projects")
        .select("*")
        .eq("building_id", buildingId)
        .order("status")
    ),
    querySupabase((client) =>
      client
        .from("researchers")
        .select("*")
        .eq("building_id", buildingId)
        .order("name")
    ),
  ]);

  const seed = getResearchSeed(buildingId);
  const payload: {
    projects: ResearchProject[];
    researchers: Researcher[];
    source: "supabase" | "local" | "mixed";
  } = {
    projects: projects ?? seed.projects,
    researchers: researchers ?? seed.researchers,
    source:
      projects && researchers
        ? "supabase"
        : projects || researchers
          ? "mixed"
          : "local",
  };

  return NextResponse.json(payload);
}
