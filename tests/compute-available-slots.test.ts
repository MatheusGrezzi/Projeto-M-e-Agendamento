import { describe, expect, it } from "vitest";

import { computeAvailableSlots } from "@/lib/booking/compute-available-slots";

describe("computeAvailableSlots", () => {
  it("returns evenly spaced slots covering a simple working-hours window", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 10 * 60 }],
      blocked: [],
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
    });

    expect(slots).toEqual([
      { startMinutes: 540, endMinutes: 570 }, // 09:00-09:30
      { startMinutes: 570, endMinutes: 600 }, // 09:30-10:00
    ]);
  });

  it("excludes slots overlapping an existing appointment but keeps adjacent ones", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 12 * 60 }],
      blocked: [{ startMinutes: 10 * 60, endMinutes: 10 * 60 + 30 }], // 10:00-10:30 booked
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
    });

    const starts = slots.map((s) => s.startMinutes);
    expect(starts).not.toContain(10 * 60);
    expect(starts).toContain(9 * 60 + 30); // 09:30 still available (adjacent, before)
    expect(starts).toContain(10 * 60 + 30); // 10:30 still available (adjacent, after)
  });

  it("allows back-to-back bookings at an exact boundary", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 10 * 60 }],
      // Existing appointment ends exactly at 09:30 — a slot starting at 09:30 must NOT be blocked.
      blocked: [{ startMinutes: 9 * 60, endMinutes: 9 * 60 + 30 }],
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
    });

    expect(slots).toEqual([{ startMinutes: 570, endMinutes: 600 }]);
  });

  it("respects split working hours (lunch break as two windows)", () => {
    const slots = computeAvailableSlots({
      workingHours: [
        { startMinutes: 9 * 60, endMinutes: 12 * 60 }, // 09:00-12:00
        { startMinutes: 13 * 60, endMinutes: 18 * 60 }, // 13:00-18:00
      ],
      blocked: [],
      serviceDurationMinutes: 60,
      slotGranularityMinutes: 60,
    });

    const starts = slots.map((s) => s.startMinutes);
    expect(starts).not.toContain(12 * 60); // nothing starting during lunch
    expect(starts).not.toContain(12 * 60 + 30);
    expect(starts).toContain(11 * 60); // last slot before lunch
    expect(starts).toContain(13 * 60); // first slot after lunch
  });

  it("returns zero slots when time-off fully covers the day", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 18 * 60 }],
      blocked: [{ startMinutes: 0, endMinutes: 24 * 60 }],
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
    });

    expect(slots).toEqual([]);
  });

  it("keeps slots outside a partial time-off window", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 12 * 60 }],
      blocked: [{ startMinutes: 9 * 60, endMinutes: 10 * 60 + 30 }], // off until 10:30
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
    });

    const starts = slots.map((s) => s.startMinutes);
    expect(starts).not.toContain(9 * 60);
    expect(starts).not.toContain(9 * 60 + 30);
    expect(starts).toContain(10 * 60 + 30);
    expect(starts).toContain(11 * 60);
  });

  it("excludes a slot whose duration would run past the window end", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 10 * 60 }],
      blocked: [],
      serviceDurationMinutes: 45,
      slotGranularityMinutes: 15,
    });

    // Only 09:00-09:45 fits; 09:15 would end at 10:00 which is fine (== end), but 09:30 would end at 10:15 (past end).
    const starts = slots.map((s) => s.startMinutes);
    expect(starts).toContain(9 * 60);
    expect(starts).toContain(9 * 60 + 15);
    expect(starts).not.toContain(9 * 60 + 30);
  });

  it("excludes slots starting before now on the current date, keeps future ones", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 12 * 60 }],
      blocked: [],
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
      nowMinutes: 10 * 60 + 15, // 10:15
    });

    const starts = slots.map((s) => s.startMinutes);
    expect(starts).not.toContain(9 * 60);
    expect(starts).not.toContain(9 * 60 + 30);
    expect(starts).not.toContain(10 * 60);
    expect(starts).toContain(10 * 60 + 30);
  });

  it("ignores the now cutoff when nowMinutes is not provided (future date)", () => {
    const slots = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 10 * 60 }],
      blocked: [],
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
    });

    expect(slots.map((s) => s.startMinutes)).toEqual([9 * 60, 9 * 60 + 30]);
  });

  it("returns an empty array without throwing when there are no working hours for the weekday", () => {
    const slots = computeAvailableSlots({
      workingHours: [],
      blocked: [],
      serviceDurationMinutes: 30,
      slotGranularityMinutes: 30,
    });

    expect(slots).toEqual([]);
  });

  it("produces correctly spaced candidates for different slot granularities", () => {
    const slots15 = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 9 * 60 + 30 }],
      blocked: [],
      serviceDurationMinutes: 15,
      slotGranularityMinutes: 15,
    });
    expect(slots15.map((s) => s.startMinutes)).toEqual([540, 555]);

    const slots30 = computeAvailableSlots({
      workingHours: [{ startMinutes: 9 * 60, endMinutes: 10 * 60 }],
      blocked: [],
      serviceDurationMinutes: 15,
      slotGranularityMinutes: 30,
    });
    expect(slots30.map((s) => s.startMinutes)).toEqual([540, 570]);
  });
});
