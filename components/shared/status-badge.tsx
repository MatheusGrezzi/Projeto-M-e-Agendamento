import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/types";

const STATUS_LABEL: Record<ClientStatus, string> = {
  onboarding: "Onboarding",
  active: "Ativo",
  paused: "Pausado",
  churned: "Encerrado",
};

const STATUS_VARIANT: Record<ClientStatus, "default" | "secondary" | "outline" | "destructive"> = {
  onboarding: "outline",
  active: "default",
  paused: "secondary",
  churned: "destructive",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
