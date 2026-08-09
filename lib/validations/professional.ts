import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const professionalSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome do profissional."),
  bio: z.string().trim().optional().or(z.literal("")),
  photoUrl: z.string().trim().optional().or(z.literal("")),
  active: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
  serviceIds: z.array(z.string().uuid()).default([]),
});

export const workingHoursEntrySchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern, "Horário inválido."),
    endTime: z.string().regex(timePattern, "Horário inválido."),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "O horário final deve ser depois do inicial.",
    path: ["endTime"],
  });

export type ProfessionalInput = z.infer<typeof professionalSchema>;
export type WorkingHoursEntryInput = z.infer<typeof workingHoursEntrySchema>;
