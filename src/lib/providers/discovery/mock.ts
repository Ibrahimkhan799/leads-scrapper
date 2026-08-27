import type { BusinessDiscoveryProvider, BusinessSearchInput, RawBusiness } from "@/lib/providers/types";
import { locationPhrase } from "@/lib/discovery/query-generator";
import { slugify } from "@/lib/utils/normalize";
import { MOCK_CATALOG, type MockScenario } from "@/lib/providers/discovery/mock-catalog";

export class MockDiscoveryProvider implements BusinessDiscoveryProvider {
  id = "mock";

  async search(input: BusinessSearchInput): Promise<RawBusiness[]> {
    const max = Math.min(input.maxResults ?? 50, 500);
    const type = input.businessType.toLowerCase();
    const city = input.city?.toLowerCase();
    const country = input.country?.toLowerCase();
    const location = locationPhrase(input).toLowerCase();

    const filtered = MOCK_CATALOG.filter((item) => {
      const typeMatch =
        item.businessType.toLowerCase().includes(type) ||
        type.includes(item.businessType.toLowerCase()) ||
        item.category.toLowerCase().includes(type) ||
        (input.keywords ?? []).some((kw) =>
          `${item.name} ${item.businessType} ${item.category}`.toLowerCase().includes(kw.toLowerCase())
        );
      const cityMatch = !city || item.city.toLowerCase().includes(city) || city.includes(item.city.toLowerCase());
      const countryMatch =
        !country ||
        item.country.toLowerCase().includes(country) ||
        country.includes(item.country.toLowerCase());
      const areaMatch =
        !input.area ||
        item.area.toLowerCase().includes(input.area.toLowerCase()) ||
        item.address.toLowerCase().includes(input.area.toLowerCase());
      return typeMatch && cityMatch && countryMatch && areaMatch;
    });

    const results: RawBusiness[] = filtered.map((item) => toRaw(item, this.id));

    let i = 0;
    while (results.length < max) {
      const template = MOCK_CATALOG[i % MOCK_CATALOG.length];
      const variation = {
        ...template,
        name: `${input.businessType.replace(/s$/, "")} ${template.city} ${results.length + 1}`,
        businessType: input.businessType,
        city: input.city || template.city,
        country: input.country || template.country,
        area: input.area || template.area,
        googlePlaceId: `mock-${slugify(input.businessType)}-${results.length + 1}-${slugify(location || template.city)}`,
        scenario: SCENARIOS[results.length % SCENARIOS.length],
      };
      results.push(toRaw(variation, this.id));
      i += 1;
      if (i > max + 10) break;
    }

    return results.slice(0, max);
  }
}

const SCENARIOS: MockScenario[] = [
  "no-website",
  "poor-website",
  "excellent-website",
  "no-email",
  "no-whatsapp",
  "no-social",
  "high-reviews",
  "low-reviews",
  "multi-location",
  "online-booking",
];

export function toRaw(
  item: {
    name: string;
    businessType: string;
    category: string;
    country: string;
    countryCode: string;
    city: string;
    area: string;
    address: string;
    latitude: number;
    longitude: number;
    rating: number;
    reviewCount: number;
    googlePlaceId: string;
    scenario: MockScenario;
    phoneBase: string;
  },
  source: string
): RawBusiness {
  const slug = slugify(item.name);
  const domain = `${slug.replace(/-/g, "")}.example`;
  const scenario = item.scenario;
  const hasWebsite = scenario !== "no-website";
  const poor = scenario === "poor-website";
  const excellent = scenario === "excellent-website";

  return {
    name: item.name,
    businessType: item.businessType,
    category: item.category,
    country: item.country,
    countryCode: item.countryCode,
    city: item.city,
    area: item.area,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
    phone: item.phoneBase,
    email: scenario === "no-email" ? undefined : `info@${domain}`,
    whatsapp: scenario === "no-whatsapp" ? undefined : item.phoneBase,
    website: hasWebsite ? `https://${poor ? "http-legacy." : ""}${domain}` : undefined,
    googleMapsUrl: `https://maps.google.com/?cid=${item.googlePlaceId}`,
    googlePlaceId: item.googlePlaceId,
    instagram: scenario === "no-social" ? undefined : `https://instagram.com/${slug}`,
    facebook: scenario === "no-social" ? undefined : `https://facebook.com/${slug}`,
    rating: item.rating,
    reviewCount: scenario === "high-reviews" ? Math.max(item.reviewCount, 520) : scenario === "low-reviews" ? 12 : item.reviewCount,
    bookingUrl: scenario === "online-booking" || excellent ? `https://${domain}/book` : undefined,
    bookingProvider: scenario === "online-booking" || excellent ? "custom" : undefined,
    source,
    sourceId: item.googlePlaceId,
    raw: { scenario, multiLocation: scenario === "multi-location" },
  };
}
