export const CSV_FIELDS = [
  "Business Name",
  "Business Type",
  "Country",
  "State",
  "City",
  "Address",
  "Phone",
  "Email",
  "WhatsApp",
  "Website",
  "Google Maps URL",
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "Rating",
  "Reviews",
  "Booking URL",
  "Lead Score",
  "Lead Category",
  "Website Quality",
  "Contact Status",
] as const;

export type CsvLead = {
  name: string;
  businessType: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  websiteUrl?: string | null;
  googleMapsUrl?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  bookingUrl?: string | null;
  leadScore?: number | null;
  leadCategory?: string | null;
  websiteQuality?: string | null;
  contactStatus?: string | null;
};

export function escapeCsvValue(value: unknown): string {
  if (value == null) return "";
  const string = String(value);
  if (/[",\n\r]/.test(string)) {
    return `"${string.replace(/"/g, '""')}"`;
  }
  return string;
}

export function leadsToCsv(leads: CsvLead[]): string {
  const rows = [
    CSV_FIELDS.join(","),
    ...leads.map((lead) =>
      [
        lead.name,
        lead.businessType,
        lead.country,
        lead.state,
        lead.city,
        lead.address,
        lead.phone,
        lead.email,
        lead.whatsapp,
        lead.websiteUrl,
        lead.googleMapsUrl,
        lead.instagram,
        lead.facebook,
        lead.tiktok,
        lead.linkedin,
        lead.rating,
        lead.reviewCount,
        lead.bookingUrl,
        lead.leadScore,
        lead.leadCategory,
        lead.websiteQuality,
        lead.contactStatus,
      ]
        .map(escapeCsvValue)
        .join(",")
    ),
  ];
  return rows.join("\r\n");
}
