import { redirect } from "next/navigation";

import { AppMobileSidebar } from "@/components/layout/app-mobile-sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { getMyOrganization } from "@/services/organizations-repository";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: proxy.ts already gates every route on auth, this is
  // the last line of defense if a request ever reaches here without it.
  if (!user) redirect("/login");

  const org = await getMyOrganization(supabase, user.id);
  if (!org) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Sua conta ainda não está associada a nenhuma organização. Fale com um administrador da Reconnect.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AppSidebar orgName={org.name} userEmail={user.email ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <AppMobileSidebar orgName={org.name} userEmail={user.email ?? null} />
          <span className="flex-1 text-sm font-semibold tracking-wide">
            Reconnect <span className="text-primary">OS</span>
          </span>
          <ThemeToggle />
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
