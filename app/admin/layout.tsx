import { redirect } from "next/navigation";

import { AdminMobileSidebar } from "@/components/layout/admin-mobile-sidebar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profiles-repository";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: proxy.ts already gates /admin/* on role, this is
  // the last line of defense if a request ever reaches here without it.
  if (!user) redirect("/login?next=/admin");
  const profile = await getProfile(supabase, user.id);
  if (!profile || (profile.role !== "admin" && profile.role !== "atendente")) redirect("/");

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AdminSidebar role={profile.role} userEmail={user.email ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <AdminMobileSidebar role={profile.role} userEmail={user.email ?? null} />
          <span className="text-sm font-semibold tracking-wide">Painel</span>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
