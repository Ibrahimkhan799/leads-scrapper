import { describe, expect, it } from "vitest";
import { escapeCsvValue, leadsToCsv } from "@/lib/export/csv";

describe("csv export", () => {
  it("escapes quotes commas and newlines", () => {
    expect(escapeCsvValue('Gym "A", Dubai')).toBe('"Gym ""A"", Dubai"');
    expect(escapeCsvValue("line\nbreak")).toBe('"line\nbreak"');
  });

  it("includes a header row", () => {
    const csv = leadsToCsv([
      {
        name: 'Harbor Gym',
        businessType: "Gym",
        city: "Dubai",
        leadScore: 91,
        leadCategory: "HOT",
      },
    ]);
    expect(csv.startsWith("Business Name,")).toBe(true);
    expect(csv).toContain("Harbor Gym");
  });
});
