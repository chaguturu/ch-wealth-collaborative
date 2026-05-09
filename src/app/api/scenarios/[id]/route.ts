import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const GET = withAuth(async (_req: NextRequest, { userId }, ctx) => {
  const id = (ctx as { params: { id: string } }).params.id;
  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("auth0_sub", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, name, description, is_baseline")
    .eq("id", id)
    .eq("household_id", member.household_id)
    .single();

  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: events } = await supabase
    .from("scenario_events")
    .select("id, event_type, event_subtype, label, event_date, end_date, parameters, sort_order")
    .eq("scenario_id", id)
    .order("event_date")
    .order("sort_order");

  return NextResponse.json({ scenario, events: events ?? [] });
});

export const DELETE = withAuth(async (_req: NextRequest, { userId }, ctx) => {
  const id = (ctx as { params: { id: string } }).params.id;
  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("auth0_sub", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("id", id)
    .eq("household_id", member.household_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
