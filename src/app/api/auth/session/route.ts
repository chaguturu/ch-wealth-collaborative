import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth0.getSession();

  if (!session || !session.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id, display_name, email, role")
    .eq("auth0_sub", session.user.sub)
    .single();

  return NextResponse.json({
    authenticated: true,
    user: {
      sub:   session.user.sub,
      email: session.user.email,
      name:  session.user.name,
    },
    member: member || null,
  });
}
