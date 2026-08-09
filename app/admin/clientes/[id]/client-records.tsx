"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { addClientRecordAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ClientRecord } from "@/types";

export function ClientRecords({ clientId, records }: { clientId: string; records: ClientRecord[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await addClientRecordAction({ clientId, content });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setContent("");
      toast.success("Anotação salva.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nova anotação clínica (evolução, procedimento realizado, observação...)"
        />
        <Button size="sm" onClick={handleSubmit} disabled={isPending || content.trim().length < 3}>
          {isPending ? "Salvando..." : "Adicionar anotação"}
        </Button>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma anotação registrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((record) => (
            <li key={record.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="text-muted-foreground">
                {new Date(record.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{record.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
