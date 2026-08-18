import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { JsonToggle } from "./json-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateTimeBr } from "@/lib/format";
import type { AuditIssue, AuditSeverity } from "@/lib/schemas/campaign-audit";
import type { CampaignAudit } from "@/types";

const STATUS_LABEL = { approved: "Aprovada", warning: "Aprovada com alertas", rejected: "Reprovada" } as const;
const STATUS_VARIANT = { approved: "default", warning: "secondary", rejected: "destructive" } as const;

const SEVERITY_LABEL: Record<AuditSeverity, string> = { critical: "Crítico", high: "Alto", medium: "Médio", low: "Baixo" };
const SEVERITY_ORDER: AuditSeverity[] = ["critical", "high", "medium", "low"];
const SEVERITY_ICON = { critical: AlertOctagon, high: AlertTriangle, medium: Info, low: Info } as const;
const SEVERITY_COLOR: Record<AuditSeverity, string> = {
  critical: "border-destructive/40 bg-destructive/5 text-destructive",
  high: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-500",
  medium: "border-border bg-muted/40 text-foreground",
  low: "border-border bg-muted/20 text-muted-foreground",
};

function IssueCard({ issue }: { issue: AuditIssue }) {
  const Icon = SEVERITY_ICON[issue.severity];
  return (
    <div className={`space-y-1.5 rounded-lg border p-3 text-sm ${SEVERITY_COLOR[issue.severity]}`}>
      <div className="flex items-center gap-2 font-medium">
        <Icon className="size-4 shrink-0" />
        {issue.title}
        {issue.requires_regeneration && (
          <Badge variant="destructive" className="text-xs">
            requer regeneração
          </Badge>
        )}
      </div>
      <p>{issue.problem}</p>
      <p className="text-xs opacity-80">Evidência: {issue.evidence}</p>
      <p className="text-xs font-medium">Recomendação: {issue.recommendation}</p>
    </div>
  );
}

export function AuditReportCard({ audit }: { audit: CampaignAudit }) {
  const issuesBySeverity = SEVERITY_ORDER.map((severity) => ({
    severity,
    issues: audit.report.issues.filter((i) => i.severity === severity),
  })).filter((g) => g.issues.length > 0);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4" />
            Auditoria — {audit.score}/100
          </CardTitle>
          <CardDescription>
            {audit.auditorProvider === "ai" ? `Claude (${audit.auditorModel})` : "Motor determinístico"} · {formatDateTimeBr(audit.createdAt)}
          </CardDescription>
        </div>
        <Badge variant={STATUS_VARIANT[audit.status]}>{STATUS_LABEL[audit.status]}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground">{audit.report.summary}</p>

        {issuesBySeverity.map(({ severity, issues }) => (
          <div key={severity} className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {SEVERITY_LABEL[severity]} ({issues.length})
            </p>
            <div className="space-y-2">
              {issues.map((issue, i) => (
                <IssueCard key={i} issue={issue} />
              ))}
            </div>
          </div>
        ))}

        {audit.report.positives.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Pontos positivos</p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-foreground">
              {audit.report.positives.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {audit.report.recommendations.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Recomendações</p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              {audit.report.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <JsonToggle json={audit.report} />
      </CardContent>
    </Card>
  );
}
