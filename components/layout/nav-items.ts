import { CalendarDays, LayoutDashboard, ListChecks, Settings, Users } from "lucide-react";

import type { Role } from "@/types";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "atendente"] as Role[] },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays, roles: ["admin", "atendente"] as Role[] },
  { href: "/admin/servicos", label: "Serviços", icon: ListChecks, roles: ["admin"] as Role[] },
  { href: "/admin/profissionais", label: "Profissionais", icon: Users, roles: ["admin"] as Role[] },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] as Role[] },
] as const;
