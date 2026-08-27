import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bulkStatusSchema } from "@/lib/validation/schemas";
import { handleError } from "@/lib/api/http";

export async function POST(request: NextRequest) {
  try {
    const body = bulkStatusSchema.parse(await request.json());
    await prisma.business.updateMany({
      where: { id: { in: body.ids } },
      data: { contactStatus: body.contactStatus },
    });
    await prisma.leadActivity.createMany({
      data: body.ids.map((businessId) => ({
        businessId,
        type: "status",
        message: `Status set to ${body.contactStatus}`,
      })),
    });
    return NextResponse.json({ updated: body.ids.length });
  } catch (error) {
    return handleError(error);
  }
}
