import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createCrawler } from "@/lib/scraping/crawler";
import { extractEmails } from "@/lib/scraping/extractors/email";
import { extractPhones } from "@/lib/scraping/extractors/phone";
import { extractWhatsApp } from "@/lib/scraping/extractors/whatsapp";
import { extractSocialProfiles } from "@/lib/scraping/extractors/social";
import { extractBooking } from "@/lib/scraping/extractors/booking";
import { analyzeWebsiteHtml, opportunityFromQuality } from "@/lib/analysis/website-audit";
import { getWebsiteDiscovery, WEBSITE_VERIFY_THRESHOLD } from "@/lib/pipeline/discover";
import { mockProvidersEnabled } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { detectSignals } from "@/lib/analysis/signals";

export async function enrichBusiness(businessId: string, options?: {
  website?: boolean;
  social?: boolean;
  contact?: boolean;
  websiteAnalysis?: boolean;
}) {
  const settings = await getSettings();
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new Error("Business not found");

  let websiteUrl = business.websiteUrl;
  let websiteVerified = Boolean(websiteUrl);

  if (!websiteUrl && options?.website !== false) {
    const discovery = getWebsiteDiscovery();
    const candidates = await discovery.findOfficialWebsite({
      name: business.name,
      city: business.city,
      country: business.country,
      phone: business.phone,
      address: business.address,
      instagram: business.instagram,
    });
    const best = candidates[0];
    if (best && best.score >= WEBSITE_VERIFY_THRESHOLD) {
      websiteUrl = best.url;
      websiteVerified = true;
    } else if (best) {
      websiteUrl = best.url;
      websiteVerified = false;
    }
  }

  let html = "";
  let crawlStatus: "SUCCESS" | "BLOCKED" | "TIMEOUT" | "UNAVAILABLE" | "ERROR" | "SKIPPED" = "SKIPPED";
  let loadTimeMs = 800;
  let httpStatus = 200;
  let pages: Array<{ url: string; path: string; title?: string; html: string; httpStatus: number; loadTimeMs: number }> = [];

  if (websiteUrl && (options?.website !== false || options?.websiteAnalysis !== false)) {
    if (mockProvidersEnabled() || websiteUrl.includes(".example")) {
      const mock = buildMockHtml(business.name, business.businessType, {
        poor: business.websiteQuality === "POOR" || websiteUrl.includes("http-legacy"),
        excellent: Boolean(business.bookingUrl),
        email: business.email,
        phone: business.phone,
        instagram: business.instagram,
      });
      html = mock;
      crawlStatus = "SUCCESS";
      pages = [{ url: websiteUrl, path: "/", title: business.name, html, httpStatus: 200, loadTimeMs: 700 }];
    } else {
      const crawler = createCrawler();
      const result = await crawler.crawl(websiteUrl, {
        maxPages: settings.scraping.maxPages,
        maxDepth: settings.scraping.maxDepth,
        timeoutMs: settings.scraping.timeoutMs,
        delayMs: settings.scraping.delayMs,
      });
      crawlStatus = result.status;
      pages = result.pages;
      html = result.pages.map((page) => page.html).join("\n");
      loadTimeMs = result.pages[0]?.loadTimeMs ?? 0;
      httpStatus = result.pages[0]?.httpStatus ?? 0;
    }
  }

  const emails = options?.contact === false ? [] : extractEmails(html);
  const phones = options?.contact === false ? [] : extractPhones(html, business.country);
  const whatsapp = options?.contact === false ? [] : extractWhatsApp(html, business.country);
  const social = options?.social === false ? [] : extractSocialProfiles(html, websiteUrl ?? undefined);
  const booking = extractBooking(html, websiteUrl ?? undefined);
  const audit = websiteUrl
    ? analyzeWebsiteHtml({
        url: websiteUrl,
        html,
        httpStatus,
        loadTimeMs,
        brokenLinkCount: pages.filter((page) => (page.httpStatus ?? 200) >= 400).length,
        pageCount: pages.length,
        hasContactPage: pages.some((page) => page.path.includes("contact")),
      })
    : null;

  const website =
    websiteUrl
      ? await prisma.website.create({
          data: {
            businessId,
            url: websiteUrl,
            domain: new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`).hostname,
            isVerified: websiteVerified,
            verificationConfidence: websiteVerified ? 0.9 : 0.55,
            discoveredVia: business.websiteUrl ? "source" : "search",
            crawlStatus,
            lastCrawledAt: new Date(),
            pages: {
              create: pages.slice(0, 12).map((page) => ({
                url: page.url,
                path: page.path,
                title: page.title,
                httpStatus: page.httpStatus,
                loadTimeMs: page.loadTimeMs,
              })),
            },
            audits: audit
              ? {
                  create: {
                    https: audit.https,
                    mobileViewport: audit.mobileViewport,
                    httpStatus: audit.httpStatus,
                    loadTimeMs: audit.loadTimeMs,
                    brokenLinkCount: audit.brokenLinkCount,
                    hasClearCta: audit.hasClearCta,
                    hasContactCta: audit.hasContactCta,
                    hasBookingCta: audit.hasBookingCta,
                    hasMobileNav: audit.hasMobileNav,
                    visiblePhone: audit.visiblePhone,
                    visibleEmail: audit.visibleEmail,
                    hasServices: audit.hasServices,
                    hasPricing: audit.hasPricing,
                    hasLocation: audit.hasLocation,
                    hasOpeningHours: audit.hasOpeningHours,
                    hasAbout: audit.hasAbout,
                    hasTestimonials: audit.hasTestimonials,
                    hasContactPage: audit.hasContactPage,
                    performanceScore: audit.performanceScore,
                    accessibilityScore: audit.accessibilityScore,
                    seoScore: audit.seoScore,
                    bestPracticesScore: audit.bestPracticesScore,
                    quality: audit.quality,
                    opportunity: audit.opportunity,
                    raw: audit as unknown as Prisma.InputJsonValue,
                  },
                }
              : undefined,
          },
        })
      : null;

  const primaryEmail = emails[0] || business.email;
  const primaryPhone = phones[0] || business.phone;
  const primaryWhatsapp = whatsapp[0] || business.whatsapp;
  const instagram = social.find((item) => item.platform === "instagram")?.url || business.instagram;
  const facebook = social.find((item) => item.platform === "facebook")?.url || business.facebook;
  const tiktok = social.find((item) => item.platform === "tiktok")?.url || business.tiktok;
  const youtube = social.find((item) => item.platform === "youtube")?.url || business.youtube;
  const linkedin = social.find((item) => item.platform === "linkedin")?.url || business.linkedin;
  const twitter = social.find((item) => item.platform === "twitter")?.url || business.twitter;
  const bookingMatch = booking[0];

  const ops = [
    ...emails.slice(0, 5).map((value, index) =>
      prisma.businessContact.upsert({
        where: { businessId_type_normalizedValue: { businessId, type: "email", normalizedValue: value } },
        update: { value, lastVerifiedAt: new Date() },
        create: {
          businessId,
          type: "email",
          value,
          normalizedValue: value,
          source: "website",
          sourceUrl: websiteUrl,
          confidence: 0.8,
          isPrimary: index === 0,
          lastVerifiedAt: new Date(),
        },
      })
    ),
    ...phones.slice(0, 5).map((value, index) =>
      prisma.businessContact.upsert({
        where: { businessId_type_normalizedValue: { businessId, type: "phone", normalizedValue: value } },
        update: { value, lastVerifiedAt: new Date() },
        create: {
          businessId,
          type: "phone",
          value,
          normalizedValue: value,
          source: "website",
          sourceUrl: websiteUrl,
          confidence: 0.75,
          isPrimary: index === 0,
          lastVerifiedAt: new Date(),
        },
      })
    ),
    ...whatsapp.slice(0, 3).map((value) =>
      prisma.businessContact.upsert({
        where: { businessId_type_normalizedValue: { businessId, type: "whatsapp", normalizedValue: value } },
        update: { value, lastVerifiedAt: new Date() },
        create: {
          businessId,
          type: "whatsapp",
          value,
          normalizedValue: value,
          source: "website",
          sourceUrl: websiteUrl,
          confidence: 0.85,
          lastVerifiedAt: new Date(),
        },
      })
    ),
    ...social.slice(0, 8).map((profile) =>
      prisma.socialProfile.upsert({
        where: {
          businessId_platform_url: { businessId, platform: profile.platform, url: profile.url },
        },
        update: { handle: profile.handle, lastVerifiedAt: new Date() },
        create: {
          businessId,
          platform: profile.platform,
          url: profile.url,
          handle: profile.handle,
          source: "website",
          sourceUrl: websiteUrl,
          confidence: 0.8,
          lastVerifiedAt: new Date(),
        },
      })
    ),
    ...booking.slice(0, 3).map((item) =>
      prisma.bookingPlatform.upsert({
        where: { businessId_provider_url: { businessId, provider: item.provider, url: item.url } },
        update: {},
        create: {
          businessId,
          provider: item.provider,
          url: item.url,
          detectedFrom: websiteUrl,
        },
      })
    ),
  ];
  if (ops.length) {
    await prisma.$transaction(ops);
  }

  const signals = detectSignals(html);
  for (const signal of signals) {
    await prisma.businessSignal.upsert({
      where: { businessId_key: { businessId, key: signal.key } },
      update: { value: signal.value as Prisma.InputJsonValue, source: "website" },
      create: {
        businessId,
        key: signal.key,
        value: signal.value as Prisma.InputJsonValue,
        source: "website",
      },
    });
  }

  const quality = audit?.quality ?? (websiteUrl ? "OUTDATED" : "NONE");
  const opportunity = audit?.opportunity ?? opportunityFromQuality(quality, !websiteUrl);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      websiteUrl,
      websiteDomain: websiteUrl ? new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`).hostname : null,
      websiteStatus: websiteUrl ? (websiteVerified ? "verified" : "found") : "none",
      websiteQuality: quality,
      websiteOpportunity: opportunity,
      crawlStatus,
      email: primaryEmail,
      phone: primaryPhone,
      whatsapp: primaryWhatsapp,
      instagram,
      facebook,
      tiktok,
      youtube,
      linkedin,
      twitter,
      bookingUrl: bookingMatch?.url || business.bookingUrl,
      bookingProvider: bookingMatch?.provider || business.bookingProvider,
      lastEnrichedAt: new Date(),
      lastWebsiteAuditAt: audit ? new Date() : business.lastWebsiteAuditAt,
    },
  });

  await prisma.leadActivity.create({
    data: {
      businessId,
      type: "enriched",
      message: websiteUrl ? `Enriched website ${websiteUrl}` : "Enriched without a website",
      metadata: { emails: emails.length, phones: phones.length, social: social.length } as Prisma.InputJsonValue,
    },
  });

  return { websiteId: website?.id, crawlStatus, emails, phones, whatsapp, social };
}

function buildMockHtml(
  name: string,
  type: string,
  flags: { poor?: boolean; excellent?: boolean; email?: string | null; phone?: string | null; instagram?: string | null }
) {
  if (flags.poor) {
    return `<html><head><title>${name}</title></head><body><h1>Welcome</h1><p>Call us</p></body></html>`;
  }
  return `<html lang="en"><head>
    <title>${name} | ${type}</title>
    <meta name="description" content="${name} official site" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head><body>
    <nav class="navbar">Home About Services Contact</nav>
    <h1>${name}</h1>
    <p>About us: local ${type.toLowerCase()} serving the community.</p>
    <a href="/contact">Contact us</a>
    ${flags.excellent ? '<a href="/book">Book now</a><p>Pricing packages available</p>' : ""}
    ${flags.email ? `<a href="mailto:${flags.email}">${flags.email}</a>` : ""}
    ${flags.phone ? `<a href="tel:${flags.phone}">${flags.phone}</a>` : ""}
    ${flags.instagram ? `<a href="${flags.instagram}">Instagram</a>` : ""}
    <p>Opening hours Monday to Saturday</p>
    <p>Find us at our location. Testimonials from customers.</p>
    <p>Our services and treatments.</p>
  </body></html>`;
}
