import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { leadsQuerySchema } from "@/lib/validation/schemas";
import { buildLeadWhere } from "@/lib/leads/query";
import { leadsToCsv } from "@/lib/export/csv";
import { handleError } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  try {
    const parsed = leadsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const where = buildLeadWhere(parsed);
    const leads = await prisma.business.findMany({
      where,
      orderBy: { leadScore: "desc" },
      take: 5000,
    });
    const csv = leadsToCsv(leads);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-export.csv"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
