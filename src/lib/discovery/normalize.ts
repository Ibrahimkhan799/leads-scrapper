import type { RawBusiness } from "@/lib/providers/types";
import {
  normalizeBusinessName,
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
} from "@/lib/utils/normalize";

export interface NormalizedBusiness extends RawBusiness {
  normalizedName: string;
  websiteDomain?: string | null;
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
}

export function normalizeRawBusiness(raw: RawBusiness): NormalizedBusiness {
  const websiteDomain = raw.website ? normalizeDomain(raw.website) : null;
  return {
    ...raw,
    name: raw.name.trim(),
    normalizedName: normalizeBusinessName(raw.name),
    websiteDomain,
    normalizedPhone: raw.phone ? normalizePhone(raw.phone, raw.country) : null,
    normalizedEmail: raw.email ? normalizeEmail(raw.email) : null,
    businessType: raw.businessType?.trim() || undefined,
    city: raw.city?.trim() || undefined,
    country: raw.country?.trim() || undefined,
  };
}
