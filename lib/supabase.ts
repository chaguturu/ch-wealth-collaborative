import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// getSupabaseClient
// Creates a Supabase client scoped to the current Auth0 user.
// Pass the Auth0 access token so RLS policies can identify the household.
// Use this in API route handlers after validating the Auth0 session.

export function getSupabaseClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// getSupabaseAdmin
// Creates a Supabase client with the service role key.
// Bypasses RLS. Use only for server-side cron jobs and webhook handlers.
// NEVER expose this client to the browser.

export function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
