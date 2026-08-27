import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createJob } from "@/lib/jobs/service";
import { enqueue, QUEUE_NAMES } from "@/lib/queues";
import { processEnrichmentJob } from "@/lib/pipeline/run";
import { handleError } from "@/lib/api/http";
import { isTruthy } from "@/lib/env";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  ai: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const job = await createJob("ENRICHMENT_PIPELINE", body);
    if (isTruthy(process.env.INLINE_JOBS)) {
      void processEnrichmentJob(job.id, body.ids, Boolean(body.ai));
    } else {
      await enqueue(QUEUE_NAMES.enrichment, { jobId: job.id, businessIds: body.ids, ai: Boolean(body.ai) });
    }
    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return handleError(error);
  }
}
