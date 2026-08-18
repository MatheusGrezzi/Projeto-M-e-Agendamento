import {
  Activity,
  BookOpen,
  Bot,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Megaphone,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/performance", label: "Performance", icon: LineChart },
  { href: "/recomendacoes", label: "Recomendações", icon: Sparkles },
  { href: "/conhecimento", label: "Conhecimento", icon: BookOpen },
  { href: "/aprendizados", label: "Aprendizados", icon: Lightbulb },
  { href: "/agentes", label: "Agentes", icon: Bot },
  { href: "/atividades", label: "Atividades", icon: Activity },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;
