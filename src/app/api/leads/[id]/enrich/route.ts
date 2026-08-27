import { NextRequest, NextResponse } from "next/server";
import { createJob } from "@/lib/jobs/service";
import { enqueue, QUEUE_NAMES } from "@/lib/queues";
import { processEnrichmentJob } from "@/lib/pipeline/run";
import { handleError } from "@/lib/api/http";
import { isTruthy } from "@/lib/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const job = await createJob("ENRICHMENT_PIPELINE", { businessIds: [id], ai: Boolean(body.ai) });
    if (isTruthy(process.env.INLINE_JOBS)) {
      void processEnrichmentJob(job.id, [id], Boolean(body.ai));
    } else {
      await enqueue(QUEUE_NAMES.enrichment, { jobId: job.id, businessIds: [id], ai: Boolean(body.ai) });
    }
    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return handleError(error);
  }
}
