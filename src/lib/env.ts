import { DEFAULT_SITE_DISCLAIMER } from "@/lib/constants";

const adminEmailSet = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
);

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Klaw Field",
  adminDisplayName: process.env.ADMIN_DISPLAY_NAME ?? "Lobstar",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  siteDisclaimer: process.env.NEXT_PUBLIC_SITE_DISCLAIMER ?? DEFAULT_SITE_DISCLAIMER,
  adminEmails: adminEmailSet,
};

export function assertSupabasePublicEnv() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

export function assertSupabaseServiceEnv() {
  assertSupabasePublicEnv();
  if (!env.supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }
  return env.adminEmails.has(email.trim().toLowerCase());
}
