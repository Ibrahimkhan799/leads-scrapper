const buckets = new Map<string, { tokens: number; updatedAt: number }>();

export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const current = buckets.get(key) ?? { tokens: limit, updatedAt: now };
  const elapsed = now - current.updatedAt;
  const refill = (elapsed / windowMs) * limit;
  current.tokens = Math.min(limit, current.tokens + refill);
  current.updatedAt = now;
  if (current.tokens < 1) {
    buckets.set(key, current);
    return { ok: false, remaining: 0 };
  }
  current.tokens -= 1;
  buckets.set(key, current);
  return { ok: true, remaining: Math.floor(current.tokens) };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
