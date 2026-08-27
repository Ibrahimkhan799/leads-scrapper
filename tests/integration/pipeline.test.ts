import { describe, expect, it } from "vitest";
import { MockDiscoveryProvider } from "@/lib/providers/discovery/mock";
import { normalizeRawBusiness } from "@/lib/discovery/normalize";
import { deduplicateBusinesses } from "@/lib/discovery/deduplicate";
import { calculateLeadScore } from "@/lib/scoring/calculate";
import { analyzeWebsiteHtml } from "@/lib/analysis/website-audit";
import { extractEmails } from "@/lib/scraping/extractors/email";
import { leadsToCsv } from "@/lib/export/csv";

describe("discovery + enrichment pipeline", () => {
  it("discovers gyms in Dubai and scores them", async () => {
    const provider = new MockDiscoveryProvider();
    const raw = await provider.search({
      businessType: "Gym",
      city: "Dubai",
      country: "United Arab Emirates",
      maxResults: 12,
    });
    expect(raw.length).toBeGreaterThan(0);
    const { unique } = deduplicateBusinesses(raw.map(normalizeRawBusiness));
    expect(unique.length).toBeGreaterThan(0);
    expect(unique.every((item) => item.source)).toBe(true);

    const first = unique[0];
    const html = `<html lang="en"><head><title>${first.name}</title><meta name="viewport" content="width=device-width"></head><body><a href="mailto:info@test.com">Contact us</a></body></html>`;
    const emails = extractEmails(html);
    expect(emails).toContain("info@test.com");
    const audit = analyzeWebsiteHtml({ url: "https://example.com", html, httpStatus: 200, loadTimeMs: 900 });
    const score = calculateLeadScore({
      hasWebsite: Boolean(first.website),
      websiteQuality: audit.quality,
      mobileViewport: audit.mobileViewport,
      loadTimeMs: audit.loadTimeMs,
      hasClearCta: audit.hasClearCta,
      hasBooking: Boolean(first.bookingUrl),
      hasEmail: emails.length > 0,
      hasWhatsapp: Boolean(first.whatsapp),
      hasInstagram: Boolean(first.instagram),
      reviewCount: first.reviewCount ?? 0,
      rating: first.rating ?? null,
      hasActiveSocial: Boolean(first.instagram),
      multipleLocations: false,
      brokenPages: false,
      https: true,
    });
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    const csv = leadsToCsv([{ name: first.name, businessType: first.businessType ?? "Gym", leadScore: score.score, leadCategory: score.category }]);
    expect(csv.split(/\r?\n/).length).toBe(2);
  });
});
