import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const POST = withAuth(async (req: NextRequest, { userId }, ctx) => {
  const scenarioId = (ctx as { params: { id: string } }).params.id;
  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id")
    .eq("auth0_sub", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify scenario belongs to this household
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id")
    .eq("id", scenarioId)
    .eq("household_id", member.household_id)
    .single();
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { event_type, event_subtype, label, event_date, end_date, parameters } = body;

  if (!event_type || !event_subtype || !label || !event_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("scenario_events")
    .insert({
      scenario_id: scenarioId,
      household_id: member.household_id,
      member_id: member.id,
      event_type,
      event_subtype,
      label,
      event_date,
      end_date: end_date ?? null,
      parameters: parameters ?? {},
    })
    .select("id, event_type, event_subtype, label, event_date, end_date, parameters, sort_order")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
});

export const DELETE = withAuth(async (req: NextRequest, { userId }, ctx) => {
  const scenarioId = (ctx as { params: { id: string } }).params.id;
  const eventId = new URL(req.url).searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("auth0_sub", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("scenario_events")
    .delete()
    .eq("id", eventId)
    .eq("scenario_id", scenarioId)
    .eq("household_id", member.household_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
