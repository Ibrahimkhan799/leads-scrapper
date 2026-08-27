import { NextResponse } from "next/server";
import { SEARCH_TEMPLATES } from "@/lib/countries";

export async function GET() {
  return NextResponse.json({ items: SEARCH_TEMPLATES });
}
