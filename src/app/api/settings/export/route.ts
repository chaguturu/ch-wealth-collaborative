import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id, display_name, email, role")
    .eq("auth0_sub", userId)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hid = member.household_id;

  const [
    { data: members },
    { data: manualAccounts },
    { data: plaidItems },
    { data: plaidAccounts },
    { data: equityGrants },
    { data: vestSchedule },
    { data: snapshots },
    { data: milestones },
    { data: scenarios },
    { data: scenarioEvents },
    { data: taxProfiles },
    { data: retirementProfiles },
    { data: goals },
    { data: realEstate },
    { data: insurance },
    { data: estate },
    { data: decisionJournal },
  ] = await Promise.all([
    supabase.from("household_members").select("id, display_name, email, role, created_at").eq("household_id", hid),
    supabase.from("manual_accounts").select("*").eq("household_id", hid),
    supabase.from("plaid_items").select("id, institution_name, status, products, created_at").eq("household_id", hid),
    supabase.from("plaid_accounts").select("id, name, type, subtype, current_balance, iso_currency").eq("household_id", hid),
    supabase.from("equity_grants").select("*").eq("household_id", hid),
    supabase.from("equity_vest_schedule").select("*").in(
      "grant_id",
      (await supabase.from("equity_grants").select("id").eq("household_id", hid)).data?.map((g: { id: string }) => g.id) ?? []
    ),
    supabase.from("net_worth_snapshots").select("*").eq("household_id", hid).order("snapshot_date"),
    supabase.from("net_worth_milestones").select("*").eq("household_id", hid),
    supabase.from("scenarios").select("id, name, description, is_baseline, created_at").eq("household_id", hid),
    supabase.from("scenario_events").select("*").eq("household_id", hid),
    supabase.from("tax_profiles").select("*").eq("household_id", hid),
    supabase.from("retirement_profiles").select("*").eq("household_id", hid),
    supabase.from("goals").select("*").eq("household_id", hid),
    supabase.from("real_estate").select("*").eq("household_id", hid),
    supabase.from("insurance_policies").select("*").eq("household_id", hid),
    supabase.from("estate_documents").select("*").eq("household_id", hid),
    supabase.from("decision_journal").select("*").eq("household_id", hid),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    household_id: hid,
    members,
    manual_accounts: manualAccounts,
    plaid_items: plaidItems,
    plaid_accounts: plaidAccounts,
    equity_grants: equityGrants,
    equity_vest_schedule: vestSchedule,
    net_worth_snapshots: snapshots,
    net_worth_milestones: milestones,
    scenarios,
    scenario_events: scenarioEvents,
    tax_profiles: taxProfiles,
    retirement_profiles: retirementProfiles,
    goals,
    real_estate: realEstate,
    insurance_policies: insurance,
    estate_documents: estate,
    decision_journal: decisionJournal,
  };

  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="chwealth-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});
