import { NextRequest, NextResponse } from "next/server";
import { discoverSchema } from "@/lib/validation/schemas";
import { createJob } from "@/lib/jobs/service";
import { dispatchDiscovery } from "@/lib/jobs/dispatch";
import { enforceRateLimit, handleError } from "@/lib/api/http";

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 20);
    if (limited) return limited;
    const body = await request.json();
    const input = discoverSchema.parse(body);
    const job = await createJob("DISCOVERY", input);
    const mode = await dispatchDiscovery(job.id, input);
    return NextResponse.json({ jobId: job.id, status: job.status, mode });
  } catch (error) {
    return handleError(error);
  }
}
