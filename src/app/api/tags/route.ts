import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { handleError } from "@/lib/api/http";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ items: tags });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = z.object({ name: z.string().min(1).max(40), color: z.string().optional() }).parse(await request.json());
    const tag = await prisma.tag.upsert({
      where: { name: body.name },
      update: { color: body.color ?? undefined },
      create: { name: body.name, color: body.color ?? "#64748b" },
    });
    return NextResponse.json(tag);
  } catch (error) {
    return handleError(error);
  }
}
