/**
 * Everything here works in "minutes since midnight of the target date," not
 * Date objects — this keeps compute-available-slots.ts pure and trivially
 * testable. Converting a timestamptz (DB) or Date (now) into this minutes
 * representation, in the business's fixed timezone, is timezone.ts's job;
 * doing that conversion is the caller's (repository's) responsibility.
 */

export interface WorkingHoursWindow {
  startMinutes: number;
  endMinutes: number;
}

/** A time-off exception or an existing appointment, already clipped to the target date. */
export interface BlockedInterval {
  startMinutes: number;
  endMinutes: number;
}

export interface Slot {
  startMinutes: number;
  endMinutes: number;
}

export interface ComputeAvailableSlotsParams {
  workingHours: WorkingHoursWindow[];
  blocked: BlockedInterval[];
  serviceDurationMinutes: number;
  slotGranularityMinutes: number;
  /** Minutes-since-midnight cutoff, or null/undefined when the target date isn't "today" (no cutoff). */
  nowMinutes?: number | null;
}
