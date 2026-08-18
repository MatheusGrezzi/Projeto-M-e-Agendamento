import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CircleGauge,
  ClipboardCheck,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/services/dashboard-repository";
import { listRecentActivity } from "@/services/activity-log-repository";
import { getMyOrganization } from "@/services/organizations-repository";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const org = await getMyOrganization(supabase, user.id);
  if (!org) redirect("/login");

  const [stats, activity] = await Promise.all([
    getDashboardStats(supabase, org.id),
    listRecentActivity(supabase, org.id, 8),
  ]);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da operação da Reconnect." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total de clientes" value={stats.totalClients} icon={Users} />
        <StatCard label="Clientes ativos" value={stats.activeClients} icon={UserCheck} />
        <StatCard label="Em onboarding" value={stats.onboardingClients} icon={ClipboardCheck} />
        <StatCard label="Pausados" value={stats.pausedClients} icon={AlertTriangle} />
      </div>

      <p className="mt-8 mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Campanhas — disponível a partir da Fase 2
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Campanhas ativas" value="—" icon={Megaphone} muted />
        <StatCard label="Em planejamento" value="—" icon={CircleGauge} muted />
        <StatCard label="Em auditoria" value="—" icon={ShieldCheck} muted />
        <StatCard label="Aguardando aprovação" value="—" icon={ClipboardCheck} muted />
        <StatCard label="Recomendações pendentes" value="—" icon={Sparkles} muted />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Últimas atividades</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="text-foreground">
                      <span className="font-medium">{entry.userName ?? "Alguém"}</span> {entry.action}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Comece cadastrando um cliente em{" "}
        <Link href="/clientes" className="font-medium text-primary hover:underline">
          Clientes
        </Link>
        .
      </p>
    </div>
  );
}
