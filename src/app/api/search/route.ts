import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleError } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ items: [] });
    const items = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { businessType: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { websiteUrl: { contains: q, mode: "insensitive" } },
          { instagram: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 12,
      orderBy: { leadScore: "desc" },
      select: {
        id: true,
        name: true,
        businessType: true,
        city: true,
        country: true,
        leadScore: true,
        leadCategory: true,
      },
    });
    return NextResponse.json({ items });
  } catch (error) {
    return handleError(error);
  }
}
