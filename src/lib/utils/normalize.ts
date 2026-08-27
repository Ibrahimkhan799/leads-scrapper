import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const LEGAL_SUFFIXES =
  /\b(llc|ltd|inc|incorporated|co|company|corp|corporation|pty|gmbh|sarl|plc|llp|lp|pc|pllc|the)\b/gi;

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeBusinessName(name: string): string {
  return normalizeWhitespace(
    name
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(LEGAL_SUFFIXES, " ")
  );
}

export function normalizeDomain(urlOrDomain: string): string | null {
  const raw = urlOrDomain.trim();
  if (!raw) return null;
  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (!host || host === "localhost") return null;
    return host;
  } catch {
    return null;
  }
}

export function countryNameToIso(country?: string | null): CountryCode | undefined {
  if (!country) return undefined;
  const map: Record<string, CountryCode> = {
    ae: "AE",
    uae: "AE",
    "united arab emirates": "AE",
    sa: "SA",
    "saudi arabia": "SA",
    ksa: "SA",
    qa: "QA",
    qatar: "QA",
    eg: "EG",
    egypt: "EG",
    pk: "PK",
    pakistan: "PK",
    gb: "GB",
    uk: "GB",
    "united kingdom": "GB",
    "great britain": "GB",
    us: "US",
    usa: "US",
    "united states": "US",
    "united states of america": "US",
  };
  return map[country.trim().toLowerCase()];
}

export function normalizePhone(
  raw: string,
  defaultCountry?: string | null
): string | null {
  const input = raw.trim();
  if (!input) return null;
  const country = countryNameToIso(defaultCountry);
  const parsed = parsePhoneNumberFromString(input, country);
  if (parsed?.isValid()) {
    return parsed.format("E.164");
  }
  const digits = input.replace(/[^\d+]/g, "");
  const justDigits = digits.replace(/\D/g, "");
  if (justDigits.length < 7 || justDigits.length > 15) return null;
  if (digits.startsWith("+")) return `+${justDigits}`;
  if (digits.startsWith("00")) return `+${justDigits.slice(2)}`;
  return justDigits;
}

export function normalizeEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  if (value.endsWith(".png") || value.endsWith(".jpg") || value.endsWith(".gif")) {
    return null;
  }
  return value;
}

export function normalizeAddress(address: string): string {
  return normalizeWhitespace(
    address
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\b(street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln)\b/g, " ")
  );
}

export function normalizeHandle(value: string): string {
  return value.replace(/^@/, "").trim().toLowerCase();
}

export function slugify(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}
