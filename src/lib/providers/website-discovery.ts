import type {
  BusinessIdentity,
  SearchProvider,
  WebsiteCandidate,
  WebsiteDiscoveryProvider,
} from "@/lib/providers/types";
import { nameSimilarity } from "@/lib/utils/similarity";
import { normalizeBusinessName, normalizeDomain } from "@/lib/utils/normalize";

const DIRECTORY_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "yelp.com",
  "tripadvisor.com",
  "yellowpages.com",
  "maps.google.com",
  "google.com",
  "apple.com",
  "bing.com",
];

export class SearchWebsiteDiscoveryProvider implements WebsiteDiscoveryProvider {
  constructor(private readonly searchProvider: SearchProvider) {}

  async findOfficialWebsite(business: BusinessIdentity): Promise<WebsiteCandidate[]> {
    const query = [business.name, business.city, business.country].filter(Boolean).join(" ");
    const results = await this.searchProvider.search(query);
    return results
      .map((result) => scoreCandidate(business, result.url, result.title, result.snippet))
      .filter((item): item is WebsiteCandidate => Boolean(item))
      .sort((a, b) => b.score - a.score);
  }
}

export function scoreCandidate(
  business: BusinessIdentity,
  url: string,
  title?: string,
  snippet?: string
): WebsiteCandidate | null {
  const domain = normalizeDomain(url);
  if (!domain) return null;
  if (DIRECTORY_HOSTS.some((host) => domain === host || domain.endsWith(`.${host}`))) {
    return null;
  }

  const reasons: string[] = [];
  let score = 0.2;
  const name = normalizeBusinessName(business.name);
  const domainTokens = domain.replace(/\.(com|net|org|ae|sa|uk|co|io)$/g, "").replace(/[-.]/g, " ");
  const nameScore = nameSimilarity(name, normalizeBusinessName(domainTokens));
  if (nameScore >= 0.5) {
    score += 0.35;
    reasons.push("domain-name-similarity");
  }
  const haystack = `${title ?? ""} ${snippet ?? ""}`.toLowerCase();
  if (business.name && haystack.includes(business.name.toLowerCase())) {
    score += 0.2;
    reasons.push("title-name-match");
  }
  if (business.city && haystack.includes(business.city.toLowerCase())) {
    score += 0.15;
    reasons.push("location-match");
  }
  if (business.phone && haystack.includes(business.phone.replace(/\s/g, ""))) {
    score += 0.2;
    reasons.push("phone-match");
  }
  if (business.instagram && haystack.includes(business.instagram.toLowerCase())) {
    score += 0.1;
    reasons.push("social-match");
  }

  return {
    url: url.startsWith("http") ? url : `https://${url}`,
    domain,
    score: Math.min(1, score),
    reasons,
  };
}

export const WEBSITE_VERIFY_THRESHOLD = 0.72;
