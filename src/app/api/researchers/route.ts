import { NextResponse } from "next/server";
import { getAllResearchSeed, type DirectoryResearcher } from "@/lib/research-seed";
import { querySupabase } from "@/lib/supabase-server";

interface ResearcherWithBuildingRow extends Record<string, unknown> {
  buildings: { name: string } | { name: string }[] | null;
}

export async function GET() {
  const rows = await querySupabase((client) =>
    client
      .from("researchers")
      .select("*, buildings(name)")
      .order("name")
  );

  let researchers: DirectoryResearcher[];
  let source: "supabase" | "local";

  if (rows) {
    researchers = (rows as unknown as ResearcherWithBuildingRow[]).map((row) => {
      const { buildings, ...rest } = row;
      const building = Array.isArray(buildings) ? buildings[0] : buildings;
      return { ...rest, building_name: building?.name ?? "" } as DirectoryResearcher;
    });
    source = "supabase";
  } else {
    researchers = getAllResearchSeed();
    source = "local";
  }

  return NextResponse.json({ researchers, source });
}
