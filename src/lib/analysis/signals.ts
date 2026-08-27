export interface DetectedSignal {
  key: string;
  value: unknown;
}

const GENERIC_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: "hasMemberships", pattern: /\bmemberships?\b/i },
  { key: "hasPersonalTraining", pattern: /\bpersonal training\b/i },
  { key: "hasClasses", pattern: /\b(classes|timetable|group training)\b/i },
  { key: "hasMenu", pattern: /\b(menu|prix fixe)\b/i },
  { key: "hasReservations", pattern: /\b(reservations?|book a table)\b/i },
  { key: "hasDelivery", pattern: /\b(delivery|order online|uber eats|deliveroo)\b/i },
  { key: "hasAppointments", pattern: /\b(appointments?|book a visit)\b/i },
  { key: "hasDoctors", pattern: /\b(doctors?|dentists?|clinicians?|our team)\b/i },
  { key: "hasListings", pattern: /\b(listings?|properties|for sale|for rent)\b/i },
  { key: "hasAgents", pattern: /\b(agents?|brokers?)\b/i },
  { key: "hasPropertySearch", pattern: /\b(property search|find a home)\b/i },
  { key: "hasPricing", pattern: /\b(pricing|price list|packages?)\b/i },
  { key: "hasOnlineBooking", pattern: /\b(book now|book online|schedule)\b/i },
];

export function detectSignals(html: string): DetectedSignal[] {
  return GENERIC_PATTERNS.filter((item) => item.pattern.test(html)).map((item) => ({
    key: item.key,
    value: true,
  }));
}
