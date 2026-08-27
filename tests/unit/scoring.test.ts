import { describe, expect, it } from "vitest";
import { calculateLeadScore } from "@/lib/scoring/calculate";
import type { ScoringContext } from "@/lib/scoring/rules";

const base: ScoringContext = {
  hasWebsite: true,
  websiteQuality: "GOOD",
  mobileViewport: true,
  loadTimeMs: 800,
  hasClearCta: true,
  hasBooking: true,
  hasEmail: true,
  hasWhatsapp: true,
  hasInstagram: true,
  reviewCount: 20,
  rating: 4.1,
  hasActiveSocial: false,
  multipleLocations: false,
  brokenPages: false,
  https: true,
};

describe("lead scoring", () => {
  it("scores no-website prospects highly", () => {
    const result = calculateLeadScore({
      ...base,
      hasWebsite: false,
      websiteQuality: "NONE",
      reviewCount: 540,
      rating: 4.7,
      hasActiveSocial: true,
      multipleLocations: true,
      mobileViewport: false,
      hasClearCta: false,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.category).toBe("HOT");
    expect(result.reasons.some((reason) => reason.label === "No website")).toBe(true);
  });

  it("does not stack overlapping review rules", () => {
    const result = calculateLeadScore({ ...base, hasWebsite: false, websiteQuality: "NONE", reviewCount: 800 });
    const reviewRules = result.reasons.filter((reason) => reason.label.includes("reviews"));
    expect(reviewRules).toHaveLength(1);
    expect(reviewRules[0]?.points).toBe(8);
  });

  it("caps scores at 100", () => {
    const result = calculateLeadScore({
      ...base,
      hasWebsite: false,
      websiteQuality: "NONE",
      mobileViewport: false,
      loadTimeMs: 9000,
      hasClearCta: false,
      hasBooking: false,
      hasEmail: false,
      hasWhatsapp: false,
      reviewCount: 900,
      rating: 5,
      hasActiveSocial: true,
      multipleLocations: true,
      brokenPages: true,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
