import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  phase,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-24 text-center">
        <Icon className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Em breve</p>
        <p className="max-w-sm text-sm text-muted-foreground">{phase}</p>
      </div>
    </div>
  );
}
