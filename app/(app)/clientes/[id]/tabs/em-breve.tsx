import { Sparkles } from "lucide-react";

export function EmBreveTab({ label, phase }: { label: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
      <Sparkles className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{label} — em breve</p>
      <p className="max-w-sm text-sm text-muted-foreground">{phase}</p>
    </div>
  );
}
