import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { leadPatchSchema } from "@/lib/validation/schemas";
import { handleError, jsonError } from "@/lib/api/http";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        contacts: true,
        socialProfiles: true,
        websites: { include: { pages: true, audits: { orderBy: { createdAt: "desc" }, take: 3 } } },
        bookingPlatforms: true,
        scores: { orderBy: { createdAt: "desc" }, take: 5 },
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
        tags: { include: { tag: true } },
        discoverySources: true,
        aiAnalyses: { orderBy: { createdAt: "desc" }, take: 3 },
        signals: true,
      },
    });
    if (!business) return jsonError("Lead not found", 404);
    return NextResponse.json(business);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = leadPatchSchema.parse(await request.json());
    const { tagIds, followUpAt, ...rest } = body;

    const business = await prisma.business.update({
      where: { id },
      data: {
        ...rest,
        followUpAt: followUpAt === undefined ? undefined : followUpAt ? new Date(followUpAt) : null,
        tags: tagIds
          ? {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
        activities: {
          create: {
            type: "updated",
            message: "Lead updated",
            metadata: body,
          },
        },
      },
      include: { tags: { include: { tag: true } } },
    });
    return NextResponse.json(business);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.business.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
