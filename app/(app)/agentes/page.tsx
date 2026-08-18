import { Bot } from "lucide-react";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function AgentesPage() {
  return (
    <PlaceholderPage
      title="Agentes"
      description="Estrategista, Auditor, Executor, QA e Performance — cada um com um papel isolado no pipeline."
      icon={Bot}
      phase="Os agentes chegam a partir da Fase 2 (Estrategista) até a Fase 6 (Performance)."
    />
  );
}
