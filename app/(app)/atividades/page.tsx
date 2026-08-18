import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTimeBr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { listRecentActivity } from "@/services/activity-log-repository";
import { getMyOrganization } from "@/services/organizations-repository";

export default async function AtividadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const org = await getMyOrganization(supabase, user.id);
  if (!org) redirect("/login");

  const activity = await listRecentActivity(supabase, org.id, 100);

  return (
    <div>
      <PageHeader title="Atividades" description="Tudo que foi feito na operação, em ordem cronológica." />
      <Card>
        <CardContent>
          {activity.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="text-foreground">
                    <span className="font-medium">{entry.userName ?? "Alguém"}</span> {entry.action}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTimeBr(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
