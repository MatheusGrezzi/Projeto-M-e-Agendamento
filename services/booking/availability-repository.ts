import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeAvailableSlots } from "@/lib/booking/compute-available-slots";
import type { BlockedInterval, WorkingHoursWindow } from "@/lib/booking/types";
import {
  getDateStringInTimezone,
  getMinutesSinceMidnightInTimezone,
  minutesToTimeString,
  timeStringToMinutes,
  wallTimeToUtcDate,
} from "@/lib/booking/timezone";
import { companyConfig } from "@/lib/config/company-config";

// MVP default — how far apart candidate slot start times are offered. Not
// yet a company-config field since no client has asked to change it.
const SLOT_GRANULARITY_MINUTES = 15;

export interface AvailableSlot {
  startTime: string; // "HH:MM", business timezone
  endTime: string;
}

function weekdayFromDateString(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * This is the only Supabase-aware layer around lib/booking/compute-available-
 * slots.ts's pure algorithm: fetches working hours, time-off, and existing
 * confirmed appointments for one professional/date, converts everything into
 * the minutes-since-midnight representation the pure function expects, and
 * converts the result back into "HH:MM" strings.
 */
export async function getAvailableSlots(
  supabase: SupabaseClient,
  params: { professionalId: string; serviceId: string; date: string }
): Promise<AvailableSlot[]> {
  const { professionalId, serviceId, date } = params;
  const timezone = companyConfig.timezone;
  const weekday = weekdayFromDateString(date);

  const { data: serviceRow, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();
  if (serviceError) throw new Error(`Falha ao carregar serviço: ${serviceError.message}`);

  const { data: hoursRows, error: hoursError } = await supabase
    .from("professional_working_hours")
    .select("start_time, end_time")
    .eq("professional_id", professionalId)
    .eq("weekday", weekday);
  if (hoursError) throw new Error(`Falha ao carregar horários do profissional: ${hoursError.message}`);

  const workingHours: WorkingHoursWindow[] = (hoursRows as { start_time: string; end_time: string }[]).map((row) => ({
    startMinutes: timeStringToMinutes(row.start_time.slice(0, 5)),
    endMinutes: timeStringToMinutes(row.end_time.slice(0, 5)),
  }));

  // Day boundaries in UTC for the target date, business timezone — used to
  // fetch only the time-off/appointments relevant to this date.
  const dayStartUtc = wallTimeToUtcDate(date, 0, timezone);
  const dayEndUtc = wallTimeToUtcDate(date, 24 * 60, timezone);

  const { data: timeOffRows, error: timeOffError } = await supabase
    .from("professional_time_off")
    .select("starts_at, ends_at")
    .eq("professional_id", professionalId)
    .lt("starts_at", dayEndUtc.toISOString())
    .gt("ends_at", dayStartUtc.toISOString());
  if (timeOffError) throw new Error(`Falha ao carregar bloqueios: ${timeOffError.message}`);

  const { data: apptRows, error: apptError } = await supabase
    .from("appointments")
    .select("starts_at, ends_at")
    .eq("professional_id", professionalId)
    .eq("status", "confirmed")
    .lt("starts_at", dayEndUtc.toISOString())
    .gt("ends_at", dayStartUtc.toISOString());
  if (apptError) throw new Error(`Falha ao carregar agendamentos existentes: ${apptError.message}`);

  // Appointments/time-off are assumed same-day in the business timezone
  // (working hours never cross midnight in this template) — MVP
  // simplification, documented in CUSTOMIZATION.md.
  const toBlocked = (row: { starts_at: string; ends_at: string }): BlockedInterval => ({
    startMinutes: getMinutesSinceMidnightInTimezone(new Date(row.starts_at), timezone),
    endMinutes: getMinutesSinceMidnightInTimezone(new Date(row.ends_at), timezone),
  });

  const blocked: BlockedInterval[] = [
    ...(timeOffRows as { starts_at: string; ends_at: string }[]).map(toBlocked),
    ...(apptRows as { starts_at: string; ends_at: string }[]).map(toBlocked),
  ];

  const now = new Date();
  const nowMinutes = getDateStringInTimezone(now, timezone) === date ? getMinutesSinceMidnightInTimezone(now, timezone) : null;

  const slots = computeAvailableSlots({
    workingHours,
    blocked,
    serviceDurationMinutes: serviceRow.duration_minutes,
    slotGranularityMinutes: SLOT_GRANULARITY_MINUTES,
    nowMinutes,
  });

  return slots.map((slot) => ({
    startTime: minutesToTimeString(slot.startMinutes),
    endTime: minutesToTimeString(slot.endMinutes),
  }));
}
