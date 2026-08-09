import { describe, expect, it } from "vitest";

import { availableSlotsQuerySchema, cancelAppointmentSchema, createAppointmentSchema } from "@/lib/validations/booking";

// Real random UUIDs — zod v4's uuid() check validates the version/variant
// nibbles, so simplified fixtures like "1111...1111" fail even though they
// look UUID-shaped.
const PROFESSIONAL_ID = "cc1ec6c6-cd73-40e5-80e0-1825752b129a";
const SERVICE_ID = "bde49156-fb3b-4111-a7bf-900993b0db97";
const APPOINTMENT_ID = "7c428423-39ae-481f-bdf8-d6fd56b19aff";

describe("availableSlotsQuerySchema", () => {
  it("accepts a valid query", () => {
    const result = availableSlotsQuerySchema.safeParse({
      professionalId: PROFESSIONAL_ID,
      serviceId: SERVICE_ID,
      date: "2026-08-10",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed date", () => {
    const result = availableSlotsQuerySchema.safeParse({
      professionalId: PROFESSIONAL_ID,
      serviceId: SERVICE_ID,
      date: "10/08/2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid professionalId", () => {
    const result = availableSlotsQuerySchema.safeParse({
      professionalId: "not-a-uuid",
      serviceId: SERVICE_ID,
      date: "2026-08-10",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAppointmentSchema", () => {
  it("accepts a minimal valid booking (no clientId — public flow uses the session user)", () => {
    const result = createAppointmentSchema.safeParse({
      professionalId: PROFESSIONAL_ID,
      serviceId: SERVICE_ID,
      date: "2026-08-10",
      startTime: "09:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an explicit clientId (staff booking on behalf of a client)", () => {
    const result = createAppointmentSchema.safeParse({
      professionalId: PROFESSIONAL_ID,
      serviceId: SERVICE_ID,
      date: "2026-08-10",
      startTime: "09:00",
      clientId: APPOINTMENT_ID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid startTime", () => {
    const result = createAppointmentSchema.safeParse({
      professionalId: PROFESSIONAL_ID,
      serviceId: SERVICE_ID,
      date: "2026-08-10",
      startTime: "25:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("cancelAppointmentSchema", () => {
  it("accepts a valid appointmentId", () => {
    const result = cancelAppointmentSchema.safeParse({ appointmentId: APPOINTMENT_ID });
    expect(result.success).toBe(true);
  });

  it("rejects a missing appointmentId", () => {
    const result = cancelAppointmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
