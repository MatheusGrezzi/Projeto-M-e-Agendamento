"use client";

import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { logoutAction } from "@/app/actions";
import { AppSidebarNav } from "./app-sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AppMobileSidebar({ orgName, userEmail }: { orgName: string; userEmail: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button type="button" variant="ghost" size="icon" aria-label="Abrir menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground">
        <SheetTitle className="px-2 text-base font-semibold tracking-tight">
          Reconnect <span className="text-sidebar-primary">OS</span>
        </SheetTitle>
        <p className="px-2 text-xs text-sidebar-foreground/50">{orgName}</p>

        <div className="mt-6 flex-1 overflow-y-auto">
          <AppSidebarNav onNavigate={() => setOpen(false)} />
        </div>

        <div className="space-y-2 border-t border-sidebar-border pt-4">
          {userEmail && <p className="truncate px-2 text-xs text-sidebar-foreground/50">{userEmail}</p>}
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-sidebar-foreground/70">
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
