export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "twitter";

export interface SocialMatch {
  platform: SocialPlatform;
  url: string;
  handle?: string;
}

const SOCIAL_RULES: Array<{
  platform: SocialPlatform;
  host: RegExp;
  handle?: (pathname: string) => string | undefined;
}> = [
  {
    platform: "instagram",
    host: /(^|\.)instagram\.com$/i,
    handle: (path) => path.split("/").filter(Boolean)[0],
  },
  {
    platform: "facebook",
    host: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/i,
    handle: (path) => path.split("/").filter(Boolean)[0],
  },
  {
    platform: "tiktok",
    host: /(^|\.)tiktok\.com$/i,
    handle: (path) => path.split("/").filter(Boolean)[0]?.replace(/^@/, ""),
  },
  {
    platform: "youtube",
    host: /(^|\.)(youtube\.com|youtu\.be)$/i,
    handle: (path) => path.split("/").filter(Boolean)[0]?.replace(/^@/, ""),
  },
  {
    platform: "linkedin",
    host: /(^|\.)linkedin\.com$/i,
    handle: (path) => path.replace(/^\/+/, ""),
  },
  {
    platform: "twitter",
    host: /(^|\.)(twitter\.com|x\.com)$/i,
    handle: (path) => path.split("/").filter(Boolean)[0],
  },
];

const IGNORE_PATHS = new Set([
  "share",
  "intent",
  "sharer",
  "login",
  "signup",
  "privacy",
  "help",
  "about",
  "reel",
  "p",
  "watch",
  "embed",
]);

export function extractSocialProfiles(html: string, baseUrl?: string): SocialMatch[] {
  const hrefs = new Set<string>();
  const matches = html.matchAll(/https?:\/\/[^\s"'<>]+/gi);
  for (const match of matches) hrefs.add(match[0].replace(/[),.;]+$/, ""));

  const relative = html.matchAll(/href=["']([^"']+)["']/gi);
  for (const match of relative) {
    const href = match[1] ?? "";
    if (href.startsWith("http")) hrefs.add(href);
    else if (baseUrl) {
      try {
        hrefs.add(new URL(href, baseUrl).toString());
      } catch {
        // ignore
      }
    }
  }

  const results: SocialMatch[] = [];
  const seen = new Set<string>();

  for (const href of hrefs) {
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      continue;
    }
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    for (const rule of SOCIAL_RULES) {
      if (!rule.host.test(host)) continue;
      const handle = rule.handle?.(url.pathname);
      if (handle && IGNORE_PATHS.has(handle.toLowerCase())) continue;
      const key = `${rule.platform}:${url.origin}${url.pathname.replace(/\/$/, "")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        platform: rule.platform,
        url: `${url.origin}${url.pathname}`,
        handle: handle?.replace(/^@/, "") || undefined,
      });
    }
  }

  return results;
}
