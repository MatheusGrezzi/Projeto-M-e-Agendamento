import type { ComputeAvailableSlotsParams, Slot } from "./types";

/**
 * Pure booking-slot algorithm — no Supabase/Next imports, so it's testable
 * with plain fixtures. Shared by the public booking flow and admin/atendente
 * manual booking (both call the same server action, which calls this).
 *
 * Split working hours (e.g. two windows for one weekday to represent a lunch
 * break) are just multiple entries in `workingHours`. `blocked` merges
 * time-off exceptions and existing confirmed appointments — the caller
 * doesn't need to distinguish them here, both simply remove candidate slots.
 */
export function computeAvailableSlots(params: ComputeAvailableSlotsParams): Slot[] {
  const { workingHours, blocked, serviceDurationMinutes, slotGranularityMinutes, nowMinutes } = params;
  const slots: Slot[] = [];

  for (const window of workingHours) {
    for (
      let start = window.startMinutes;
      start + serviceDurationMinutes <= window.endMinutes;
      start += slotGranularityMinutes
    ) {
      const end = start + serviceDurationMinutes;

      if (nowMinutes != null && start < nowMinutes) continue;

      // Strict inequalities: a blocked interval ending exactly at `start`
      // (or starting exactly at `end`) does NOT overlap — this is what
      // makes back-to-back bookings possible.
      const overlapsBlocked = blocked.some((b) => start < b.endMinutes && end > b.startMinutes);
      if (overlapsBlocked) continue;

      slots.push({ startMinutes: start, endMinutes: end });
    }
  }

  return slots.sort((a, b) => a.startMinutes - b.startMinutes);
}
