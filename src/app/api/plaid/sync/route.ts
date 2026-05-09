import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { plaidClient } from "@/lib/plaid";
import { decrypt } from "@/lib/encrypt";

export const POST = withAuth(async (_req: NextRequest, { userId }) => {
  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("auth0_sub", userId)
    .single();

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const hid = member.household_id;

  const { data: items } = await supabase
    .from("plaid_items")
    .select("id, access_token_enc")
    .eq("household_id", hid);

  if (!items || items.length === 0) {
    return NextResponse.json({ synced: 0, accounts: 0, transactions: 0 });
  }

  let totalAccounts = 0;
  let totalTransactions = 0;

  for (const item of items) {
    let accessToken: string;
    try {
      accessToken = decrypt(item.access_token_enc);
    } catch {
      continue;
    }

    // Refresh account balances
    try {
      const balRes = await plaidClient.accountsBalanceGet({ access_token: accessToken });
      for (const acct of balRes.data.accounts) {
        await supabase
          .from("plaid_accounts")
          .update({
            current_balance: acct.balances.current,
            available_balance: acct.balances.available,
            balance_cached_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("account_id", acct.account_id);
      }
      totalAccounts += balRes.data.accounts.length;
    } catch {
      // balance refresh failed for this item, continue
    }

    // Fetch recent transactions (last 30 days)
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const txRes = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        options: { count: 500, include_personal_finance_category: true },
      });

      for (const tx of txRes.data.transactions) {
        const { data: acct } = await supabase
          .from("plaid_accounts")
          .select("id")
          .eq("account_id", tx.account_id)
          .single();

        if (!acct) continue;

        const pfc = (tx as { personal_finance_category?: { primary?: string } }).personal_finance_category?.primary ?? null;

        await supabase
          .from("transactions")
          .upsert({
            plaid_account_id: acct.id,
            household_id: hid,
            transaction_id: tx.transaction_id,
            amount: tx.amount,
            iso_currency: tx.iso_currency_code ?? "USD",
            date: tx.date,
            authorized_date: tx.authorized_date ?? null,
            name: tx.name,
            merchant_name: tx.merchant_name ?? null,
            category: tx.category ?? [],
            category_id: tx.category_id ?? null,
            personal_finance_category: pfc,
            pending: tx.pending,
            updated_at: new Date().toISOString(),
          }, { onConflict: "transaction_id" });
      }
      totalTransactions += txRes.data.transactions.length;
    } catch {
      // tx fetch failed for this item, continue
    }
  }

  return NextResponse.json({
    synced: items.length,
    accounts: totalAccounts,
    transactions: totalTransactions,
  });
});
