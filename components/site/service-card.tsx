import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDurationMinutes, formatPriceCents } from "@/lib/format";
import type { Service } from "@/types";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{service.name}</CardTitle>
        {service.description && <CardDescription>{service.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {formatDurationMinutes(service.durationMinutes)} · {formatPriceCents(service.priceCents)}
        </div>
        <Button render={<Link href={`/agendar?servico=${service.id}`} />} size="sm">
          Agendar
        </Button>
      </CardContent>
    </Card>
  );
}
