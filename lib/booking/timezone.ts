/**
 * Small helpers converting between the business's fixed IANA timezone
 * (company-config.ts's `timezone`, not per-request/browser timezone — this
 * is a single-tenant-per-deployment app) and the plain
 * "minutes since midnight"/"YYYY-MM-DD" representations compute-available-
 * slots.ts works with.
 */

export function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

/** "YYYY-MM-DD" for `date`, as seen in `timeZone` (e.g. distinguishing "today" across a UTC day boundary). */
export function getDateStringInTimezone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/** Minutes since midnight for `date`, as seen in `timeZone`. */
export function getMinutesSinceMidnightInTimezone(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/**
 * Converts a "YYYY-MM-DD" + minutes-since-midnight pair (both wall-clock in
 * `timeZone`) into a real UTC Date, by resolving the timezone's current
 * offset from `Intl` and applying it. Good enough for the fixed, known
 * offsets this template targets (e.g. America/Sao_Paulo, no DST since 2019);
 * documented as a simplification, not a general-purpose tz library.
 */
export function wallTimeToUtcDate(dateStr: string, minutes: number, timeZone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  // First guess: treat the wall time as if it were UTC, then measure how far
  // that guess drifts from the intended timezone and correct for it.
  const naiveUtc = new Date(Date.UTC(year, month - 1, day, hours, mins));
  const offsetMinutes = getMinutesSinceMidnightInTimezone(naiveUtc, timeZone) - (hours * 60 + mins);
  return new Date(naiveUtc.getTime() - offsetMinutes * 60_000);
}
