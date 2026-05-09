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

  const { data: employers } = await supabase
    .from("equity_employers")
    .select("id, company_name, ticker_symbol, price_override, price_fallback")
    .eq("household_id", member.household_id)
    .eq("is_active", true);

  if (!employers || employers.length === 0) {
    return NextResponse.json({ employer: null, grants: [] });
  }

  const employer = employers[0];

  const { data: grants } = await supabase
    .from("equity_grants")
    .select("id, grant_id, grant_type, total_shares, strike_price, expiration_date, psu_achievement_pct, status")
    .eq("employer_id", employer.id)
    .eq("status", "active")
    .order("grant_type")
    .order("grant_id");

  if (!grants || grants.length === 0) {
    return NextResponse.json({ employer, grants: [] });
  }

  const grantIds = grants.map((g) => g.id);

  const { data: vestSchedule } = await supabase
    .from("equity_vest_schedule")
    .select("id, grant_id, vest_date, shares, vested")
    .in("grant_id", grantIds)
    .order("vest_date");

  const scheduleByGrant: Record<string, typeof vestSchedule> = {};
  for (const entry of vestSchedule ?? []) {
    if (!scheduleByGrant[entry.grant_id]) scheduleByGrant[entry.grant_id] = [];
    scheduleByGrant[entry.grant_id]!.push(entry);
  }

  const grantsWithSchedule = grants.map((g) => ({
    ...g,
    vest_schedule: scheduleByGrant[g.id] ?? [],
  }));

  return NextResponse.json({ employer, grants: grantsWithSchedule });
});
