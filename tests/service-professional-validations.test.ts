import { describe, expect, it } from "vitest";

import { serviceSchema } from "@/lib/validations/service";
import { professionalSchema, workingHoursEntrySchema } from "@/lib/validations/professional";

describe("serviceSchema", () => {
  it("accepts a valid service", () => {
    const result = serviceSchema.safeParse({
      name: "Corte de cabelo",
      durationMinutes: 30,
      priceCents: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative duration", () => {
    const result = serviceSchema.safeParse({ name: "Corte", durationMinutes: 0, priceCents: 5000 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = serviceSchema.safeParse({ name: "Corte", durationMinutes: 30, priceCents: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects a name that's too short", () => {
    const result = serviceSchema.safeParse({ name: "C", durationMinutes: 30, priceCents: 5000 });
    expect(result.success).toBe(false);
  });
});

describe("professionalSchema", () => {
  it("accepts a minimal valid professional", () => {
    const result = professionalSchema.safeParse({ fullName: "Maria Silva" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = professionalSchema.safeParse({ fullName: "" });
    expect(result.success).toBe(false);
  });
});

describe("workingHoursEntrySchema", () => {
  it("accepts a valid window", () => {
    const result = workingHoursEntrySchema.safeParse({ weekday: 1, startTime: "09:00", endTime: "18:00" });
    expect(result.success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    const result = workingHoursEntrySchema.safeParse({ weekday: 1, startTime: "18:00", endTime: "09:00" });
    expect(result.success).toBe(false);
  });

  it("rejects a weekday outside 0-6", () => {
    const result = workingHoursEntrySchema.safeParse({ weekday: 7, startTime: "09:00", endTime: "18:00" });
    expect(result.success).toBe(false);
  });
});
