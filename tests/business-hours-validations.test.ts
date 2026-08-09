import { describe, expect, it } from "vitest";

import { businessHoursEntrySchema, businessHoursSchema } from "@/lib/validations/business-hours";

describe("businessHoursEntrySchema", () => {
  it("accepts an open day", () => {
    const result = businessHoursEntrySchema.safeParse({ weekday: 1, open: "09:00", close: "18:00" });
    expect(result.success).toBe(true);
  });

  it("accepts a closed day (both null)", () => {
    const result = businessHoursEntrySchema.safeParse({ weekday: 0, open: null, close: null });
    expect(result.success).toBe(true);
  });

  it("rejects open set without close", () => {
    const result = businessHoursEntrySchema.safeParse({ weekday: 1, open: "09:00", close: null });
    expect(result.success).toBe(false);
  });

  it("rejects close before open", () => {
    const result = businessHoursEntrySchema.safeParse({ weekday: 1, open: "18:00", close: "09:00" });
    expect(result.success).toBe(false);
  });
});

describe("businessHoursSchema", () => {
  it("accepts exactly 7 entries", () => {
    const entries = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      open: weekday === 0 ? null : "09:00",
      close: weekday === 0 ? null : "18:00",
    }));
    const result = businessHoursSchema.safeParse(entries);
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 7 entries", () => {
    const result = businessHoursSchema.safeParse([{ weekday: 1, open: "09:00", close: "18:00" }]);
    expect(result.success).toBe(false);
  });
});
