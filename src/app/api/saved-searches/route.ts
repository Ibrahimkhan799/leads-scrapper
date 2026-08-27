import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { handleError, jsonError } from "@/lib/api/http";

const schema = z.object({
  name: z.string().min(1).max(120),
  config: z.record(z.string(), z.unknown()),
});

export async function GET() {
  try {
    const items = await prisma.savedSearch.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const item = await prisma.savedSearch.create({ data: { name: body.name, config: body.config as Prisma.InputJsonValue } });
    return NextResponse.json(item);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("Missing id");
    await prisma.savedSearch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
