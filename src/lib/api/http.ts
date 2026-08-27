import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
  }
  console.error(error);
  return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
}

export function enforceRateLimit(request: Request, limit = 90) {
  const { ok, remaining } = rateLimit(clientIp(request), limit);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "x-ratelimit-remaining": "0" } });
  }
  return remaining;
}
