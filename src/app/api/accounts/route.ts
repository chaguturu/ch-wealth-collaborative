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

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const hid = member.household_id;

  const [accountsRes, manualRes, txRes] = await Promise.all([
    supabase
      .from("plaid_accounts")
      .select("id, name, official_name, type, subtype, mask, current_balance, available_balance, limit_amount, iso_currency, balance_cached_at, plaid_item_id, plaid_items(institution_name, institution_id)")
      .eq("household_id", hid)
      .eq("is_hidden", false)
      .order("type"),
    supabase
      .from("manual_accounts")
      .select("id, name, type, subtype, balance, institution, iso_currency")
      .eq("household_id", hid),
    supabase
      .from("transactions")
      .select("id, date, name, merchant_name, amount, personal_finance_category, pending, plaid_account_id")
      .eq("household_id", hid)
      .eq("is_excluded", false)
      .order("date", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    accounts: accountsRes.data ?? [],
    manualAccounts: manualRes.data ?? [],
    transactions: txRes.data ?? [],
  });
});
