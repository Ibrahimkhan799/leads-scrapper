import { describe, expect, it } from "vitest";
import {
  normalizeBusinessName,
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
} from "@/lib/utils/normalize";

describe("business normalization", () => {
  it("normalizes names and legal suffixes", () => {
    expect(normalizeBusinessName("Fitness First - Dubai Marina LLC")).toBe("fitness first dubai marina");
    expect(normalizeBusinessName("The Harbor Gym, Inc.")).toBe("harbor gym");
  });

  it("normalizes domains", () => {
    expect(normalizeDomain("https://www.Example.com/about")).toBe("example.com");
    expect(normalizeDomain("example.com")).toBe("example.com");
    expect(normalizeDomain("not a domain")).toBeNull();
  });

  it("normalizes emails", () => {
    expect(normalizeEmail(" Info@Gym.COM ")).toBe("info@gym.com");
    expect(normalizeEmail("logo.png")).toBeNull();
  });
});

describe("phone normalization", () => {
  it("formats UAE numbers to E.164", () => {
    expect(normalizePhone("04 3001234", "United Arab Emirates")).toMatch(/^\+/);
    expect(normalizePhone("+971 50 123 4567")).toBe("+971501234567");
  });

  it("rejects too-short values", () => {
    expect(normalizePhone("123")).toBeNull();
  });
});
