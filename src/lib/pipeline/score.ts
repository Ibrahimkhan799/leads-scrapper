import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateLeadScore } from "@/lib/scoring/calculate";
import type { ScoringContext } from "@/lib/scoring/rules";
import { getSettings } from "@/lib/settings";
import { createAIProvider } from "@/lib/ai/provider";

export async function rescoreBusiness(businessId: string) {
  const settings = await getSettings();
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      websites: { include: { audits: { orderBy: { createdAt: "desc" }, take: 1 } } },
      socialProfiles: true,
      signals: true,
    },
  });
  if (!business) throw new Error("Business not found");

  const audit = business.websites[0]?.audits[0];
  const ctx: ScoringContext = {
    hasWebsite: Boolean(business.websiteUrl),
    websiteQuality: business.websiteQuality,
    mobileViewport: audit?.mobileViewport ?? Boolean(business.websiteUrl),
    loadTimeMs: audit?.loadTimeMs ?? null,
    hasClearCta: audit?.hasClearCta ?? false,
    hasBooking: Boolean(business.bookingUrl) || Boolean(audit?.hasBookingCta),
    hasEmail: Boolean(business.email),
    hasWhatsapp: Boolean(business.whatsapp),
    hasInstagram: Boolean(business.instagram),
    reviewCount: business.reviewCount ?? 0,
    rating: business.rating,
    hasActiveSocial: Boolean(business.instagram || business.facebook || business.socialProfiles.length > 0),
    multipleLocations:
      business.signals.some((signal) => signal.key === "multipleLocations") ||
      /multiple locations/i.test(business.notes ?? ""),
    brokenPages: (audit?.brokenLinkCount ?? 0) > 0,
    https: audit?.https ?? Boolean(business.websiteUrl?.startsWith("https://")),
  };

  const result = calculateLeadScore(ctx, settings.scoring);

  await prisma.leadScore.create({
    data: {
      businessId,
      score: result.score,
      category: result.category,
      profile: result.profile,
      reasons: result.reasons as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.business.update({
    where: { id: businessId },
    data: {
      leadScore: result.score,
      leadCategory: result.category,
    },
  });

  await prisma.leadActivity.create({
    data: {
      businessId,
      type: "scored",
      message: `Lead score ${result.score} (${result.category})`,
      metadata: result.reasons as unknown as Prisma.InputJsonValue,
    },
  });

  return result;
}

export async function analyzeBusinessWithAI(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { websites: { include: { audits: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  if (!business) throw new Error("Business not found");

  const audit = business.websites[0]?.audits[0];
  const provider = createAIProvider();
  const analysis = await provider.analyze({
    businessName: business.name,
    businessType: business.businessType,
    city: business.city,
    country: business.country,
    rating: business.rating,
    reviewCount: business.reviewCount,
    hasWebsite: Boolean(business.websiteUrl),
    websiteQuality: business.websiteQuality,
    auditSummary: audit ?? undefined,
    contacts: {
      email: business.email,
      phone: business.phone,
      whatsapp: business.whatsapp,
      instagram: business.instagram,
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      businessId,
      classification: analysis.classification,
      websiteQualityInterpretation: analysis.websiteQualityInterpretation,
      opportunity: analysis.opportunity,
      websiteWeaknessSummary: analysis.websiteWeaknessSummary,
      salesInsight: analysis.salesInsight as unknown as Prisma.InputJsonValue,
      raw: analysis as unknown as Prisma.InputJsonValue,
      model: process.env.OPENAI_MODEL ?? "mock",
    },
  });

  await prisma.leadActivity.create({
    data: {
      businessId,
      type: "ai",
      message: "AI analysis generated",
    },
  });

  return analysis;
}
