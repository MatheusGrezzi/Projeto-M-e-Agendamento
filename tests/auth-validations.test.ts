import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "cliente@example.com", password: "senha123" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "senha123" });
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = loginSchema.safeParse({ email: "cliente@example.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const result = signupSchema.safeParse({ name: "Maria Silva", email: "cliente@example.com", password: "senha123" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = signupSchema.safeParse({ name: "", email: "cliente@example.com", password: "senha123" });
    expect(result.success).toBe(false);
  });
});
