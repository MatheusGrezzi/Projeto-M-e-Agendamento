import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { testimonialFromRow, type TestimonialRow } from "@/lib/mappers";
import type { TestimonialInput } from "@/lib/validations/testimonial";
import type { Testimonial } from "@/types";

export async function listTestimonials(supabase: SupabaseClient): Promise<Testimonial[]> {
  const { data, error } = await supabase.from("testimonials").select("*").order("display_order", { ascending: true });
  if (error) throw new Error(`Falha ao carregar depoimentos: ${error.message}`);
  return (data as TestimonialRow[]).map(testimonialFromRow);
}

export async function createTestimonial(supabase: SupabaseClient, input: TestimonialInput): Promise<Testimonial> {
  const { data, error } = await supabase
    .from("testimonials")
    .insert({
      client_name: input.clientName,
      content: input.content,
      rating: input.rating ?? null,
      featured: input.featured,
      display_order: input.displayOrder,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao criar depoimento: ${error.message}`);
  return testimonialFromRow(data as TestimonialRow);
}

export async function deleteTestimonial(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover depoimento: ${error.message}`);
}
