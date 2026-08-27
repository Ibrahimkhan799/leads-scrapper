import type { Prisma } from "@prisma/client";
import { runDiscovery } from "@/lib/pipeline/discover";
import { enrichBusiness } from "@/lib/pipeline/enrich";
import { analyzeBusinessWithAI, rescoreBusiness } from "@/lib/pipeline/score";
import type { DiscoverInput } from "@/lib/validation/schemas";
import { completeJob, failJob, logJob, startJob, updateJobProgress } from "@/lib/jobs/service";
import { prisma } from "@/lib/db/prisma";

export async function processDiscoveryJob(jobId: string, input: DiscoverInput) {
  await startJob(jobId, input.maxLeads);
  await logJob(jobId, "info", `Starting discovery for ${input.businessType}`);

  try {
    const discovery = await runDiscovery(jobId, input);
    const stats = {
      discovered: discovery.discovered,
      duplicatesRemoved: discovery.duplicatesRemoved,
      websitesFound: 0,
      emailsFound: 0,
      whatsappFound: 0,
      hot: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    await updateJobProgress(jobId, {
      total: discovery.businessIds.length,
      processed: 0,
      result: stats as unknown as Prisma.InputJsonValue,
    });

    let processed = 0;
    let failed = 0;

    for (const businessId of discovery.businessIds) {
      const current = await prisma.scrapingJob.findUnique({ where: { id: jobId } });
      if (current?.status === "CANCELLED") {
        await logJob(jobId, "warn", "Job cancelled");
        return;
      }
      try {
        if (input.enrichment.website || input.enrichment.contact || input.enrichment.social) {
          await enrichBusiness(businessId, input.enrichment);
        }
        const score = await rescoreBusiness(businessId);
        if (input.enrichment.ai && (score.category === "HOT" || score.category === "HIGH")) {
          try {
            await analyzeBusinessWithAI(businessId);
          } catch (error) {
            await logJob(jobId, "warn", `AI skipped for ${businessId}: ${error instanceof Error ? error.message : "error"}`);
          }
        }
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (business?.websiteUrl) stats.websitesFound += 1;
        if (business?.email) stats.emailsFound += 1;
        if (business?.whatsapp) stats.whatsappFound += 1;
        if (score.category === "HOT") stats.hot += 1;
        else if (score.category === "HIGH") stats.high += 1;
        else if (score.category === "MEDIUM") stats.medium += 1;
        else stats.low += 1;
      } catch (error) {
        failed += 1;
        await logJob(jobId, "error", `Failed ${businessId}: ${error instanceof Error ? error.message : "error"}`);
      }
      processed += 1;
      if (processed % 5 === 0 || processed === discovery.businessIds.length) {
        await updateJobProgress(jobId, {
          processed,
          failed,
          result: stats as unknown as Prisma.InputJsonValue,
        });
      }
    }

    await completeJob(jobId, {
      ...stats,
      unique: discovery.unique,
      businessIds: discovery.businessIds,
    } as unknown as Prisma.InputJsonValue);
    await logJob(jobId, "info", "Discovery pipeline completed");
  } catch (error) {
    await failJob(jobId, error instanceof Error ? error.message : "Discovery failed");
    throw error;
  }
}

export async function processEnrichmentJob(jobId: string, businessIds: string[], ai = false) {
  await startJob(jobId, businessIds.length);
  let processed = 0;
  let failed = 0;
  for (const businessId of businessIds) {
    const current = await prisma.scrapingJob.findUnique({ where: { id: jobId } });
    if (current?.status === "CANCELLED") return;
    try {
      await enrichBusiness(businessId);
      await rescoreBusiness(businessId);
      if (ai) {
        try {
          await analyzeBusinessWithAI(businessId);
        } catch {
          // AI is optional
        }
      }
    } catch (error) {
      failed += 1;
      await logJob(jobId, "error", error instanceof Error ? error.message : "enrich failed");
    }
    processed += 1;
    await updateJobProgress(jobId, { processed, failed });
  }
  await completeJob(jobId, { processed, failed } as unknown as Prisma.InputJsonValue);
}
