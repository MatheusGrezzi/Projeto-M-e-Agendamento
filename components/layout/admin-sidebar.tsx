import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { AdminSidebarNav } from "./admin-sidebar-nav";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types";

export function AdminSidebar({ role, userEmail }: { role: Role; userEmail: string | null }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-5 md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <LogoMark className="h-8" />
      </div>

      <div className="mt-6 flex-1">
        <AdminSidebarNav role={role} />
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        {userEmail && <p className="truncate px-2 text-xs text-muted-foreground">{userEmail}</p>}
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="size-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
