export interface WebsiteAuditInput {
  url: string;
  html: string;
  httpStatus: number;
  loadTimeMs: number;
  brokenLinkCount?: number;
  pageCount?: number;
  hasContactPage?: boolean;
}

export interface WebsiteAuditResult {
  https: boolean;
  mobileViewport: boolean;
  httpStatus: number;
  loadTimeMs: number;
  brokenLinkCount: number;
  hasClearCta: boolean;
  hasContactCta: boolean;
  hasBookingCta: boolean;
  hasMobileNav: boolean;
  visiblePhone: boolean;
  visibleEmail: boolean;
  hasServices: boolean;
  hasPricing: boolean;
  hasLocation: boolean;
  hasOpeningHours: boolean;
  hasAbout: boolean;
  hasTestimonials: boolean;
  hasContactPage: boolean;
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  quality: "NONE" | "POOR" | "OUTDATED" | "GOOD" | "EXCELLENT";
  opportunity: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
}

const CTA_RE = /\b(book now|get a quote|contact us|call now|schedule|reserve|free consultation|get started|request a quote)\b/i;
const CONTACT_CTA_RE = /\b(contact|call us|email us|get in touch|whatsapp)\b/i;
const BOOKING_CTA_RE = /\b(book|reserve|appointment|schedule)\b/i;
const SERVICES_RE = /\b(services|what we (do|offer)|our work|treatments|menu)\b/i;
const PRICING_RE = /\b(pricing|price list|packages?|rates|membership)\b/i;
const LOCATION_RE = /\b(location|find us|address|map|directions)\b/i;
const HOURS_RE = /\b(opening hours|open today|hours of operation|we are open)\b/i;
const ABOUT_RE = /\b(about us|our story|who we are)\b/i;
const TESTIMONIALS_RE = /\b(testimonials?|reviews?|what our (clients|customers) say)\b/i;

export function analyzeWebsiteHtml(input: WebsiteAuditInput): WebsiteAuditResult {
  const html = input.html;
  const https = input.url.startsWith("https://");
  const mobileViewport = /name=["']viewport["']/i.test(html);
  const hasClearCta = CTA_RE.test(html);
  const hasContactCta = CONTACT_CTA_RE.test(html);
  const hasBookingCta = BOOKING_CTA_RE.test(html);
  const hasMobileNav = /nav|hamburger|menu-toggle|navbar/i.test(html);
  const visiblePhone = /tel:|\+\d{6,}/i.test(html);
  const visibleEmail = /mailto:|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(html);
  const hasServices = SERVICES_RE.test(html);
  const hasPricing = PRICING_RE.test(html);
  const hasLocation = LOCATION_RE.test(html);
  const hasOpeningHours = HOURS_RE.test(html);
  const hasAbout = ABOUT_RE.test(html);
  const hasTestimonials = TESTIMONIALS_RE.test(html);
  const hasContactPage = input.hasContactPage ?? /\/contact/i.test(html);
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
  const metaDescription = /name=["']description["']/i.test(html);
  const h1 = /<h1[\s>]/i.test(html);
  const lang = /<html[^>]*lang=/i.test(html);
  const images = html.match(/<img\b/gi)?.length ?? 0;
  const imagesWithAlt = html.match(/<img[^>]*alt=/gi)?.length ?? 0;
  const scripts = html.match(/<script\b/gi)?.length ?? 0;

  const performanceScore = clamp(
    100 -
      Math.min(40, Math.floor((input.loadTimeMs || 0) / 100)) -
      Math.min(20, scripts * 2) -
      Math.min(15, Math.floor(html.length / 50000) * 5)
  );
  const accessibilityScore = clamp(
    40 +
      (lang ? 15 : 0) +
      (mobileViewport ? 15 : 0) +
      (images === 0 ? 15 : Math.round((imagesWithAlt / Math.max(images, 1)) * 20)) +
      (h1 ? 10 : 0)
  );
  const seoScore = clamp(
    30 + (title ? 20 : 0) + (metaDescription ? 20 : 0) + (h1 ? 15 : 0) + (https ? 15 : 0)
  );
  const bestPracticesScore = clamp(
    (https ? 30 : 0) +
      (mobileViewport ? 25 : 0) +
      (input.httpStatus === 200 ? 25 : 0) +
      ((input.brokenLinkCount ?? 0) === 0 ? 20 : 0)
  );

  const quality = deriveQuality({
    https,
    mobileViewport,
    hasClearCta,
    hasContactCta,
    hasServices,
    hasAbout,
    performanceScore,
    seoScore,
    httpStatus: input.httpStatus,
    brokenLinkCount: input.brokenLinkCount ?? 0,
  });

  return {
    https,
    mobileViewport,
    httpStatus: input.httpStatus,
    loadTimeMs: input.loadTimeMs,
    brokenLinkCount: input.brokenLinkCount ?? 0,
    hasClearCta,
    hasContactCta,
    hasBookingCta,
    hasMobileNav,
    visiblePhone,
    visibleEmail,
    hasServices,
    hasPricing,
    hasLocation,
    hasOpeningHours,
    hasAbout,
    hasTestimonials,
    hasContactPage,
    performanceScore,
    accessibilityScore,
    seoScore,
    bestPracticesScore,
    quality,
    opportunity: opportunityFromQuality(quality, !input.url),
  };
}

export function opportunityFromQuality(
  quality: WebsiteAuditResult["quality"],
  noWebsite = false
): WebsiteAuditResult["opportunity"] {
  if (noWebsite || quality === "NONE") return "VERY_HIGH";
  if (quality === "POOR") return "HIGH";
  if (quality === "OUTDATED") return "MEDIUM";
  if (quality === "GOOD") return "LOW";
  return "VERY_LOW";
}

function deriveQuality(input: {
  https: boolean;
  mobileViewport: boolean;
  hasClearCta: boolean;
  hasContactCta: boolean;
  hasServices: boolean;
  hasAbout: boolean;
  performanceScore: number;
  seoScore: number;
  httpStatus: number;
  brokenLinkCount: number;
}): WebsiteAuditResult["quality"] {
  if (input.httpStatus >= 400) return "POOR";
  const positives = [
    input.https,
    input.mobileViewport,
    input.hasClearCta,
    input.hasContactCta,
    input.hasServices,
    input.hasAbout,
    input.performanceScore >= 70,
    input.seoScore >= 70,
    input.brokenLinkCount === 0,
  ].filter(Boolean).length;

  if (positives >= 8) return "EXCELLENT";
  if (positives >= 6) return "GOOD";
  if (positives >= 4) return "OUTDATED";
  return "POOR";
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
