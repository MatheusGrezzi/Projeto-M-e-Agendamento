import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { AppSidebarNav } from "./app-sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function AppSidebar({ orgName, userEmail }: { orgName: string; userEmail: string | null }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground md:flex">
      <div className="flex items-center justify-between gap-2.5 px-2">
        <span className="text-base font-semibold tracking-tight">
          Reconnect <span className="text-sidebar-primary">OS</span>
        </span>
        <ThemeToggle />
      </div>
      <p className="mt-0.5 px-2 text-xs text-sidebar-foreground/50">{orgName}</p>

      <div className="mt-6 flex-1 overflow-y-auto">
        <AppSidebarNav />
      </div>

      <div className="space-y-2 border-t border-sidebar-border pt-4">
        {userEmail && <p className="truncate px-2 text-xs text-sidebar-foreground/50">{userEmail}</p>}
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
