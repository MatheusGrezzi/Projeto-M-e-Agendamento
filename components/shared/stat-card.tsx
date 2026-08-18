import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  muted,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Dims the card for metrics not implemented yet (e.g. campaign stats reserved for a later phase). */
  muted?: boolean;
}) {
  return (
    <Card className={cn(muted && "border-dashed bg-card/50")}>
      <CardContent className="flex items-center gap-3.5 px-4 py-4">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", muted && "bg-muted text-muted-foreground")}>
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className={cn("text-xl font-semibold tabular-nums leading-tight", muted && "text-muted-foreground")}>{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
