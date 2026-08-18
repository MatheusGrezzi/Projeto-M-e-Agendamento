import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

// Reconnect OS is an internal tool — everything requires auth except /login.
const PUBLIC_PATHS = new Set(["/login"]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.has(path);

  // API routes do their own supabase.auth.getUser() check and return a
  // proper 401 JSON body. Redirecting them to /login here would instead send
  // an HTML page back to a fetch() caller, which fails JSON parsing.
  if (path.startsWith("/api")) {
    return response;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
