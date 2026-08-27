import { describe, expect, it } from "vitest";
import { generateSearchQueries } from "@/lib/discovery/query-generator";

describe("query expansion", () => {
  it("creates a bounded set of gym queries", () => {
    const queries = generateSearchQueries({
      businessType: "Gym",
      city: "Dubai",
      country: "United Arab Emirates",
      keywords: ["fitness", "personal training", "fitness club"],
    });
    expect(queries.length).toBeGreaterThan(3);
    expect(queries.length).toBeLessThanOrEqual(8);
    expect(queries.some((query) => query.toLowerCase().includes("gym dubai"))).toBe(true);
  });
});
