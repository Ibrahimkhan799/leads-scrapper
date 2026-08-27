import { assertSafeUrl } from "@/lib/utils/ssrf";

export async function isAllowedByRobots(targetUrl: string, userAgent = "LeadIntelBot"): Promise<boolean> {
  try {
    const url = new URL(targetUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    await assertSafeUrl(robotsUrl);
    const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return true;
    const body = await response.text();
    return !disallows(body, url.pathname, userAgent);
  } catch {
    return true;
  }
}

export function disallows(robotsTxt: string, path: string, userAgent: string): boolean {
  const lines = robotsTxt.split(/\r?\n/);
  let applies = false;
  let disallowed = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(key)) {
      applies = value === "*" || value.toLowerCase().includes(userAgent.toLowerCase());
    } else if (applies && /^disallow$/i.test(key)) {
      if (value && path.startsWith(value)) disallowed = true;
    }
  }
  return disallowed;
}
