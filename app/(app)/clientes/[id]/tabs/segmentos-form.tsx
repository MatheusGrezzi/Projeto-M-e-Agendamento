"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setClientSegmentsAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Segment } from "@/types";

export function SegmentosForm({ clientId, segments, selectedIds }: { clientId: string; segments: Segment[]; selectedIds: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await setClientSegmentsAction(clientId, Array.from(selected));
      if (result.error) toast.error(result.error);
      else {
        toast.success("Segmentos salvos.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Segmentos atendidos</CardTitle>
        <CardDescription>Um cliente pode atender múltiplos segmentos simultaneamente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {segments.map((segment) => (
            <label key={segment.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5">
              <Checkbox checked={selected.has(segment.id)} onCheckedChange={() => toggle(segment.id)} />
              <Label className="font-normal">{segment.label}</Label>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
