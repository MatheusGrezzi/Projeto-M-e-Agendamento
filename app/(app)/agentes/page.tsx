import { Bot, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AGENTS = [
  {
    name: "01 — Estrategista",
    description: "Gera a estratégia de campanha (grupos de anúncio, palavras-chave, títulos, descrições) a partir do que o cliente atende.",
    status: "live" as const,
    detail: "Motor determinístico (placeholder_engine) — pronto para ser trocado por uma IA real sem mudar a arquitetura.",
  },
  { name: "02 — Auditor", description: "Audita a estratégia de forma independente antes da aprovação humana.", status: "soon" as const, detail: "Fase 3" },
  { name: "03 — Executor", description: "Gera o prompt operacional para o Claude no Chrome executar a campanha aprovada.", status: "soon" as const, detail: "Fase 4" },
  { name: "04 — QA", description: "Compara planejado x executado e gera o Implementation Score.", status: "soon" as const, detail: "Fase 4" },
  { name: "05 — Performance", description: "Gera recomendações a partir dos dados reais de performance, sempre com aprovação humana.", status: "soon" as const, detail: "Fase 6" },
];

export default function AgentesPage() {
  return (
    <div>
      <PageHeader title="Agentes" description="Cada agente tem um papel isolado — nenhum faz o processo inteiro sozinho." />
      <div className="grid gap-4 sm:grid-cols-2">
        {AGENTS.map((agent) => (
          <Card key={agent.name}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm">{agent.name}</CardTitle>
              </div>
              {agent.status === "live" ? (
                <Badge className="gap-1">
                  <CheckCircle2 className="size-3" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline">{agent.detail}</Badge>
              )}
            </CardHeader>
            <CardContent>
              <CardDescription>{agent.description}</CardDescription>
              {agent.status === "live" && <p className="mt-2 text-xs text-muted-foreground">{agent.detail}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
