import { z } from "zod";

export const clientServiceOfferingSchema = z.object({
  equipmentId: z.string().uuid("Selecione um equipamento."),
  serviceId: z.string().uuid("Selecione um serviço."),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});
export type ClientServiceOfferingInput = z.infer<typeof clientServiceOfferingSchema>;

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const clientExcludedEquipmentSchema = z
  .object({
    equipmentId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    label: optionalText,
    notes: optionalText,
  })
  .refine((v) => v.equipmentId !== null || v.label !== null, {
    message: "Selecione um equipamento do catálogo ou descreva o que não é atendido.",
    path: ["label"],
  });
export type ClientExcludedEquipmentInput = z.infer<typeof clientExcludedEquipmentSchema>;

export const clientExcludedServiceSchema = z
  .object({
    equipmentId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    serviceId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    label: optionalText,
    notes: optionalText,
  })
  .refine((v) => v.equipmentId !== null || v.serviceId !== null || v.label !== null, {
    message: "Selecione um equipamento/serviço ou descreva o que não é realizado.",
    path: ["label"],
  });
export type ClientExcludedServiceInput = z.infer<typeof clientExcludedServiceSchema>;

export const clientBrandStatusSchema = z.object({
  brandId: z.string().uuid("Selecione uma marca."),
  status: z.enum(["served", "not_served"]),
});
export type ClientBrandStatusInput = z.infer<typeof clientBrandStatusSchema>;

export const clientLocationSchema = z.object({
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado (ex: MG).")
    .transform((v) => v.toUpperCase()),
  neighborhood: optionalText,
  priority: z
    .enum(["muito_alta", "alta", "media", "baixa", ""])
    .optional()
    .transform((v) => (v ? v : null)),
  isServed: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v !== "false"),
});
export type ClientLocationInput = z.infer<typeof clientLocationSchema>;

export const clientLandingPageSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da landing page."),
  url: z
    .string()
    .trim()
    .min(1, "Informe a URL.")
    .refine((v) => /^https?:\/\//i.test(v), "Informe uma URL completa (com http:// ou https://)."),
  segmentId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  equipmentId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  serviceId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  city: optionalText,
  status: z.enum(["active", "inactive"]),
});
export type ClientLandingPageInput = z.infer<typeof clientLandingPageSchema>;

export const clientConversionSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da conversão."),
  platform: optionalText,
  conversionType: z.enum(["whatsapp", "call", "form", "booking", "purchase", "other"]),
  externalId: optionalText,
  status: z.enum(["active", "inactive"]),
  isPrimary: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
  notes: optionalText,
});
export type ClientConversionInput = z.infer<typeof clientConversionSchema>;
