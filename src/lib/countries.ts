export const COUNTRIES = [
  { name: "United Arab Emirates", code: "AE" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Qatar", code: "QA" },
  { name: "Egypt", code: "EG" },
  { name: "Pakistan", code: "PK" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "Bahrain", code: "BH" },
  { name: "Kuwait", code: "KW" },
  { name: "Oman", code: "OM" },
  { name: "Jordan", code: "JO" },
  { name: "Lebanon", code: "LB" },
  { name: "Turkey", code: "TR" },
  { name: "India", code: "IN" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "Spain", code: "ES" },
  { name: "Italy", code: "IT" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
] as const;

export const SUGGESTED_CITIES: Record<string, string[]> = {
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  SA: ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca"],
  QA: ["Doha", "Lusail", "Al Wakrah"],
  EG: ["Cairo", "Alexandria", "Giza"],
  PK: ["Lahore", "Karachi", "Islamabad"],
  GB: ["London", "Manchester", "Birmingham"],
  US: ["New York", "Los Angeles", "Miami", "Chicago"],
};

export const SEARCH_TEMPLATES = [
  {
    name: "High-value gyms without websites",
    description: "Fitness businesses with strong reviews and no website",
    config: {
      businessType: "Gym",
      city: "Dubai",
      country: "United Arab Emirates",
      keywords: ["fitness", "personal training"],
      maxLeads: 80,
      filters: { hasWebsite: false, minReviews: 100, minRating: 4.3 },
    },
  },
  {
    name: "Restaurants without websites",
    description: "Dining venues missing an owned web presence",
    config: {
      businessType: "Restaurant",
      city: "Riyadh",
      country: "Saudi Arabia",
      keywords: ["fine dining"],
      maxLeads: 80,
      filters: { hasWebsite: false, minReviews: 50 },
    },
  },
  {
    name: "Dentists with poor websites",
    description: "Clinics with review volume and weak sites",
    config: {
      businessType: "Dentist",
      city: "Doha",
      country: "Qatar",
      maxLeads: 60,
      filters: { websiteQuality: "POOR", minRating: 4.0 },
    },
  },
  {
    name: "Hotels with no booking website",
    description: "Hospitality businesses without direct booking",
    config: {
      businessType: "Hotel",
      city: "Cairo",
      country: "Egypt",
      maxLeads: 60,
      filters: { hasBooking: false, minReviews: 80 },
    },
  },
];
