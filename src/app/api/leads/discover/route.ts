import { NextRequest, NextResponse } from "next/server";
import { discoverSchema } from "@/lib/validation/schemas";
import { createJob } from "@/lib/jobs/service";
import { enqueue, QUEUE_NAMES } from "@/lib/queues";
import { processDiscoveryJob } from "@/lib/pipeline/run";
import { enforceRateLimit, handleError } from "@/lib/api/http";
import { isTruthy } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 20);
    if (limited) return limited;
    const body = await request.json();
    const input = discoverSchema.parse(body);
    const job = await createJob("DISCOVERY", input);

    if (isTruthy(process.env.INLINE_JOBS)) {
      void processDiscoveryJob(job.id, input).catch((error) => {
        console.error("inline discovery failed", error);
      });
    } else {
      await enqueue(QUEUE_NAMES.discovery, { jobId: job.id, input });
    }

    return NextResponse.json({ jobId: job.id, status: job.status });
  } catch (error) {
    return handleError(error);
  }
}
