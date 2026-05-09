import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// Deletes all non-equity household data. Equity grants are retained (they are real comp records).
// Requires confirmation string in request body: { confirm: "DELETE MY DATA" }
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  if (body.confirm !== "DELETE MY DATA") {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id, role")
    .eq("auth0_sub", userId)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const hid = member.household_id;

  // Delete in dependency order
  await supabase.from("scenario_events").delete().eq("household_id", hid);
  await supabase.from("scenarios").delete().eq("household_id", hid);
  await supabase.from("net_worth_milestones").delete().eq("household_id", hid);
  await supabase.from("net_worth_snapshots").delete().eq("household_id", hid);
  await supabase.from("goals").delete().eq("household_id", hid);
  await supabase.from("decision_journal").delete().eq("household_id", hid);
  await supabase.from("transactions").delete().eq("household_id", hid);
  await supabase.from("investment_holdings").delete().eq("household_id", hid);
  await supabase.from("plaid_accounts").delete().eq("household_id", hid);
  await supabase.from("plaid_items").delete().eq("household_id", hid);
  await supabase.from("manual_accounts").delete().eq("household_id", hid);
  await supabase.from("audit_log").delete().eq("household_id", hid);

  // Log the nuke action before audit_log is cleared
  // (already cleared above, so this creates a fresh record)
  await supabase.from("audit_log").insert({
    household_id: hid,
    member_id: member.id,
    action: "data_nuke",
    resource_type: "household",
    resource_id: hid,
    metadata: { nuked_by: userId },
  });

  return NextResponse.json({ ok: true });
});
