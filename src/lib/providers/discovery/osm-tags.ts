export type OsmTagFilter =
  | { key: string; value: string }
  | { key: string; regex: string };

const TYPE_FILTERS: Array<{ match: RegExp; filters: OsmTagFilter[] }> = [
  {
    match: /\bgyms?\b|fitness|health club|personal training/i,
    filters: [
      { key: "leisure", value: "fitness_centre" },
      { key: "leisure", value: "sports_centre" },
      { key: "amenity", value: "gym" },
      { key: "sport", value: "fitness" },
    ],
  },
  {
    match: /\brestaurants?\b|\beatery\b|\bdining\b|\bbistro\b/i,
    filters: [{ key: "amenity", value: "restaurant" }],
  },
  {
    match: /\bcafe?s?\b|coffee/i,
    filters: [
      { key: "amenity", value: "cafe" },
      { key: "amenity", value: "coffee_shop" },
    ],
  },
  {
    match: /\bdentists?\b|dental|orthodont/i,
    filters: [{ key: "amenity", value: "dentist" }],
  },
  {
    match: /\bsalons?\b|hairdresser|beauty salon/i,
    filters: [
      { key: "shop", value: "hairdresser" },
      { key: "shop", value: "beauty" },
    ],
  },
  {
    match: /\bbarbers?\b|barbershop/i,
    filters: [{ key: "shop", value: "hairdresser" }],
  },
  {
    match: /\bhotels?\b|guest house/i,
    filters: [
      { key: "tourism", value: "hotel" },
      { key: "tourism", value: "guest_house" },
    ],
  },
  {
    match: /\breal estate|realtor|property agency/i,
    filters: [
      { key: "office", value: "estate_agent" },
      { key: "office", value: "property" },
    ],
  },
  {
    match: /\bpadel/i,
    filters: [
      { key: "leisure", value: "sports_centre" },
      { key: "sport", value: "padel" },
    ],
  },
  {
    match: /\bcar dealership|auto dealer|car dealer/i,
    filters: [
      { key: "shop", value: "car" },
      { key: "shop", value: "car_repair" },
    ],
  },
  {
    match: /\blaw firm|lawyer|attorney|legal office/i,
    filters: [
      { key: "office", value: "lawyer" },
      { key: "office", value: "attorney" },
    ],
  },
  {
    match: /\bplumber|plumbing/i,
    filters: [{ key: "craft", value: "plumber" }],
  },
  {
    match: /\bspa|wellness/i,
    filters: [
      { key: "leisure", value: "spa" },
      { key: "amenity", value: "spa" },
    ],
  },
  {
    match: /\bclinic|medical|doctor/i,
    filters: [
      { key: "amenity", value: "clinic" },
      { key: "amenity", value: "doctors" },
    ],
  },
  {
    match: /\bschool/i,
    filters: [{ key: "amenity", value: "school" }],
  },
  {
    match: /\bauto repair|car garage|workshop/i,
    filters: [{ key: "shop", value: "car_repair" }],
  },
  {
    match: /\bcleaning/i,
    filters: [{ key: "office", value: "cleaning_agency" }],
  },
  {
    match: /\bconstruction|contractor/i,
    filters: [
      { key: "office", value: "construction_company" },
      { key: "craft", value: "builder" },
    ],
  },
  {
    match: /\bmarketing agency|advertis/i,
    filters: [
      { key: "office", value: "advertising_agency" },
      { key: "office", value: "advertising" },
    ],
  },
];

export function escapeOverpassRegex(value: string): string {
  return value
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, ".*");
}

export function osmFiltersForBusinessType(businessType: string, keywords: string[] = []): OsmTagFilter[] {
  const haystack = [businessType, ...keywords].join(" ");
  const matched = TYPE_FILTERS.filter((item) => item.match.test(haystack)).flatMap((item) => item.filters);
  const unique = new Map<string, OsmTagFilter>();
  for (const filter of matched) {
    const id = "value" in filter ? `${filter.key}=${filter.value}` : `${filter.key}~${filter.regex}`;
    unique.set(id, filter);
  }

  const nameRegex = escapeOverpassRegex(businessType);
  if (nameRegex.length >= 3) {
    unique.set(`name~${nameRegex}`, { key: "name", regex: nameRegex });
  }

  return [...unique.values()];
}

export function buildOverpassQuery(filters: OsmTagFilter[], bbox: [number, number, number, number]): string {
  const [south, west, north, east] = bbox;
  const area = `${south},${west},${north},${east}`;
  const clauses = filters
    .map((filter) => {
      if ("value" in filter) {
        return `  nwr["${filter.key}"="${escapeOverpassString(filter.value)}"](${area});`;
      }
      return `  nwr["${filter.key}"~"${filter.regex}",i](${area});`;
    })
    .join("\n");

  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center tags;`;
}

function escapeOverpassString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export function clampBBox(bbox: BBox, maxSpan = 0.35): BBox {
  const latSpan = bbox.north - bbox.south;
  const lonSpan = bbox.east - bbox.west;
  if (latSpan <= maxSpan && lonSpan <= maxSpan) return bbox;
  const lat = (bbox.north + bbox.south) / 2;
  const lon = (bbox.east + bbox.west) / 2;
  const halfLat = Math.min(maxSpan, latSpan) / 2;
  const halfLon = Math.min(maxSpan, lonSpan) / 2;
  return {
    south: lat - halfLat,
    north: lat + halfLat,
    west: lon - halfLon,
    east: lon + halfLon,
  };
}

export function bboxTuple(bbox: BBox): [number, number, number, number] {
  return [
    Number(bbox.south.toFixed(6)),
    Number(bbox.west.toFixed(6)),
    Number(bbox.north.toFixed(6)),
    Number(bbox.east.toFixed(6)),
  ];
}
