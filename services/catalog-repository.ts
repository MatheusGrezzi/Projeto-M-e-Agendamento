import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { brandFromRow, equipmentFromRow, segmentFromRow, serviceTypeFromRow } from "@/lib/mappers";
import type { BrandRow, EquipmentRow, SegmentRow, ServiceTypeRow } from "@/lib/mappers";
import type { CustomBrandInput, CustomEquipmentInput, CustomServiceTypeInput } from "@/lib/validations/catalog";
import type { Brand, Equipment, Segment, ServiceType } from "@/types";

export async function listSegments(supabase: SupabaseClient): Promise<Segment[]> {
  const { data, error } = await supabase.from("segments").select("*").order("label");
  if (error) throw new Error(`Falha ao carregar segmentos: ${error.message}`);
  return (data as SegmentRow[]).map(segmentFromRow);
}

/** Global equipment catalog plus this org's custom entries. */
export async function listEquipment(supabase: SupabaseClient, organizationId: string): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("name");
  if (error) throw new Error(`Falha ao carregar equipamentos: ${error.message}`);
  return (data as EquipmentRow[]).map(equipmentFromRow);
}

export async function createCustomEquipment(
  supabase: SupabaseClient,
  organizationId: string,
  input: CustomEquipmentInput
): Promise<Equipment> {
  const { data, error } = await supabase
    .from("equipment")
    .insert({ organization_id: organizationId, segment_id: input.segmentId, name: input.name })
    .select("*")
    .single();
  if (error) throw new Error(`Falha ao criar equipamento: ${error.message}`);
  return equipmentFromRow(data as EquipmentRow);
}

/** Global service-type catalog plus this org's custom entries. */
export async function listServiceTypes(supabase: SupabaseClient, organizationId: string): Promise<ServiceType[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("name");
  if (error) throw new Error(`Falha ao carregar serviços: ${error.message}`);
  return (data as ServiceTypeRow[]).map(serviceTypeFromRow);
}

export async function createCustomServiceType(
  supabase: SupabaseClient,
  organizationId: string,
  input: CustomServiceTypeInput
): Promise<ServiceType> {
  const { data, error } = await supabase
    .from("services")
    .insert({ organization_id: organizationId, name: input.name })
    .select("*")
    .single();
  if (error) throw new Error(`Falha ao criar serviço: ${error.message}`);
  return serviceTypeFromRow(data as ServiceTypeRow);
}

/** Global brand catalog plus this org's custom entries. */
export async function listBrands(supabase: SupabaseClient, organizationId: string): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("name");
  if (error) throw new Error(`Falha ao carregar marcas: ${error.message}`);
  return (data as BrandRow[]).map(brandFromRow);
}

export async function createCustomBrand(supabase: SupabaseClient, organizationId: string, input: CustomBrandInput): Promise<Brand> {
  const { data, error } = await supabase
    .from("brands")
    .insert({ organization_id: organizationId, name: input.name })
    .select("*")
    .single();
  if (error) throw new Error(`Falha ao criar marca: ${error.message}`);
  return brandFromRow(data as BrandRow);
}
