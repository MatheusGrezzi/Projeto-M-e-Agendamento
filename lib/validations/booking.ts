import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availableSlotsQuerySchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(datePattern, "Data inválida."),
});

export const createAppointmentSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(datePattern, "Data inválida."),
  startTime: z.string().regex(timePattern, "Horário inválido."),
  // Set by staff when booking manually on behalf of a client; the public
  // booking flow ignores this and always books for the session's own user.
  clientId: z.string().uuid().optional(),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
