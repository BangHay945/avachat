import { describe, it, expect } from "vitest";
import type { z } from "zod";

describe("Validation Schemas", () => {
  it("loginSchema validates correct email/password", async () => {
    const { loginSchema } = await import("../middleware/validation");
    const result = loginSchema.safeParse({ email: "test@test.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("loginSchema rejects invalid email", async () => {
    const { loginSchema } = await import("../middleware/validation");
    const result = loginSchema.safeParse({ email: "not-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("registerSchema validates all fields", async () => {
    const { registerSchema } = await import("../middleware/validation");
    const result = registerSchema.safeParse({ email: "test@test.com", password: "password12345678", name: "Test User" });
    expect(result.success).toBe(true);
  });

  it("registerSchema rejects short password", async () => {
    const { registerSchema } = await import("../middleware/validation");
    const result = registerSchema.safeParse({ email: "test@test.com", password: "short", name: "Test" });
    expect(result.success).toBe(false);
  });

  it("sendMessageSchema validates content", async () => {
    const { sendMessageSchema } = await import("../middleware/validation");
    const result = sendMessageSchema.safeParse({ content: "Hello", type: "text" });
    expect(result.success).toBe(true);
  });

  it("sendMessageSchema defaults type to text", async () => {
    const { sendMessageSchema } = await import("../middleware/validation");
    const result = sendMessageSchema.safeParse({ content: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe("text");
  });

  it("updateStatusSchema validates status enum", async () => {
    const { updateStatusSchema } = await import("../middleware/validation");
    expect(updateStatusSchema.safeParse({ status: "active" }).success).toBe(true);
    expect(updateStatusSchema.safeParse({ status: "invalid" }).success).toBe(false);
  });

  it("contactSchema validates required fields", async () => {
    const { contactSchema } = await import("../middleware/validation");
    const result = contactSchema.safeParse({ name: "John Doe" });
    expect(result.success).toBe(true);
  });

  it("campaignSchema validates required fields", async () => {
    const { campaignSchema } = await import("../middleware/validation");
    const result = campaignSchema.safeParse({ name: "Test Campaign", message: "Hello World" });
    expect(result.success).toBe(true);
  });
});
