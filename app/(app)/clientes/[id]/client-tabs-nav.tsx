import Link from "next/link";

import { cn } from "@/lib/utils";

export const CLIENT_TABS = [
  { key: "visao-geral", label: "Visão geral" },
  { key: "segmentos", label: "Segmentos" },
  { key: "equipamentos", label: "Equipamentos" },
  { key: "servicos", label: "Serviços" },
  { key: "restricoes", label: "Restrições" },
  { key: "marcas", label: "Marcas" },
  { key: "regioes", label: "Regiões" },
  { key: "landing-pages", label: "Landing Pages" },
  { key: "conversoes", label: "Conversões" },
  { key: "campanhas", label: "Campanhas" },
  { key: "leads", label: "Leads" },
  { key: "performance", label: "Performance" },
  { key: "aprendizados", label: "Aprendizados" },
  { key: "historico", label: "Histórico" },
] as const;

export type ClientTabKey = (typeof CLIENT_TABS)[number]["key"];

export function ClientTabsNav({ clientId, active }: { clientId: string; active: string }) {
  return (
    <div className="-mx-1 mb-6 overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1 px-1">
        {CLIENT_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/clientes/${clientId}?tab=${tab.key}`}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
