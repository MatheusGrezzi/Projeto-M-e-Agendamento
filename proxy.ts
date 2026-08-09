import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Excludes /branding/* (logo, favicon, hero, OG image — always public,
  // swapped per client) in addition to Next's own static asset paths.
  matcher: ["/((?!_next/static|_next/image|branding/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
