import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MockDiscoveryProvider } from "@/lib/providers/discovery/mock";
import { GooglePlacesDiscoveryProvider } from "@/lib/providers/discovery/google-places";
import { MockSearchProvider } from "@/lib/providers/search/mock";
import { HttpSearchProvider } from "@/lib/providers/search/http";
import { SearchWebsiteDiscoveryProvider, WEBSITE_VERIFY_THRESHOLD } from "@/lib/providers/website-discovery";
import type { BusinessDiscoveryProvider, RawBusiness } from "@/lib/providers/types";
import { generateSearchQueries } from "@/lib/discovery/query-generator";
import { normalizeRawBusiness } from "@/lib/discovery/normalize";
import { deduplicateBusinesses } from "@/lib/discovery/deduplicate";
import { mockProvidersEnabled } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import type { DiscoverInput } from "@/lib/validation/schemas";
import { logJob } from "@/lib/jobs/service";

export function getDiscoveryProviders(sources: DiscoverInput["sources"]): BusinessDiscoveryProvider[] {
  const providers: BusinessDiscoveryProvider[] = [];
  const mock = mockProvidersEnabled();
  const google = new GooglePlacesDiscoveryProvider();

  if (mock || !google.enabled()) {
    providers.push(new MockDiscoveryProvider());
    return providers;
  }

  if (sources.googleMaps && google.enabled()) providers.push(google);
  if (!providers.length) providers.push(new MockDiscoveryProvider());
  return providers;
}

export async function runDiscovery(jobId: string, input: DiscoverInput) {
  const settings = await getSettings();
  const providers = getDiscoveryProviders(input.sources);
  const queries = settings.discovery.queryExpansion
    ? generateSearchQueries(input, { maxQueries: settings.discovery.maxQueries })
    : [[input.businessType, input.city, input.country].filter(Boolean).join(" ")];

  await logJob(jobId, "info", `Generated ${queries.length} search queries`);

  const raw: RawBusiness[] = [];
  for (const provider of providers) {
    try {
      const found = await provider.search({
        ...input,
        maxResults: input.maxLeads,
      });
      raw.push(...found);
      await prisma.searchQuery.createMany({
        data: queries.map((query) => ({
          jobId,
          query,
          provider: provider.id,
          resultCount: found.length,
        })),
      });
      await logJob(jobId, "info", `${provider.id} returned ${found.length} businesses`);
    } catch (error) {
      await logJob(jobId, "error", `${provider.id} failed: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  const normalized = raw.map(normalizeRawBusiness);
  const { unique, duplicates } = deduplicateBusinesses(normalized);
  const limited = unique.slice(0, input.maxLeads);

  const createdIds: string[] = [];
  let uncertain = 0;

  for (const business of limited) {
    const existing = await findExisting(business.googlePlaceId, business.normalizedPhone, business.websiteDomain);
    if (existing) {
      createdIds.push(existing.id);
      continue;
    }

    const created = await prisma.business.create({
      data: {
        name: business.name,
        normalizedName: business.normalizedName,
        businessType: business.businessType || input.businessType,
        category: business.category,
        subcategory: business.subcategory,
        country: business.country || input.country || null,
        countryCode: business.countryCode || input.countryCode || null,
        state: business.state || input.state || null,
        city: business.city || input.city || null,
        area: business.area || input.area || null,
        address: business.address,
        postalCode: business.postalCode || input.postalCode || null,
        latitude: business.latitude,
        longitude: business.longitude,
        googlePlaceId: business.googlePlaceId,
        googleMapsUrl: business.googleMapsUrl,
        phone: business.normalizedPhone || business.phone,
        email: business.normalizedEmail || business.email,
        whatsapp: business.whatsapp,
        websiteUrl: business.website,
        websiteDomain: business.websiteDomain,
        instagram: business.instagram,
        facebook: business.facebook,
        tiktok: business.tiktok,
        youtube: business.youtube,
        linkedin: business.linkedin,
        twitter: business.twitter,
        bookingUrl: business.bookingUrl,
        bookingProvider: business.bookingProvider,
        rating: business.rating,
        reviewCount: business.reviewCount,
        openingHours: business.openingHours as Prisma.InputJsonValue | undefined,
        websiteStatus: business.website ? "found" : "none",
        lastDiscoveredAt: new Date(),
        possibleDuplicate: false,
        discoverySources: {
          create: {
            provider: business.source,
            sourceId: business.sourceId,
            rawPayload: (business.raw ?? {}) as Prisma.InputJsonValue,
            query: queries[0],
          },
        },
        activities: {
          create: {
            type: "discovered",
            message: `Discovered from ${business.source}`,
          },
        },
      },
    });
    createdIds.push(created.id);
  }

  for (const dup of duplicates) {
    if (dup.uncertain) uncertain += 1;
  }

  if (uncertain) {
    await prisma.business.updateMany({
      where: { id: { in: createdIds.slice(-uncertain) } },
      data: { possibleDuplicate: true },
    });
  }

  return {
    discovered: raw.length,
    unique: createdIds.length,
    duplicatesRemoved: Math.max(0, raw.length - unique.length),
    uncertainDuplicates: uncertain,
    businessIds: createdIds,
    queries,
  };
}

async function findExisting(
  googlePlaceId?: string,
  phone?: string | null,
  domain?: string | null
) {
  if (googlePlaceId) {
    const match = await prisma.business.findUnique({ where: { googlePlaceId } });
    if (match) return match;
  }
  if (phone) {
    const match = await prisma.business.findFirst({ where: { phone } });
    if (match) return match;
  }
  if (domain) {
    const match = await prisma.business.findFirst({ where: { websiteDomain: domain } });
    if (match) return match;
  }
  return null;
}

export function getSearchProvider() {
  const http = new HttpSearchProvider();
  if (http.enabled() && !mockProvidersEnabled()) return http;
  return new MockSearchProvider();
}

export function getWebsiteDiscovery() {
  return new SearchWebsiteDiscoveryProvider(getSearchProvider());
}

export { WEBSITE_VERIFY_THRESHOLD };
