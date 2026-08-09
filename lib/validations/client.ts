import { z } from "zod";

export const updateClientDetailsSchema = z.object({
  cpf: z.string().trim().optional().or(z.literal("")),
  healthInsurance: z.string().trim().optional().or(z.literal("")),
  allergiesNotes: z.string().trim().optional().or(z.literal("")),
});

export const createClientRecordSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().trim().min(3, "Escreva uma anotação."),
});

export type UpdateClientDetailsInput = z.infer<typeof updateClientDetailsSchema>;
export type CreateClientRecordInput = z.infer<typeof createClientRecordSchema>;
