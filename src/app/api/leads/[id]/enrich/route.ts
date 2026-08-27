import { NextRequest, NextResponse } from "next/server";
import { createJob } from "@/lib/jobs/service";
import { dispatchEnrichment } from "@/lib/jobs/dispatch";
import { handleError } from "@/lib/api/http";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const job = await createJob("ENRICHMENT_PIPELINE", { businessIds: [id], ai: Boolean(body.ai) });
    const mode = await dispatchEnrichment(job.id, [id], Boolean(body.ai));
    return NextResponse.json({ jobId: job.id, mode });
  } catch (error) {
    return handleError(error);
  }
}
