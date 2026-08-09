import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const businessHoursEntrySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    open: z.string().regex(timePattern, "Horário inválido.").nullable(),
    close: z.string().regex(timePattern, "Horário inválido.").nullable(),
  })
  .refine((v) => (v.open === null) === (v.close === null), {
    message: "Informe abertura e fechamento juntos, ou deixe ambos em branco para marcar como fechado.",
    path: ["close"],
  })
  .refine((v) => v.open === null || v.close === null || v.close > v.open, {
    message: "O fechamento deve ser depois da abertura.",
    path: ["close"],
  });

export const businessHoursSchema = z.array(businessHoursEntrySchema).length(7, "Informe os 7 dias da semana.");

export type BusinessHoursEntryInput = z.infer<typeof businessHoursEntrySchema>;
export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
