import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("auth0_sub", userId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const hid = member.household_id;

  const [accountsRes, manualRes, snapshotsRes, equityGrantsRes] = await Promise.all([
    supabase
      .from("plaid_accounts")
      .select("id, name, official_name, type, subtype, current_balance, iso_currency, balance_cached_at")
      .eq("household_id", hid)
      .eq("is_hidden", false),
    supabase
      .from("manual_accounts")
      .select("id, name, type, subtype, balance, institution")
      .eq("household_id", hid),
    supabase
      .from("net_worth_snapshots")
      .select("snapshot_date, total_assets, total_liabilities, net_worth, equity_comp_value")
      .eq("household_id", hid)
      .order("snapshot_date", { ascending: true })
      .limit(13),
    supabase
      .from("equity_grants")
      .select(`
        id, grant_id, grant_type, total_shares, strike_price, psu_achievement_pct, status,
        equity_vest_schedule(id, vest_date, shares, vested)
      `)
      .eq("household_id", hid)
      .eq("status", "active"),
  ]);

  return NextResponse.json({
    accounts: accountsRes.data ?? [],
    manualAccounts: manualRes.data ?? [],
    snapshots: snapshotsRes.data ?? [],
    grants: equityGrantsRes.data ?? [],
  });
});
