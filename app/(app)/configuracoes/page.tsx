import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getMyOrganization, listOrganizationMembers } from "@/services/organizations-repository";

const ROLE_LABEL = { owner: "Proprietário", admin: "Admin", member: "Membro" } as const;

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const org = await getMyOrganization(supabase, user.id);
  if (!org) redirect("/login");

  const members = await listOrganizationMembers(supabase, org.id);

  return (
    <div>
      <PageHeader title="Configurações" description="Organização e usuários." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Organização</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{org.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Usuários</CardTitle>
            <CardDescription>Novas contas criadas via Supabase Auth entram automaticamente nesta organização.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.fullName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.role === "owner" ? "default" : "secondary"}>{ROLE_LABEL[m.role]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
