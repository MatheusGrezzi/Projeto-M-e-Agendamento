import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types";

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  strategy_generated: "Estratégia gerada",
  under_audit: "Em auditoria",
  rejected: "Rejeitada",
  approved: "Aprovada",
  awaiting_human_approval: "Aguardando aprovação",
  approved_for_execution: "Aprovada para execução",
  executed: "Executada",
  qa_review: "Em QA",
  active: "Ativa",
  optimization: "Em otimização",
};

const STATUS_VARIANT: Record<CampaignStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  strategy_generated: "secondary",
  under_audit: "secondary",
  rejected: "destructive",
  approved: "default",
  awaiting_human_approval: "secondary",
  approved_for_execution: "default",
  executed: "default",
  qa_review: "secondary",
  active: "default",
  optimization: "secondary",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
