import { NextRequest, NextResponse } from "next/server";
import { cancelJob } from "@/lib/jobs/service";
import { handleError } from "@/lib/api/http";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await cancelJob(id);
    return NextResponse.json(job);
  } catch (error) {
    return handleError(error);
  }
}
