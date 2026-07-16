import { NextResponse } from "next/server";
import { BUILDINGS_SEED } from "@/lib/buildings-seed";
import { querySupabase } from "@/lib/supabase-server";
import type { Building } from "@/types";

export async function GET() {
  const data = await querySupabase((client) =>
    client.from("buildings").select("*").order("name")
  );

  const buildings: Building[] = data ?? BUILDINGS_SEED;
  return NextResponse.json({ buildings, source: data ? "supabase" : "local" });
}
