import { z } from "zod";

export const customEquipmentSchema = z.object({
  segmentId: z.string().uuid("Selecione um segmento."),
  name: z.string().trim().min(2, "Informe o nome do equipamento."),
});
export type CustomEquipmentInput = z.infer<typeof customEquipmentSchema>;

export const customServiceTypeSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço."),
});
export type CustomServiceTypeInput = z.infer<typeof customServiceTypeSchema>;

export const customBrandSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da marca."),
});
export type CustomBrandInput = z.infer<typeof customBrandSchema>;
