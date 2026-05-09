import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
import { getSupabaseAdmin } from "@/lib/supabase";
import { encrypt } from "@/lib/encrypt";

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const { public_token, institution_id, institution_name } = await req.json();

  if (!public_token) {
    return NextResponse.json({ error: "public_token is required" }, { status: 400 });
  }

  const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });
  const { access_token, item_id } = exchangeResponse.data;

  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("auth0_sub", userId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const { data: item, error } = await supabase
    .from("plaid_items")
    .insert({
      household_id: member.household_id,
      item_id,
      institution_id: institution_id ?? "",
      institution_name: institution_name ?? "",
      encrypted_access_token: encrypt(access_token),
      products: ["transactions"],
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to store plaid item:", error);
    return NextResponse.json({ error: "Failed to store item" }, { status: 500 });
  }

  // Fetch and store accounts immediately after linking
  const accountsResponse = await plaidClient.accountsGet({ access_token });
  const accounts = accountsResponse.data.accounts.map((a) => ({
    household_id: member.household_id,
    plaid_item_id: item.id,
    account_id: a.account_id,
    name: a.name,
    official_name: a.official_name ?? null,
    type: a.type,
    subtype: a.subtype ?? null,
    mask: a.mask ?? null,
    current_balance: a.balances.current ?? null,
    available_balance: a.balances.available ?? null,
    limit_amount: a.balances.limit ?? null,
    iso_currency: a.balances.iso_currency_code ?? "USD",
    balance_cached_at: new Date().toISOString(),
  }));

  await supabase.from("plaid_accounts").upsert(accounts, { onConflict: "account_id" });

  return NextResponse.json({ ok: true });
});
