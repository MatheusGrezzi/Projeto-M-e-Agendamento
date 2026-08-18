import { describe, expect, it } from "vitest";

import { clientCompanySchema, clientGoalsSchema } from "@/lib/validations/client";

describe("clientCompanySchema", () => {
  it("requires a name", () => {
    const result = clientCompanySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal valid payload and normalizes blanks to null", () => {
    const result = clientCompanySchema.safeParse({ name: "Frio Fácil", website: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBeNull();
      expect(result.data.tradeName).toBeNull();
    }
  });

  it("rejects a website without a protocol", () => {
    const result = clientCompanySchema.safeParse({ name: "Frio Fácil", website: "friofacil.com" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid e-mail", () => {
    const result = clientCompanySchema.safeParse({ name: "Frio Fácil", email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("clientGoalsSchema", () => {
  it("treats blank fields as null instead of failing", () => {
    const result = clientGoalsSchema.safeParse({ dailyBudget: "", leadGoal: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dailyBudget).toBeNull();
      expect(result.data.leadGoal).toBeNull();
    }
  });

  it("parses numeric strings", () => {
    const result = clientGoalsSchema.safeParse({ dailyBudget: "150.50", leadGoal: "20" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dailyBudget).toBe(150.5);
      expect(result.data.leadGoal).toBe(20);
    }
  });

  it("rejects a non-integer lead goal", () => {
    const result = clientGoalsSchema.safeParse({ leadGoal: "20.5" });
    expect(result.success).toBe(false);
  });
});
