import { Plus } from "lucide-react";
import Link from "next/link";

import { CampaignStatusBadge } from "@/components/shared/campaign-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { listCampaignsForClient } from "@/services/campaigns-repository";

const OBJECTIVE_LABEL = { leads: "Leads", whatsapp: "WhatsApp", calls: "Ligações", forms: "Formulários", bookings: "Agendamentos" } as const;

export async function CampanhasTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const campaigns = await listCampaignsForClient(supabase, clientId);

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button render={<Link href="/campanhas/nova" />} size="sm">
            <Plus className="size-4" />
            Nova campanha
          </Button>
        </div>
        {campaigns.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma campanha criada para este cliente ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Orçamento diário</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/campanhas/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>{OBJECTIVE_LABEL[c.objective]}</TableCell>
                  <TableCell>{formatCurrencyBRL(c.dailyBudget)}</TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
