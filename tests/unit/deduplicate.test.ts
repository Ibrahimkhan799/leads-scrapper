import { describe, expect, it } from "vitest";
import { normalizeRawBusiness } from "@/lib/discovery/normalize";
import { deduplicateBusinesses } from "@/lib/discovery/deduplicate";

function biz(overrides: Record<string, unknown>) {
  return normalizeRawBusiness({
    name: "Fitness First Dubai Marina",
    city: "Dubai",
    country: "United Arab Emirates",
    source: "mock",
    ...overrides,
  });
}

describe("deduplication", () => {
  it("merges exact google place ids", () => {
    const result = deduplicateBusinesses([
      biz({ googlePlaceId: "abc" }),
      biz({ name: "Fitness First - Dubai Marina", googlePlaceId: "abc" }),
    ]);
    expect(result.unique).toHaveLength(1);
  });

  it("merges matching phones", () => {
    const result = deduplicateBusinesses([
      biz({ phone: "+971501112233" }),
      biz({ name: "Fitness First Dubai Marina Gym", phone: "+971 50 111 2233" }),
    ]);
    expect(result.unique).toHaveLength(1);
  });

  it("does not merge different branches far apart", () => {
    const result = deduplicateBusinesses([
      biz({ area: "Marina", latitude: 25.08, longitude: 55.14, googlePlaceId: "a" }),
      biz({
        name: "Fitness First JLT",
        area: "JLT",
        latitude: 25.21,
        longitude: 55.28,
        googlePlaceId: "b",
      }),
    ]);
    expect(result.unique).toHaveLength(2);
  });
});
