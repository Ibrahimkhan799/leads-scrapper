import { describe, expect, it } from "vitest";
import {
  bboxTuple,
  buildOverpassQuery,
  clampBBox,
  osmFiltersForBusinessType,
} from "@/lib/providers/discovery/osm-tags";
import { mapOsmElement } from "@/lib/providers/discovery/openstreetmap";
import { unwrapDuckDuckGoUrl, parseDuckDuckGoHtml } from "@/lib/providers/search/duckduckgo";

describe("OpenStreetMap tag mapping", () => {
  it("maps gyms to fitness tags plus a name fallback", () => {
    const filters = osmFiltersForBusinessType("Gym");
    expect(filters.some((item) => "value" in item && item.value === "fitness_centre")).toBe(true);
    expect(filters.some((item) => item.key === "name")).toBe(true);
  });

  it("maps an unlisted category using a name regex only", () => {
    const filters = osmFiltersForBusinessType("pet boarding");
    expect(filters.some((item) => item.key === "name" && "regex" in item && item.regex.includes("pet"))).toBe(true);
  });

  it("clamps huge country bounding boxes", () => {
    const clamped = clampBBox({ south: 22, north: 26.5, west: 51, east: 56.5 }, 0.35);
    expect(clamped.north - clamped.south).toBeLessThanOrEqual(0.35 + 1e-9);
    expect(clamped.east - clamped.west).toBeLessThanOrEqual(0.35 + 1e-9);
  });

  it("builds a bounded Overpass query", () => {
    const query = buildOverpassQuery(
      osmFiltersForBusinessType("dentist"),
      bboxTuple({ south: 25.2, west: 51.5, north: 25.4, east: 51.6 })
    );
    expect(query).toContain('nwr["amenity"="dentist"]');
    expect(query).toContain("out center tags");
  });
});

describe("OSM element mapping", () => {
  it("extracts public contact fields and skips unnamed POIs", () => {
    expect(
      mapOsmElement({ type: "node", id: 1, tags: { amenity: "cafe" } }, { businessType: "Cafe" }, {})
    ).toBeNull();

    const mapped = mapOsmElement(
      {
        type: "node",
        id: 42,
        lat: 25.2,
        lon: 55.27,
        tags: {
          name: "Harbor Cafe",
          amenity: "cafe",
          phone: "+97145000000",
          website: "https://harbor.cafe",
          "addr:city": "Dubai",
        },
      },
      { businessType: "Cafe" },
      { country: "United Arab Emirates" }
    );
    expect(mapped?.name).toBe("Harbor Cafe");
    expect(mapped?.source).toBe("openstreetmap");
    expect(mapped?.sourceId).toBe("node/42");
    expect(mapped?.website).toBe("https://harbor.cafe");
    expect(mapped?.phone).toBe("+97145000000");
  });
});

describe("DuckDuckGo URL unwrapping", () => {
  it("unwraps uddg redirect links", () => {
    expect(
      unwrapDuckDuckGoUrl("https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fabout")
    ).toBe("https://example.com/about");
  });

  it("parses result anchors", () => {
    const html = `<a class="result__a" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fcafe.example">Harbor Cafe</a>`;
    expect(parseDuckDuckGoHtml(html)[0]?.url).toBe("https://cafe.example");
  });
});
