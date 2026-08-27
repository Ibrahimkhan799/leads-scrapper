import { normalizePhone } from "@/lib/utils/normalize";

const PHONE_PATTERNS = [
  /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g,
  /\b0\d{2,4}[\s.-]?\d{3}[\s.-]?\d{3,4}\b/g,
  /\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}/g,
];

export function extractPhones(html: string, defaultCountry?: string | null): string[] {
  const found = new Set<string>();

  const telLinks = html.matchAll(/tel:([^"'\s>]+)/gi);
  for (const match of telLinks) {
    const normalized = normalizePhone(decodeURIComponent(match[1] ?? ""), defaultCountry);
    if (normalized) found.add(normalized);
  }

  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  for (const pattern of PHONE_PATTERNS) {
    const matches = stripped.match(pattern) ?? [];
    for (const match of matches) {
      const normalized = normalizePhone(match, defaultCountry);
      if (normalized) found.add(normalized);
    }
  }

  return [...found];
}
