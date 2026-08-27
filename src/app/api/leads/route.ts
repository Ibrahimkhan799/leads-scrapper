import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { leadsQuerySchema } from "@/lib/validation/schemas";
import { buildLeadOrder, buildLeadWhere } from "@/lib/leads/query";
import { enforceRateLimit, handleError } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request);
    if (limited instanceof NextResponse) return limited;

    const parsed = leadsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const page = Math.max(1, Number(parsed.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(parsed.pageSize ?? 25)));
    const where = buildLeadWhere(parsed);
    const orderBy = buildLeadOrder(parsed);

    const [items, total] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { tags: { include: { tag: true } } },
      }),
      prisma.business.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleError(error);
  }
}
