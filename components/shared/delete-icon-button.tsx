"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DeleteIconButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<{ error: string | null }>;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive"
      disabled={isPending}
      aria-label="Remover"
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          const result = await action();
          if (result?.error) {
            toast.error(result.error);
          } else {
            router.refresh();
          }
        });
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
