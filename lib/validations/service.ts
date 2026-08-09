import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço."),
  description: z.string().trim().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive("A duração deve ser maior que zero."),
  priceCents: z.coerce.number().int().min(0, "O preço não pode ser negativo."),
  active: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
