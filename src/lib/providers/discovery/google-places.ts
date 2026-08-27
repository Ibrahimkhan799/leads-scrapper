import type { BusinessDiscoveryProvider, BusinessSearchInput, RawBusiness } from "@/lib/providers/types";
import { generateSearchQueries } from "@/lib/discovery/query-generator";
import { isTruthy } from "@/lib/env";

export class GooglePlacesDiscoveryProvider implements BusinessDiscoveryProvider {
  id = "google-places";

  constructor(private readonly apiKey = process.env.GOOGLE_PLACES_API_KEY ?? "") {}

  enabled(): boolean {
    return Boolean(this.apiKey) && !isTruthy(process.env.USE_MOCK_PROVIDERS);
  }

  async search(input: BusinessSearchInput): Promise<RawBusiness[]> {
    if (!this.apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY is not configured");
    }

    const queries = generateSearchQueries(input, { maxQueries: 5 });
    const max = input.maxResults ?? 50;
    const seen = new Set<string>();
    const results: RawBusiness[] = [];

    for (const query of queries) {
      if (results.length >= max) break;
      const page = await this.textSearch(query, max - results.length);
      for (const item of page) {
        const key = item.googlePlaceId || `${item.name}-${item.address}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          ...item,
          businessType: item.businessType || input.businessType,
          country: item.country || input.country,
          city: item.city || input.city,
          state: item.state || input.state,
        });
      }
    }

    return results.slice(0, max);
  }

  private async textSearch(query: string, limit: number): Promise<RawBusiness[]> {
    const results: RawBusiness[] = [];
    let pageToken: string | undefined;

    for (let page = 0; page < 3 && results.length < limit; page++) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", query);
      url.searchParams.set("key", this.apiKey);
      if (pageToken) url.searchParams.set("pagetoken", pageToken);

      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) {
        throw new Error(`Google Places request failed (${response.status})`);
      }
      const data = (await response.json()) as {
        status: string;
        results?: Array<{
          place_id: string;
          name: string;
          formatted_address?: string;
          rating?: number;
          user_ratings_total?: number;
          geometry?: { location?: { lat: number; lng: number } };
          types?: string[];
          business_status?: string;
        }>;
        next_page_token?: string;
        error_message?: string;
      };

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(data.error_message || `Google Places status ${data.status}`);
      }

      for (const place of data.results ?? []) {
        results.push({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          reviewCount: place.user_ratings_total,
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng,
          googlePlaceId: place.place_id,
          googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          category: place.types?.[0],
          source: this.id,
          sourceId: place.place_id,
          raw: place,
        });
      }

      pageToken = data.next_page_token;
      if (!pageToken) break;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return results;
  }
}
