import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";

export const POST = withAuth(async (_req: NextRequest, { userId }) => {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "CH Wealth Collaborative",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
    redirect_uri: `${baseUrl}/dashboard/accounts`,
  });

  return NextResponse.json({ link_token: response.data.link_token });
});
