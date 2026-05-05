import { describe, it, expect } from "vitest";
import { analyzeSentiment, generateSummary } from "../services/ai";

describe("Sentiment Analysis", () => {
  it("detects positive sentiment", () => {
    const result = analyzeSentiment("Terima kasih, pelayanannya bagus dan cepat!");
    expect(result.sentiment).toBe("positive");
    expect(result.score).toBeGreaterThan(0);
  });

  it("detects negative sentiment", () => {
    const result = analyzeSentiment("Ini buruk sekali, saya kecewa dan marah!");
    expect(result.sentiment).toBe("negative");
    expect(result.score).toBeGreaterThan(0);
  });

  it("detects neutral sentiment", () => {
    const result = analyzeSentiment("Halo, apa kabar?");
    expect(result.sentiment).toBe("neutral");
    expect(result.score).toBe(0);
  });

  it("handles empty string", () => {
    const result = analyzeSentiment("");
    expect(result.sentiment).toBe("neutral");
    expect(result.score).toBe(0);
  });
});

describe("JWT Utilities", () => {
  it("signs and verifies token", async () => {
    const { signToken, verifyToken } = await import("../utils/jwt");
    const claims = { userId: "test-123", tenantId: "t-123", email: "test@test.com", role: "admin" as const };
    const token = signToken(claims);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(claims.userId);
    expect(decoded.tenantId).toBe(claims.tenantId);
    expect(decoded.email).toBe(claims.email);
    expect(decoded.role).toBe(claims.role);
  });

  it("rejects invalid token", async () => {
    const { verifyToken } = await import("../utils/jwt");
    expect(() => verifyToken("invalid-token")).toThrow();
  });
});

describe("Sanitize Utilities", () => {
  it("strips HTML tags", async () => {
    const { sanitize } = await import("../utils/sanitize");
    // sanitize strips < > but leaves /
    const result = sanitize("<script>alert('xss')</script>");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("trims whitespace", async () => {
    const { sanitize } = await import("../utils/sanitize");
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("generates date from now", async () => {
    const { daysFromNow } = await import("../utils/sanitize");
    const result = daysFromNow(14);
    const expected = new Date();
    expected.setDate(expected.getDate() + 14);
    expect(new Date(result).getTime()).toBeCloseTo(expected.getTime(), -3);
  });

  it("removes password from user object", async () => {
    const { sanitizeUser } = await import("../utils/sanitize");
    const user = { id: "1", name: "Test", email: "test@test.com", password: "secret" };
    const result = sanitizeUser(user);
    expect(result).not.toHaveProperty("password");
    expect(result.id).toBe("1");
  });
});
