import { NextRequest, NextResponse } from "next/server";
import { analyzeBusinessWithAI } from "@/lib/pipeline/score";
import { handleError } from "@/lib/api/http";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analysis = await analyzeBusinessWithAI(id);
    return NextResponse.json(analysis);
  } catch (error) {
    return handleError(error);
  }
}
