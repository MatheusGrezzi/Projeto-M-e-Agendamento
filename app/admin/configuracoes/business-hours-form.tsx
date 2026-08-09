"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateBusinessHoursAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { weekdayName } from "@/lib/format";
import type { BusinessHoursEntry } from "@/types";

export function BusinessHoursForm({ settingsId, initialHours }: { settingsId: string; initialHours: BusinessHoursEntry[] }) {
  const [isPending, startTransition] = useTransition();
  const [hours, setHours] = useState<BusinessHoursEntry[]>(
    Array.from({ length: 7 }, (_, weekday) => initialHours.find((h) => h.weekday === weekday) ?? { weekday, open: null, close: null })
  );

  function handleSave() {
    startTransition(async () => {
      const result = await updateBusinessHoursAction(settingsId, hours);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Horário de funcionamento atualizado.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {hours.map((entry, i) => {
          const open = entry.open !== null;
          return (
            <div key={entry.weekday} className="flex items-center gap-2">
              <Checkbox
                checked={open}
                onCheckedChange={(checked) =>
                  setHours((prev) =>
                    prev.map((h, j) => (j === i ? { ...h, open: checked ? "09:00" : null, close: checked ? "18:00" : null } : h))
                  )
                }
              />
              <span className="w-24 shrink-0 text-sm">{weekdayName(entry.weekday)}</span>
              {open ? (
                <>
                  <Input
                    type="time"
                    value={entry.open ?? "09:00"}
                    onChange={(e) => setHours((prev) => prev.map((h, j) => (j === i ? { ...h, open: e.target.value } : h)))}
                    className="h-8 w-28"
                  />
                  <span className="text-muted-foreground">até</span>
                  <Input
                    type="time"
                    value={entry.close ?? "18:00"}
                    onChange={(e) => setHours((prev) => prev.map((h, j) => (j === i ? { ...h, close: e.target.value } : h)))}
                    className="h-8 w-28"
                  />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Fechado</span>
              )}
            </div>
          );
        })}
      </div>
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar horário"}
      </Button>
    </div>
  );
}
