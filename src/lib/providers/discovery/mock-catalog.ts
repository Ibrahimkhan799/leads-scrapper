export type MockScenario =
  | "no-website"
  | "poor-website"
  | "excellent-website"
  | "no-email"
  | "no-whatsapp"
  | "no-social"
  | "high-reviews"
  | "low-reviews"
  | "multi-location"
  | "online-booking";

export interface MockCatalogItem {
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
}

const CITIES = [
  { city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708, phone: "+9714", areas: ["Marina", "JLT", "Downtown", "Al Quoz", "Business Bay"] },
  { city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", lat: 24.7136, lng: 46.6753, phone: "+96611", areas: ["Olaya", "Malaz", "Narjis", "Exit 5"] },
  { city: "Doha", country: "Qatar", countryCode: "QA", lat: 25.2854, lng: 51.531, phone: "+97444", areas: ["West Bay", "The Pearl", "Lusail"] },
  { city: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.0444, lng: 31.2357, phone: "+2022", areas: ["Zamalek", "Maadi", "New Cairo"] },
  { city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278, phone: "+4420", areas: ["Shoreditch", "Chelsea", "Soho"] },
  { city: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.006, phone: "+1212", areas: ["SoHo", "Brooklyn", "Midtown"] },
  { city: "Lahore", country: "Pakistan", countryCode: "PK", lat: 31.5204, lng: 74.3587, phone: "+9242", areas: ["Gulberg", "DHA", "Johar Town"] },
] as const;

const TYPES = [
  { type: "Gym", category: "Fitness", names: ["Apex Strength", "Iron Harbor", "Pulse Studio", "Northbound Fitness"] },
  { type: "Restaurant", category: "Food & Dining", names: ["Cedar Room", "Saffron House", "The Lantern", "Harbor Table"] },
  { type: "Dentist", category: "Healthcare", names: ["Brightside Dental", "Pearl Clinic", "Oak & Ivory Dental"] },
  { type: "Salon", category: "Beauty", names: ["Atelier Hair", "Lumen Salon", "Velvet Scissors"] },
  { type: "Hotel", category: "Hospitality", names: ["The Marlowe", "Quiet Harbor Hotel", "Maison North"] },
  { type: "Real Estate Agency", category: "Real Estate", names: ["Keystone Realty", "Atlas Properties", "Harbor Homes"] },
  { type: "Padel Club", category: "Sports", names: ["Baseline Padel", "Court Four", "Rally Club"] },
  { type: "Car Dealership", category: "Automotive", names: ["Northline Motors", "Apex Auto", "Harbor Cars"] },
  { type: "Cafe", category: "Food & Dining", names: ["Copper Kettle", "Dawn Roast", "Little Harbor Cafe"] },
  { type: "Law Firm", category: "Professional Services", names: ["Whitfield & Co", "Harbor Legal", "Northbridge Law"] },
] as const;

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

export const MOCK_CATALOG: MockCatalogItem[] = (() => {
  const items: MockCatalogItem[] = [];
  let n = 0;
  for (const type of TYPES) {
    for (const city of CITIES) {
      const name = type.names[n % type.names.length];
      const area = city.areas[n % city.areas.length];
      const scenario = SCENARIOS[n % SCENARIOS.length];
      items.push({
        name: `${name} ${area}`,
        businessType: type.type,
        category: type.category,
        country: city.country,
        countryCode: city.countryCode,
        city: city.city,
        area,
        address: `${20 + (n % 80)} ${area} Road, ${city.city}`,
        latitude: city.lat + (n % 9) * 0.01,
        longitude: city.lng + (n % 7) * 0.01,
        rating: Number((scenario === "no-website" ? 4.6 : 3.6 + (n % 15) * 0.1).toFixed(1)),
        reviewCount: scenario === "no-website" || scenario === "poor-website"
          ? Math.max([18, 42, 87, 126, 240, 318, 540, 89, 12, 401][n % 10], 260)
          : [18, 42, 87, 126, 240, 318, 540, 89, 12, 401][n % 10],
        googlePlaceId: `mock-place-${n + 1}`,
        scenario,
        phoneBase: `${city.phone}${300000 + n}`,
      });
      n += 1;
    }
  }
  return items;
})();
