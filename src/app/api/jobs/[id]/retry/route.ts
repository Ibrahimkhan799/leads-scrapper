import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { enqueue, QUEUE_NAMES } from "@/lib/queues";
import { processDiscoveryJob, processEnrichmentJob } from "@/lib/pipeline/run";
import { handleError, jsonError } from "@/lib/api/http";
import { isTruthy } from "@/lib/env";
import type { DiscoverInput } from "@/lib/validation/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const failedOnly = request.nextUrl.searchParams.get("failed") === "true";
    const job = await prisma.scrapingJob.findUnique({ where: { id } });
    if (!job) return jsonError("Job not found", 404);

    await prisma.scrapingJob.update({
      where: { id },
      data: { status: "QUEUED", error: null, completedAt: null, progress: 0, processed: 0, failed: 0 },
    });

    if (job.type === "DISCOVERY") {
      const input = job.input as DiscoverInput;
      if (isTruthy(process.env.INLINE_JOBS)) void processDiscoveryJob(job.id, input);
      else await enqueue(QUEUE_NAMES.discovery, { jobId: job.id, input });
    } else {
      const payload = job.input as { businessIds?: string[] };
      const ids = payload.businessIds ?? [];
      if (isTruthy(process.env.INLINE_JOBS)) void processEnrichmentJob(job.id, ids);
      else await enqueue(QUEUE_NAMES.enrichment, { jobId: job.id, businessIds: ids });
    }

    return NextResponse.json({ ok: true, failedOnly });
  } catch (error) {
    return handleError(error);
  }
}
