import type { NormalizedBusiness } from "@/lib/discovery/normalize";
import { haversineMeters, nameSimilarity } from "@/lib/utils/similarity";
import { normalizeAddress } from "@/lib/utils/normalize";

export interface DuplicateMatch {
  index: number;
  confidence: number;
  reasons: string[];
  uncertain: boolean;
}

export interface DedupResult {
  unique: NormalizedBusiness[];
  duplicates: Array<{
    business: NormalizedBusiness;
    matchedName: string;
    confidence: number;
    uncertain: boolean;
    reasons: string[];
  }>;
}

const STRONG = 0.92;
const MEDIUM = 0.78;
const UNCERTAIN = 0.68;

export function findDuplicateIndex(
  candidate: NormalizedBusiness,
  existing: NormalizedBusiness[]
): DuplicateMatch | null {
  let best: DuplicateMatch | null = null;

  existing.forEach((other, index) => {
    const match = scorePair(candidate, other);
    if (!match) return;
    if (!best || match.confidence > best.confidence) {
      best = { ...match, index };
    }
  });

  return best;
}

export function deduplicateBusinesses(businesses: NormalizedBusiness[]): DedupResult {
  const unique: NormalizedBusiness[] = [];
  const duplicates: DedupResult["duplicates"] = [];

  for (const business of businesses) {
    const match = findDuplicateIndex(business, unique);
    if (!match) {
      unique.push(business);
      continue;
    }
    if (match.uncertain) {
      unique.push({ ...business });
      duplicates.push({
        business,
        matchedName: unique[match.index]?.name ?? "",
        confidence: match.confidence,
        uncertain: true,
        reasons: match.reasons,
      });
      continue;
    }
    unique[match.index] = mergeBusiness(unique[match.index], business);
    duplicates.push({
      business,
      matchedName: unique[match.index].name,
      confidence: match.confidence,
      uncertain: false,
      reasons: match.reasons,
    });
  }

  return { unique, duplicates };
}

function scorePair(
  a: NormalizedBusiness,
  b: NormalizedBusiness
): Omit<DuplicateMatch, "index"> | null {
  const reasons: string[] = [];
  let confidence = 0;

  if (a.googlePlaceId && b.googlePlaceId && a.googlePlaceId === b.googlePlaceId) {
    return { confidence: 1, reasons: ["googlePlaceId"], uncertain: false };
  }
  if (a.normalizedPhone && b.normalizedPhone && a.normalizedPhone === b.normalizedPhone) {
    reasons.push("phone");
    confidence = Math.max(confidence, 0.96);
  }
  if (a.websiteDomain && b.websiteDomain && a.websiteDomain === b.websiteDomain) {
    reasons.push("website-domain");
    confidence = Math.max(confidence, 0.94);
  }
  if (a.instagram && b.instagram && normalizeSocial(a.instagram) === normalizeSocial(b.instagram)) {
    reasons.push("instagram");
    confidence = Math.max(confidence, 0.9);
  }

  const namesSimilar = nameSimilarity(a.normalizedName, b.normalizedName);
  const sameCity =
    Boolean(a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase());
  const addressSimilar =
    a.address && b.address
      ? nameSimilarity(normalizeAddress(a.address), normalizeAddress(b.address))
      : 0;

  let distance: number | null = null;
  if (
    a.latitude != null &&
    a.longitude != null &&
    b.latitude != null &&
    b.longitude != null
  ) {
    distance = haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
  }

  if (namesSimilar >= 0.86 && sameCity && addressSimilar >= 0.8) {
    reasons.push("name+address");
    confidence = Math.max(confidence, 0.9);
  } else if (namesSimilar >= 0.9 && sameCity && distance != null && distance < 80) {
    reasons.push("name+coordinates");
    confidence = Math.max(confidence, 0.88);
  } else if (namesSimilar >= 0.92 && sameCity && distance == null && !a.address && !b.address) {
    reasons.push("fuzzy-name");
    confidence = Math.max(confidence, 0.74);
  }

  // Distinct branches: same brand, different area / far apart.
  if (namesSimilar >= 0.8 && distance != null && distance > 400) {
    return null;
  }
  if (namesSimilar >= 0.8 && a.area && b.area && a.area.toLowerCase() !== b.area.toLowerCase()) {
    if (!a.normalizedPhone || a.normalizedPhone !== b.normalizedPhone) {
      if (!a.googlePlaceId || a.googlePlaceId !== b.googlePlaceId) {
        return null;
      }
    }
  }

  if (confidence >= STRONG) return { confidence, reasons, uncertain: false };
  if (confidence >= MEDIUM) return { confidence, reasons, uncertain: false };
  if (confidence >= UNCERTAIN && namesSimilar >= 0.88 && sameCity) {
    return { confidence, reasons: [...reasons, "needs-review"], uncertain: true };
  }
  return null;
}

function mergeBusiness(primary: NormalizedBusiness, extra: NormalizedBusiness): NormalizedBusiness {
  return {
    ...primary,
    phone: primary.phone || extra.phone,
    email: primary.email || extra.email,
    whatsapp: primary.whatsapp || extra.whatsapp,
    website: primary.website || extra.website,
    instagram: primary.instagram || extra.instagram,
    facebook: primary.facebook || extra.facebook,
    googlePlaceId: primary.googlePlaceId || extra.googlePlaceId,
    googleMapsUrl: primary.googleMapsUrl || extra.googleMapsUrl,
    rating: primary.rating ?? extra.rating,
    reviewCount: Math.max(primary.reviewCount ?? 0, extra.reviewCount ?? 0) || extra.reviewCount,
    address: primary.address || extra.address,
    websiteDomain: primary.websiteDomain || extra.websiteDomain,
    normalizedPhone: primary.normalizedPhone || extra.normalizedPhone,
    normalizedEmail: primary.normalizedEmail || extra.normalizedEmail,
  };
}

function normalizeSocial(value: string): string {
  return value.replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/i, "").toLowerCase();
}
