import { describe, expect, it } from "vitest";

import {
  clientExcludedEquipmentSchema,
  clientExcludedServiceSchema,
  clientLandingPageSchema,
  clientLocationSchema,
} from "@/lib/validations/client-relations";

describe("clientExcludedEquipmentSchema", () => {
  it("requires either a catalog equipment or a free-text label", () => {
    const result = clientExcludedEquipmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a catalog equipment id alone", () => {
    const result = clientExcludedEquipmentSchema.safeParse({ equipmentId: "11111111-1111-1111-1111-111111111111" });
    expect(result.success).toBe(true);
  });

  it("accepts a free-text label alone (equipment not in the catalog)", () => {
    const result = clientExcludedEquipmentSchema.safeParse({ label: "Geladeira comercial" });
    expect(result.success).toBe(true);
  });
});

describe("clientExcludedServiceSchema", () => {
  it("requires equipment, service, or a label", () => {
    const result = clientExcludedServiceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a generic label with no equipment/service tie", () => {
    const result = clientExcludedServiceSchema.safeParse({ label: "Venda de peças" });
    expect(result.success).toBe(true);
  });
});

describe("clientLocationSchema", () => {
  it("uppercases the state and defaults isServed to true", () => {
    const result = clientLocationSchema.safeParse({ city: "Betim", state: "mg" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("MG");
      expect(result.data.isServed).toBe(true);
    }
  });

  it("rejects a state that isn't a 2-letter UF", () => {
    const result = clientLocationSchema.safeParse({ city: "Betim", state: "Minas Gerais" });
    expect(result.success).toBe(false);
  });

  it("honors isServed=false (excluded region)", () => {
    const result = clientLocationSchema.safeParse({ city: "Betim", state: "MG", isServed: "false" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isServed).toBe(false);
  });
});

describe("clientLandingPageSchema", () => {
  it("rejects a URL without a protocol", () => {
    const result = clientLandingPageSchema.safeParse({ name: "LP Betim", url: "reconnect.com/betim", status: "active" });
    expect(result.success).toBe(false);
  });

  it("accepts a full https URL", () => {
    const result = clientLandingPageSchema.safeParse({ name: "LP Betim", url: "https://reconnect.com/betim", status: "active" });
    expect(result.success).toBe(true);
  });
});
