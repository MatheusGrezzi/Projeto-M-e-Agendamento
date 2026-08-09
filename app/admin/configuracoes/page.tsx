import { BusinessHoursForm } from "./business-hours-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { companyConfig } from "@/lib/config/company-config";
import { getCompanySettings } from "@/lib/config/get-company-settings";

export default async function ConfiguracoesPage() {
  const { businessHours, settingsId } = await getCompanySettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Horário de funcionamento</CardTitle>
          <CardDescription>Controla o horário exibido no site e usado para calcular disponibilidade.</CardDescription>
        </CardHeader>
        <CardContent>
          {settingsId ? (
            <BusinessHoursForm settingsId={settingsId} initialHours={businessHours} />
          ) : (
            <p className="text-sm text-destructive">
              Configurações não encontradas no banco de dados. Rode as migrations (supabase/migrations) para criar a linha inicial.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identidade e informações da empresa</CardTitle>
          <CardDescription>
            Nome, logo, cores, contato e SEO deste projeto são controlados por arquivo, não por este painel — veja{" "}
            <code className="rounded bg-muted px-1 py-0.5">lib/config/company-config.ts</code> e{" "}
            <code className="rounded bg-muted px-1 py-0.5">CUSTOMIZATION.md</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> {companyConfig.name}
          </p>
          <p>
            <span className="text-muted-foreground">Telefone:</span> {companyConfig.contact.phone || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail:</span> {companyConfig.contact.email || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">WhatsApp:</span> {companyConfig.contact.whatsapp || "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
