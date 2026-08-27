import type { BusinessSearchInput } from "@/lib/providers/types";

const SYNONYMS: Record<string, string[]> = {
  gym: ["fitness center", "fitness club", "fitness studio", "personal training gym", "health club"],
  gyms: ["fitness center", "fitness club", "fitness studio", "personal training gym"],
  restaurant: ["dining", "eatery", "bistro"],
  restaurants: ["dining", "eatery"],
  dentist: ["dental clinic", "dental practice", "orthodontist"],
  dentists: ["dental clinic", "dental practice"],
  salon: ["hair salon", "beauty salon"],
  salons: ["hair salon", "beauty salon"],
  barber: ["barbershop", "barber shop"],
  hotel: ["boutique hotel", "guest house"],
  hotels: ["boutique hotel"],
  cafe: ["coffee shop", "coffeehouse"],
  cafes: ["coffee shop"],
  plumber: ["plumbing company", "emergency plumber"],
  spa: ["day spa", "wellness spa"],
  "real estate": ["real estate agency", "property agency", "realtor"],
  "car dealership": ["auto dealer", "car dealer"],
  "law firm": ["lawyer", "attorney", "legal office"],
  "padel club": ["padel court", "padel"],
  "auto repair": ["car garage", "auto workshop"],
  "cleaning company": ["cleaning service", "janitorial"],
};

export interface QueryGeneratorOptions {
  maxQueries?: number;
  includeNear?: boolean;
  extraSynonyms?: Record<string, string[]>;
}

export function generateSearchQueries(
  input: BusinessSearchInput,
  options: QueryGeneratorOptions = {}
): string[] {
  const maxQueries = options.maxQueries ?? 8;
  const location = locationPhrase(input);
  const type = input.businessType.trim();
  const typeKey = type.toLowerCase();
  const synonyms = [
    ...(SYNONYMS[typeKey] ?? []),
    ...((options.extraSynonyms?.[typeKey] ?? []) as string[]),
  ].slice(0, 3);

  const queries = new Set<string>();
  if (location) {
    queries.add(`${type} ${location}`);
    if (options.includeNear !== false) queries.add(`${type} near ${location}`);
    for (const synonym of synonyms) {
      queries.add(`${synonym} ${location}`);
    }
    for (const keyword of (input.keywords ?? []).slice(0, 3)) {
      const trimmed = keyword.trim();
      if (trimmed && !typeKey.includes(trimmed.toLowerCase())) {
        queries.add(`${trimmed} ${location}`);
      }
    }
  } else {
    queries.add(type);
    for (const synonym of synonyms) queries.add(synonym);
  }

  return [...queries].filter(Boolean).slice(0, maxQueries);
}

export function locationPhrase(input: Pick<BusinessSearchInput, "area" | "city" | "state" | "country">): string {
  return [input.area, input.city, input.state, input.country].filter(Boolean).join(", ");
}
