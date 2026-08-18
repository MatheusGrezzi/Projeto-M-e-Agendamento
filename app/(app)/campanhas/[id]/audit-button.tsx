"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { auditCampaignAction } from "../actions";
import { Button } from "@/components/ui/button";

export function AuditButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await auditCampaignAction(campaignId);
          if (result.error) toast.error(result.error);
          else {
            toast.success("Auditoria concluída.");
            router.refresh();
          }
        })
      }
    >
      <ShieldCheck className="size-4" />
      {isPending ? "Auditando..." : "Auditar campanha"}
    </Button>
  );
}
