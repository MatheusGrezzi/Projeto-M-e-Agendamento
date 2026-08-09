import { createBrowserClient } from "@supabase/ssr";

// Reads NEXT_PUBLIC_* directly (not via lib/env.ts, which is server-only)
// so this factory stays safe to import from Client Components.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}
