import { NextRequest, NextResponse } from "next/server";
import { rescoreBusiness } from "@/lib/pipeline/score";
import { handleError } from "@/lib/api/http";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await rescoreBusiness(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
