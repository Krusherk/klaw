import { createClient } from "@supabase/supabase-js";

import { assertSupabasePublicEnv, assertSupabaseServiceEnv, env } from "@/lib/env";

export function createSupabaseAnonClient() {
  assertSupabasePublicEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseServiceClient() {
  assertSupabaseServiceEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
