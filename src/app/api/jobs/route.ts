import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleError } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const jobs = await prisma.scrapingJob.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ items: jobs });
  } catch (error) {
    return handleError(error);
  }
}
