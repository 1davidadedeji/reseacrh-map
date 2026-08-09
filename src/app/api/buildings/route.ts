import { NextResponse } from "next/server";
import { BUILDINGS_SEED_ENRICHED } from "@/lib/buildings-seed";
import { enrichBuildings } from "@/lib/building-media";
import { querySupabase } from "@/lib/supabase-server";
import type { Building } from "@/types";

export async function GET() {
  const data = await querySupabase((client) =>
    client.from("buildings").select("*").order("name")
  );

  const buildings: Building[] = data
    ? enrichBuildings(data as Building[])
    : BUILDINGS_SEED_ENRICHED;
  return NextResponse.json({ buildings, source: data ? "supabase" : "local" });
}
