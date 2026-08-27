import { PrismaClient, type Prisma } from "@prisma/client";
import { MOCK_CATALOG } from "../src/lib/providers/discovery/mock-catalog";
import { toRaw } from "../src/lib/providers/discovery/mock";
import { normalizeRawBusiness } from "../src/lib/discovery/normalize";
import { calculateLeadScore } from "../src/lib/scoring/calculate";
import { analyzeWebsiteHtml, opportunityFromQuality } from "../src/lib/analysis/website-audit";
import { SEARCH_TEMPLATES } from "../src/lib/countries";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

const TAGS = ["Dubai", "Gym", "No Website", "High Value", "Website Redesign", "WhatsApp", "Hot Lead"];

async function main() {
  await prisma.business.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.scrapingJob.deleteMany();

  await prisma.appSetting.create({
    data: { key: "app", value: DEFAULT_SETTINGS as object },
  });

  const tags = await Promise.all(
    TAGS.map((name) => prisma.tag.create({ data: { name } }))
  );

  await prisma.savedSearch.createMany({
    data: SEARCH_TEMPLATES.map((template) => ({
      name: template.name,
      config: template.config as object,
    })),
  });

  for (const item of MOCK_CATALOG) {
    const raw = toRaw(item, "seed");
    const normalized = normalizeRawBusiness(raw);
    const hasWebsite = Boolean(normalized.website);
    const html = hasWebsite
      ? `<html lang="en"><head><title>${normalized.name}</title><meta name="viewport" content="width=device-width"><meta name="description" content="local business"></head><body><nav>Menu</nav><h1>${normalized.name}</h1><a href="/contact">Contact us</a>${normalized.bookingUrl ? '<a href="/book">Book now</a>' : ""}<p>About us and our services. Opening hours. Testimonials.</p>${normalized.email ? `<a href="mailto:${normalized.email}">${normalized.email}</a>` : ""}</body></html>`
      : "";
    const audit = hasWebsite
      ? analyzeWebsiteHtml({
          url: normalized.website!,
          html,
          httpStatus: 200,
          loadTimeMs: item.scenario === "poor-website" ? 4200 : 900,
        })
      : null;
    const score = calculateLeadScore({
      hasWebsite,
      websiteQuality: audit?.quality ?? "NONE",
      mobileViewport: audit?.mobileViewport ?? false,
      loadTimeMs: audit?.loadTimeMs ?? null,
      hasClearCta: audit?.hasClearCta ?? false,
      hasBooking: Boolean(normalized.bookingUrl),
      hasEmail: Boolean(normalized.normalizedEmail),
      hasWhatsapp: Boolean(normalized.whatsapp),
      hasInstagram: Boolean(normalized.instagram),
      reviewCount: normalized.reviewCount ?? 0,
      rating: normalized.rating ?? null,
      hasActiveSocial: Boolean(normalized.instagram || normalized.facebook),
      multipleLocations: item.scenario === "multi-location",
      brokenPages: false,
      https: Boolean(normalized.website?.startsWith("https://")),
    });

    const created = await prisma.business.create({
      data: {
        name: normalized.name,
        normalizedName: normalized.normalizedName,
        businessType: normalized.businessType || item.businessType,
        category: item.category,
        country: item.country,
        countryCode: item.countryCode,
        city: item.city,
        area: item.area,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        googlePlaceId: item.googlePlaceId,
        googleMapsUrl: normalized.googleMapsUrl,
        phone: normalized.normalizedPhone || normalized.phone,
        email: normalized.normalizedEmail,
        whatsapp: normalized.whatsapp,
        websiteUrl: normalized.website,
        websiteDomain: normalized.websiteDomain,
        instagram: normalized.instagram,
        facebook: normalized.facebook,
        bookingUrl: normalized.bookingUrl,
        bookingProvider: normalized.bookingProvider,
        rating: normalized.rating,
        reviewCount: normalized.reviewCount,
        websiteStatus: hasWebsite ? "verified" : "none",
        websiteQuality: audit?.quality ?? "NONE",
        websiteOpportunity: audit?.opportunity ?? opportunityFromQuality("NONE", true),
        crawlStatus: hasWebsite ? "SUCCESS" : "SKIPPED",
        leadScore: score.score,
        leadCategory: score.category,
        lastDiscoveredAt: new Date(),
        lastEnrichedAt: new Date(),
        discoverySources: {
          create: { provider: "seed", sourceId: item.googlePlaceId, rawPayload: item as object },
        },
        scores: {
          create: {
            score: score.score,
            category: score.category,
            reasons: score.reasons as unknown as Prisma.InputJsonValue,
          },
        },
        activities: {
          create: { type: "seeded", message: "Imported from seed catalog" },
        },
      },
    });

    if (normalized.normalizedEmail) {
      await prisma.businessContact.create({
        data: {
          businessId: created.id,
          type: "email",
          value: normalized.normalizedEmail,
          normalizedValue: normalized.normalizedEmail,
          source: "seed",
          confidence: 0.9,
          isPrimary: true,
        },
      });
    }
    if (normalized.instagram) {
      await prisma.socialProfile.create({
        data: {
          businessId: created.id,
          platform: "instagram",
          url: normalized.instagram,
          source: "seed",
          confidence: 0.8,
        },
      });
    }

    const tagIds = tags
      .filter((tag) => {
        if (tag.name === "No Website") return !hasWebsite;
        if (tag.name === "Hot Lead") return score.category === "HOT";
        if (tag.name === "WhatsApp") return Boolean(normalized.whatsapp);
        if (tag.name === item.city) return true;
        if (tag.name === item.businessType) return true;
        return false;
      })
      .map((tag) => tag.id);
    if (tagIds.length) {
      await prisma.businessTag.createMany({
        data: tagIds.map((tagId) => ({ businessId: created.id, tagId })),
        skipDuplicates: true,
      });
    }
  }

  console.log(`Seeded ${MOCK_CATALOG.length} businesses`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
