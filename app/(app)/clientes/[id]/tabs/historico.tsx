import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateTimeBr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { listClientActivity } from "@/services/activity-log-repository";

export async function HistoricoTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const activity = await listClientActivity(supabase, clientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Histórico de alterações</CardTitle>
        <CardDescription>Registro de tudo que foi alterado neste cliente.</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
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
  );
}
