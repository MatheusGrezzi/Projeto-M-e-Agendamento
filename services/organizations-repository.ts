import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrgRole } from "@/types";

/** The organization the current user belongs to, plus their role in it. V1 is single-tenant, so this is always exactly one row. */
export async function getMyOrganization(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; name: string; role: OrgRole } | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id, name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar organização: ${error.message}`);
  if (!data || !data.organization) return null;

  const org = data.organization as unknown as { id: string; name: string };
  return { id: org.id, name: org.name, role: data.role as OrgRole };
}

export interface OrganizationMemberRow {
  id: string;
  role: OrgRole;
  fullName: string | null;
  email: string | null;
}

export async function listOrganizationMembers(supabase: SupabaseClient, organizationId: string): Promise<OrganizationMemberRow[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, member:profiles(id, full_name, email)")
    .eq("organization_id", organizationId);

  if (error) throw new Error(`Falha ao carregar membros: ${error.message}`);

  return (data as unknown as { role: OrgRole; member: { id: string; full_name: string | null; email: string | null } | null }[])
    .filter((row) => row.member)
    .map((row) => ({ id: row.member!.id, role: row.role, fullName: row.member!.full_name, email: row.member!.email }));
}
