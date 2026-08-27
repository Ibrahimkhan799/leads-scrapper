import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createJob } from "@/lib/jobs/service";
import { dispatchEnrichment } from "@/lib/jobs/dispatch";
import { handleError } from "@/lib/api/http";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  ai: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const job = await createJob("ENRICHMENT_PIPELINE", body);
    const mode = await dispatchEnrichment(job.id, body.ids, Boolean(body.ai));
    return NextResponse.json({ jobId: job.id, mode });
  } catch (error) {
    return handleError(error);
  }
}
