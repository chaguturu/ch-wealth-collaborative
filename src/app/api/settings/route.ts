import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id, display_name, email, role, created_at")
    .eq("auth0_sub", userId)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: allMembers } = await supabase
    .from("household_members")
    .select("id, display_name, email, role, created_at")
    .eq("household_id", member.household_id);

  const { data: auditLog } = await supabase
    .from("audit_log")
    .select("id, action, resource_type, resource_id, ip_address, user_agent, metadata, created_at, member_id")
    .eq("household_id", member.household_id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: plaidItems } = await supabase
    .from("plaid_items")
    .select("id, institution_name, status, products, created_at, last_successful_update")
    .eq("household_id", member.household_id);

  return NextResponse.json({
    member,
    allMembers: allMembers ?? [],
    auditLog: auditLog ?? [],
    plaidItems: plaidItems ?? [],
    auth0Sub: userId,
  });
});
