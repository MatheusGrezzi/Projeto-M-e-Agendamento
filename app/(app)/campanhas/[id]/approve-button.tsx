"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { approveCampaignAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApproveButton({ campaignId, campaignVersionId, campaignAuditId }: { campaignId: string; campaignVersionId: string; campaignAuditId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await approveCampaignAction(campaignId, { campaignVersionId, campaignAuditId, notes: notes.trim() || undefined });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Campanha aprovada para execução.");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        <CheckCircle2 className="size-4" />
        Aprovar campanha
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aprovar campanha</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Isso marca a campanha como aprovada para execução. A execução em si (Google Ads, Claude Chrome) ainda não está implementada — chega em uma
            fase futura.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="approve-notes">Observações (opcional)</Label>
            <Textarea id="approve-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Aprovando..." : "Confirmar aprovação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
