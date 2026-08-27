import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { dispatchDiscovery, dispatchEnrichment } from "@/lib/jobs/dispatch";
import { handleError, jsonError } from "@/lib/api/http";
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
      await dispatchDiscovery(job.id, input);
    } else {
      const payload = job.input as { businessIds?: string[]; ids?: string[]; ai?: boolean };
      const ids = payload.businessIds ?? payload.ids ?? [];
      await dispatchEnrichment(job.id, ids, Boolean(payload.ai));
    }

    return NextResponse.json({ ok: true, failedOnly });
  } catch (error) {
    return handleError(error);
  }
}
