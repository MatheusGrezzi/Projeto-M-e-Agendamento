"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteServiceAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteServiceButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Remover este serviço? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await deleteServiceAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Serviço removido.");
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="size-4" />
    </Button>
  );
}
