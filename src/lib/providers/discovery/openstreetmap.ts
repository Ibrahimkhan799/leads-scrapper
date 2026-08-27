import type { BusinessDiscoveryProvider, BusinessSearchInput, RawBusiness } from "@/lib/providers/types";
import { locationPhrase } from "@/lib/discovery/query-generator";
import {
  bboxTuple,
  buildOverpassQuery,
  clampBBox,
  osmFiltersForBusinessType,
  type BBox,
} from "@/lib/providers/discovery/osm-tags";

const USER_AGENT = "LeadIntel/1.0 (local business research; https://github.com/Ibrahimkhan799/leads-scrapper)";
const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";
const OVERPASS_URLS = [
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

interface NominatimHit {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  osm_type?: string;
  osm_id?: number;
  boundingbox?: string[];
  extratags?: Record<string, string>;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
    suburb?: string;
    neighbourhood?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
  };
}

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export class OpenStreetMapDiscoveryProvider implements BusinessDiscoveryProvider {
  id = "openstreetmap";

  async search(input: BusinessSearchInput): Promise<RawBusiness[]> {
    const location = await geocodeLocation(input);
    const filters = osmFiltersForBusinessType(input.businessType, input.keywords);
    const query = buildOverpassQuery(filters, bboxTuple(location.bbox));
    let elements: OsmElement[] = [];
    try {
      elements = await overpass(query);
    } catch {
      elements = [];
    }

    const max = Math.min(input.maxResults ?? 50, 500);
    const seen = new Set<string>();
    const results: RawBusiness[] = [];

    for (const element of elements) {
      const mapped = mapOsmElement(element, input, location);
      if (!mapped) continue;
      const key = mapped.sourceId || mapped.name;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(mapped);
      if (results.length >= max) break;
    }

    if (results.length < Math.min(8, max)) {
      const extra = await nominatimPoiSearch(input, location, max);
      for (const item of extra) {
        const key = item.sourceId || item.name;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(item);
        if (results.length >= max) break;
      }
    }

    return results;
  }
}

export async function geocodeLocation(input: BusinessSearchInput): Promise<{
  bbox: BBox;
  city?: string;
  country?: string;
  countryCode?: string;
  displayName?: string;
}> {
  const query = locationPhrase(input) || input.city || input.country;
  if (!query) {
    throw new Error("Enter a city or area so OpenStreetMap can search nearby businesses.");
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`OpenStreetMap geocoding failed (${response.status})`);
  }

  const hits = (await response.json()) as NominatimHit[];
  const hit = hits[0];
  if (!hit?.boundingbox || hit.boundingbox.length < 4) {
    throw new Error(`No OpenStreetMap location found for “${query}”. Try a more specific city.`);
  }

  const south = Number(hit.boundingbox[0]);
  const north = Number(hit.boundingbox[1]);
  const west = Number(hit.boundingbox[2]);
  const east = Number(hit.boundingbox[3]);
  const bbox = clampBBox({ south, north, west, east }, input.area ? 0.08 : input.city ? 0.28 : 0.35);

  return {
    bbox,
    displayName: hit.display_name,
    city: hit.address?.city || hit.address?.town || hit.address?.village || input.city,
    country: hit.address?.country || input.country,
    countryCode: hit.address?.country_code?.toUpperCase() || input.countryCode,
  };
}

async function overpass(query: string): Promise<OsmElement[]> {
  let lastError: Error | null = null;
  for (const endpoint of OVERPASS_URLS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        lastError = new Error(`Overpass busy (${response.status})`);
        continue;
      }
      const data = (await response.json()) as { elements?: OsmElement[] };
      return data.elements ?? [];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Overpass request failed");
    }
  }
  throw lastError ?? new Error("OpenStreetMap Overpass request failed");
}

async function nominatimPoiSearch(
  input: BusinessSearchInput,
  location: { bbox: BBox; city?: string; country?: string; countryCode?: string },
  limit: number
): Promise<RawBusiness[]> {
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", `${input.businessType} ${locationPhrase(input)}`.trim());
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", String(Math.min(limit, 50)));
  url.searchParams.set("bounded", "1");
  url.searchParams.set(
    "viewbox",
    `${location.bbox.west},${location.bbox.north},${location.bbox.east},${location.bbox.south}`
  );

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) return [];
  const hits = (await response.json()) as NominatimHit[];
  return hits
    .map((hit) => mapNominatimHit(hit, input, location))
    .filter((item): item is RawBusiness => Boolean(item));
}

function mapNominatimHit(
  hit: NominatimHit,
  input: BusinessSearchInput,
  location: { city?: string; country?: string; countryCode?: string }
): RawBusiness | null {
  const name = hit.name || hit.display_name?.split(",")[0];
  if (!name) return null;
  const osmType = hit.osm_type === "node" ? "node" : hit.osm_type === "relation" ? "relation" : "way";
  const tags = hit.extratags ?? {};
  const websiteRaw = tags.website || tags.url;
  const { website, socialWebsite } = classifyWebsite(websiteRaw);
  const address = [hit.address?.house_number, hit.address?.road].filter(Boolean).join(" ");
  return {
    name,
    businessType: input.businessType,
    category: input.businessType,
    country: hit.address?.country || location.country || input.country,
    countryCode: hit.address?.country_code?.toUpperCase() || location.countryCode,
    state: hit.address?.state || input.state,
    city: hit.address?.city || hit.address?.town || location.city || input.city,
    area: hit.address?.suburb || hit.address?.neighbourhood || input.area,
    address: address || undefined,
    postalCode: hit.address?.postcode,
    latitude: hit.lat ? Number(hit.lat) : undefined,
    longitude: hit.lon ? Number(hit.lon) : undefined,
    phone: tags.phone,
    email: tags.email,
    website,
    instagram: tags.instagram || (socialWebsite?.includes("instagram") ? socialWebsite : undefined),
    facebook: tags.facebook || (socialWebsite?.includes("facebook") ? socialWebsite : undefined),
    openingHours: tags.opening_hours ? { osm: tags.opening_hours } : undefined,
    source: "openstreetmap",
    sourceId: hit.osm_id ? `${osmType}/${hit.osm_id}` : undefined,
    sourceUrl: hit.osm_id ? `https://www.openstreetmap.org/${osmType}/${hit.osm_id}` : undefined,
    raw: hit,
  };
}

export function mapOsmElement(
  element: OsmElement,
  input: BusinessSearchInput,
  location: { city?: string; country?: string; countryCode?: string }
): RawBusiness | null {
  const tags = element.tags ?? {};
  const name = tags.name || tags["name:en"] || tags.brand;
  if (!name) return null;

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const phone = tags.phone || tags["contact:phone"] || tags["phone:mobile"];
  const email = tags.email || tags["contact:email"];
  const whatsapp = tags["contact:whatsapp"] || tags.whatsapp;
  const websiteRaw = tags.website || tags["contact:website"] || tags.url;
  const facebook = tags["contact:facebook"] || tags.facebook;
  const instagram = tags["contact:instagram"] || tags.instagram;
  const { website, socialWebsite } = classifyWebsite(websiteRaw);

  const housenumber = tags["addr:housenumber"];
  const street = tags["addr:street"];
  const address = [housenumber, street, tags["addr:suburb"] || tags["addr:neighbourhood"]]
    .filter(Boolean)
    .join(" ");

  const category =
    tags.amenity || tags.shop || tags.office || tags.tourism || tags.leisure || tags.craft || input.businessType;
  const sourceId = `${element.type}/${element.id}`;

  return {
    name,
    businessType: input.businessType,
    category,
    subcategory: tags.shop || tags.amenity,
    country: tags["addr:country"] || location.country || input.country,
    countryCode: location.countryCode || input.countryCode,
    state: tags["addr:state"] || input.state,
    city: tags["addr:city"] || location.city || input.city,
    area: tags["addr:suburb"] || tags["addr:neighbourhood"] || input.area,
    address: address || undefined,
    postalCode: tags["addr:postcode"] || input.postalCode,
    latitude: lat,
    longitude: lon,
    phone,
    email,
    whatsapp,
    website,
    instagram: instagram || (socialWebsite?.includes("instagram") ? socialWebsite : undefined),
    facebook: facebook || (socialWebsite?.includes("facebook") ? socialWebsite : undefined),
    openingHours: tags.opening_hours ? { osm: tags.opening_hours } : undefined,
    source: "openstreetmap",
    sourceId,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    raw: { type: element.type, id: element.id, tags },
  };
}

function classifyWebsite(url?: string): { website?: string; socialWebsite?: string } {
  if (!url) return {};
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  if (/instagram\.com|facebook\.com|fb\.com|tiktok\.com/i.test(normalized)) {
    return { socialWebsite: normalized };
  }
  return { website: normalized };
}
