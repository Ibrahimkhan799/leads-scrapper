import type { WebsiteQuality } from "@prisma/client";

export type ScoringField =
  | "hasWebsite"
  | "websiteQuality"
  | "mobileViewport"
  | "loadTimeMs"
  | "hasClearCta"
  | "hasBooking"
  | "hasEmail"
  | "hasWhatsapp"
  | "hasInstagram"
  | "reviewCount"
  | "rating"
  | "hasActiveSocial"
  | "multipleLocations"
  | "brokenPages"
  | "https";

export type ScoringCondition =
  | { type: "equals"; field: ScoringField; value: unknown }
  | { type: "notEquals"; field: ScoringField; value: unknown }
  | { type: "gte"; field: ScoringField; value: number }
  | { type: "lte"; field: ScoringField; value: number }
  | { type: "falsy"; field: ScoringField }
  | { type: "truthy"; field: ScoringField };

export interface ScoringRuleConfig {
  id: string;
  label: string;
  points: number;
  group: string;
  condition: ScoringCondition;
}

export interface ScoringProfile {
  id: string;
  name: string;
  rules: ScoringRuleConfig[];
}

export interface ScoringContext {
  hasWebsite: boolean;
  websiteQuality: WebsiteQuality | "NONE" | "POOR" | "OUTDATED" | "GOOD" | "EXCELLENT" | null;
  mobileViewport: boolean;
  loadTimeMs: number | null;
  hasClearCta: boolean;
  hasBooking: boolean;
  hasEmail: boolean;
  hasWhatsapp: boolean;
  hasInstagram: boolean;
  reviewCount: number;
  rating: number | null;
  hasActiveSocial: boolean;
  multipleLocations: boolean;
  brokenPages: boolean;
  https: boolean;
}

export const DEFAULT_SCORING_PROFILE: ScoringProfile = {
  id: "website-development",
  name: "Website development prospects",
  rules: [
    { id: "no-website", group: "website", label: "No website", points: 45, condition: { type: "equals", field: "hasWebsite", value: false } },
    { id: "poor-website", group: "website", label: "Poor website", points: 15, condition: { type: "equals", field: "websiteQuality", value: "POOR" } },
    { id: "outdated-website", group: "website", label: "Outdated website", points: 10, condition: { type: "equals", field: "websiteQuality", value: "OUTDATED" } },
    { id: "mobile-problems", group: "mobile", label: "Poor mobile experience", points: 10, condition: { type: "equals", field: "mobileViewport", value: false } },
    { id: "slow-website", group: "performance", label: "Slow website", points: 5, condition: { type: "gte", field: "loadTimeMs", value: 3000 } },
    { id: "weak-cta", group: "cta", label: "No clear CTA", points: 5, condition: { type: "equals", field: "hasClearCta", value: false } },
    { id: "no-booking", group: "booking", label: "No online booking", points: 5, condition: { type: "equals", field: "hasBooking", value: false } },
    { id: "no-email", group: "email", label: "No email", points: 2, condition: { type: "equals", field: "hasEmail", value: false } },
    { id: "no-whatsapp", group: "whatsapp", label: "No WhatsApp", points: 2, condition: { type: "equals", field: "hasWhatsapp", value: false } },
    { id: "reviews-500", group: "reviews", label: "500+ reviews", points: 8, condition: { type: "gte", field: "reviewCount", value: 500 } },
    { id: "reviews-250", group: "reviews", label: "250+ reviews", points: 6, condition: { type: "gte", field: "reviewCount", value: 250 } },
    { id: "reviews-100", group: "reviews", label: "100+ reviews", points: 4, condition: { type: "gte", field: "reviewCount", value: 100 } },
    { id: "rating-45", group: "rating", label: "4.5+ rating", points: 5, condition: { type: "gte", field: "rating", value: 4.5 } },
    { id: "active-social", group: "social", label: "Active social media", points: 5, condition: { type: "equals", field: "hasActiveSocial", value: true } },
    { id: "multi-location", group: "locations", label: "Multiple locations", points: 8, condition: { type: "equals", field: "multipleLocations", value: true } },
    { id: "broken-pages", group: "broken", label: "Broken pages", points: 8, condition: { type: "equals", field: "brokenPages", value: true } },
  ],
};

export function matchesCondition(
  condition: ScoringCondition,
  ctx: ScoringContext
): boolean {
  const actual = ctx[condition.field];
  switch (condition.type) {
    case "equals":
      return actual === condition.value;
    case "notEquals":
      return actual !== condition.value;
    case "gte":
      return typeof actual === "number" && actual >= condition.value;
    case "lte":
      return typeof actual === "number" && actual <= condition.value;
    case "truthy":
      return Boolean(actual);
    case "falsy":
      return !actual;
    default:
      return false;
  }
}
