"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { regenerateCampaignStrategyAction } from "../actions";
import { Button } from "@/components/ui/button";

export function RegenerateButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await regenerateCampaignStrategyAction(campaignId);
          if (result.error) toast.error(result.error);
          else {
            toast.success("Nova versão da estratégia gerada.");
            router.refresh();
          }
        })
      }
    >
      <RefreshCw className="size-4" />
      {isPending ? "Gerando..." : "Gerar nova versão"}
    </Button>
  );
}
