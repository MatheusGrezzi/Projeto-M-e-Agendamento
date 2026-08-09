import "server-only";

import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
});

const parsed = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

// Guarded by "server-only" above: this object mixes public NEXT_PUBLIC_*
// values with SUPABASE_SERVICE_ROLE_KEY, so it must never be importable from
// a Client Component. The browser Supabase client (lib/supabase/client.ts)
// reads NEXT_PUBLIC_* directly instead of via `env`.
export const env = {
  supabaseUrl: parsed.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY || "",
};
