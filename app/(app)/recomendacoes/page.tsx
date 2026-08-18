import { Sparkles } from "lucide-react";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function RecomendacoesPage() {
  return (
    <PlaceholderPage
      title="Recomendações"
      description="Recomendações geradas pelo agente de performance, sempre com aprovação humana."
      icon={Sparkles}
      phase="Chega na Fase 6, junto com performance e benchmarks."
    />
  );
}
