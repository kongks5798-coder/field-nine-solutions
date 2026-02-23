/**
 * Dalkak Supabase Browser Client
 * Real client — replaces the previous mock implementation.
 * Credentials come from NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Fallback placeholders allow the build to succeed even without env vars set.
 * NEXT_PUBLIC_ vars are inlined at build time — set GitHub Secrets for production.
 */

import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);

export function createClient() {
  return supabase;
}
