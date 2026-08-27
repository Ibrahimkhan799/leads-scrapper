import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleError } from "@/lib/api/http";

export async function GET() {
  try {
    const [
      total,
      hot,
      high,
      noWebsite,
      poorWebsites,
      emails,
      whatsapp,
      instagram,
      jobsRunning,
      byCountry,
      byType,
      byCity,
      scoreBuckets,
      qualityBuckets,
      statusBuckets,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { leadCategory: "HOT" } }),
      prisma.business.count({ where: { leadCategory: "HIGH" } }),
      prisma.business.count({ where: { OR: [{ websiteUrl: null }, { websiteUrl: "" }] } }),
      prisma.business.count({ where: { websiteQuality: "POOR" } }),
      prisma.business.count({ where: { email: { not: null } } }),
      prisma.business.count({ where: { whatsapp: { not: null } } }),
      prisma.business.count({ where: { instagram: { not: null } } }),
      prisma.scrapingJob.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
      prisma.business.groupBy({ by: ["country"], _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 12 }),
      prisma.business.groupBy({ by: ["businessType"], _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 12 }),
      prisma.business.groupBy({ by: ["city"], _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 12 }),
      prisma.business.groupBy({ by: ["leadCategory"], _count: { _all: true } }),
      prisma.business.groupBy({ by: ["websiteQuality"], _count: { _all: true } }),
      prisma.business.groupBy({ by: ["contactStatus"], _count: { _all: true } }),
    ]);

    const avg = await prisma.business.aggregate({
      _avg: { leadScore: true, reviewCount: true, rating: true },
    });

    const websiteOpportunityRate = total ? Math.round((noWebsite / total) * 100) : 0;
    const contactabilityRate = total ? Math.round(((emails + whatsapp) / (total * 2)) * 100) : 0;

    return NextResponse.json({
      totals: {
        total,
        hot,
        high,
        noWebsite,
        poorWebsites,
        emails,
        whatsapp,
        instagram,
        jobsRunning,
        websiteOpportunityRate,
        contactabilityRate,
        averageLeadScore: Math.round(avg._avg.leadScore ?? 0),
        averageReviews: Math.round(avg._avg.reviewCount ?? 0),
        averageRating: Number((avg._avg.rating ?? 0).toFixed(2)),
      },
      byCountry,
      byType,
      byCity,
      scoreBuckets,
      qualityBuckets,
      statusBuckets,
    });
  } catch (error) {
    return handleError(error);
  }
}
