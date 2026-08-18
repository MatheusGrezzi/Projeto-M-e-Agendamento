"use client";

import { Code2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function JsonToggle({ json }: { json: unknown }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <Code2 className="size-4" />
        {open ? "Ocultar JSON" : "Ver JSON"}
      </Button>
      {open && (
        <pre className="mt-3 max-h-[32rem] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs text-foreground">
          {JSON.stringify(json, null, 2)}
        </pre>
      )}
    </div>
  );
}
