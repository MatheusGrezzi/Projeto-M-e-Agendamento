import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

// The public institutional site + booking browsing needs no auth wall.
// Confirming a booking still requires login (enforced in the booking action
// itself), but browsing services/professionals/available slots does not.
const PUBLIC_PATHS = new Set(["/", "/servicos", "/sobre", "/contato", "/agendar", "/login", "/cadastro"]);
const STAFF_PREFIX = "/admin";

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
  const isPublic = PUBLIC_PATHS.has(path) || path.startsWith("/auth");

  // API routes do their own supabase.auth.getUser() check and return a
  // proper 401 JSON body. Redirecting them to /login here would instead send
  // an HTML page back to a fetch() caller (e.g. a stale tab whose session
  // expired mid-action), which fails JSON parsing with a confusing error.
  if (path.startsWith("/api")) {
    return response;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Staff area (/admin/*, shared by admin + atendente): needs a role check
  // on top of the plain "logged in" check above. Screens within /admin
  // further narrow by role (e.g. hide configurações from atendente).
  if (user && path.startsWith(STAFF_PREFIX)) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && profile?.role !== "atendente") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
