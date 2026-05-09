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

  const { data: accounts, error } = await supabase
    .from("plaid_accounts")
    .select("id, name, official_name, type, subtype, current_balance, available_balance, iso_currency, balance_cached_at")
    .eq("household_id", member.household_id)
    .eq("is_hidden", false)
    .order("type");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }

  return NextResponse.json({ accounts });
});
