import { z } from "zod";

export const testimonialSchema = z.object({
  clientName: z.string().trim().min(2, "Informe o nome do cliente."),
  content: z.string().trim().min(5, "Escreva o depoimento."),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
