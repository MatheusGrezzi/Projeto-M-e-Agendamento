"use client";

import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { logoutAction } from "@/app/actions";
import { AdminSidebarNav } from "./admin-sidebar-nav";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/types";

export function AdminMobileSidebar({ role, userEmail }: { role: Role; userEmail: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 flex-col p-4">
        <SheetHeader className="p-0 pb-2">
          <SheetTitle>
            <LogoMark className="h-7" />
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1">
          <AdminSidebarNav role={role} onNavigate={() => setOpen(false)} />
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
      </SheetContent>
    </Sheet>
  );
}
