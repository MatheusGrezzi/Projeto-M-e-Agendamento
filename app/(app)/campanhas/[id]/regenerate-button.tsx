"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { regenerateCampaignStrategyAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RegenerateButton({ campaignId, hasVersion }: { campaignId: string; hasVersion: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await regenerateCampaignStrategyAction(campaignId, { reason: reason.trim() || undefined });
      if (result.error) {
        toast.error(result.error, { description: result.errors?.join(" ") });
      } else {
        if (result.warnings && result.warnings.length > 0) toast.warning(`Estratégia gerada com ${result.warnings.length} alerta(s).`);
        else toast.success("Nova versão da estratégia gerada.");
        setOpen(false);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <RefreshCw className="size-4" />
        {hasVersion ? "Gerar nova versão" : "Gerar estratégia"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hasVersion ? "Gerar nova versão" : "Gerar estratégia"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {hasVersion && (
            <div className="space-y-1.5">
              <Label htmlFor="regen-reason">Por que deseja regenerar? (opcional)</Label>
              <Textarea id="regen-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: orçamento mudou, ajustar tom dos anúncios..." />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {hasVersion
              ? "A versão anterior é mantida — você pode consultá-la a qualquer momento."
              : "Isso vai gerar a primeira versão da estratégia com base no briefing desta campanha."}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Gerando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
