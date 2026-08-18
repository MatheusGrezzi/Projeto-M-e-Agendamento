import { z } from "zod";

export const createCampaignSchema = z.object({
  clientId: z.string().uuid("Selecione um cliente."),
  name: z.string().trim().min(3, "Dê um nome para a campanha."),
  segmentId: z.string().uuid("Selecione um segmento."),
  equipmentIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um equipamento."),
  clientServiceIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um serviço."),
  clientLocationIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma região."),
  conversionIds: z.array(z.string().uuid()),
  landingPageIds: z.array(z.string().uuid()),
  dailyBudget: z.number().positive("Informe um orçamento diário válido."),
  objective: z.enum(["leads", "whatsapp", "calls", "forms", "bookings"]),
  notes: z.string().trim().nullable(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const regenerateCampaignSchema = z.object({
  reason: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});
