import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseError } from "@/lib/supabase/errors";

let supabaseClient: SupabaseClient | null = null;
let loggedMissingEnv = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (!loggedMissingEnv) {
      loggedMissingEnv = true;
      logSupabaseError(
        "getSupabaseClient",
        "missing env",
        new Error(
          "NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set",
        ),
        {
          hasUrl: Boolean(url),
          hasAnonKey: Boolean(anonKey),
        },
      );
    }
    return null;
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
