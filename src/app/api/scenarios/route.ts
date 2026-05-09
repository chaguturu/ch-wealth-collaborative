import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id")
    .eq("auth0_sub", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await supabase
    .from("scenarios")
    .select("id, name, description, is_baseline, created_at")
    .eq("household_id", member.household_id)
    .order("created_at");

  return NextResponse.json({ scenarios: data ?? [], memberId: member.id });
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id")
    .eq("auth0_sub", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      household_id: member.household_id,
      created_by: member.id,
      name,
      description: body.description ?? null,
      is_baseline: body.is_baseline ?? false,
    })
    .select("id, name, description, is_baseline, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scenario: data });
});
