import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\//i.test(v), "Informe uma URL completa (com http:// ou https://).");

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : null))
  .refine((v) => v === null || !Number.isNaN(v), "Informe um número válido.");

const optionalInt = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : null))
  .refine((v) => v === null || Number.isInteger(v), "Informe um número inteiro.");

export const clientCompanySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa."),
  tradeName: optionalText,
  cnpj: optionalText,
  website: optionalUrl,
  whatsapp: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().email().safeParse(v).success, "Informe um e-mail válido."),
  businessHours: optionalText,
  notes: optionalText,
  primaryCity: optionalText,
  primaryState: optionalText,
});

export type ClientCompanyInput = z.infer<typeof clientCompanySchema>;

export const clientStatusSchema = z.object({
  status: z.enum(["onboarding", "active", "paused", "churned"]),
});

export const clientGoalsSchema = z.object({
  dailyBudget: optionalNumber,
  monthlyBudgetEstimate: optionalNumber,
  averageTicket: optionalNumber,
  leadGoal: optionalInt,
  cplGoal: optionalNumber,
  closedServicesGoal: optionalInt,
  cpaGoal: optionalNumber,
  roasGoal: optionalNumber,
});

export type ClientGoalsInput = z.infer<typeof clientGoalsSchema>;
