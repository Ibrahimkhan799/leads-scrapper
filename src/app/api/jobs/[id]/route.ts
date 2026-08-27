import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleError, jsonError } from "@/lib/api/http";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.scrapingJob.findUnique({
      where: { id },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 200 } },
    });
    if (!job) return jsonError("Job not found", 404);
    return NextResponse.json(job);
  } catch (error) {
    return handleError(error);
  }
}
