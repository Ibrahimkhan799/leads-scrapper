import * as cheerio from "cheerio";
import type { SearchProvider, SearchResult } from "@/lib/providers/types";

const USER_AGENT = "LeadIntel/1.0 (local business research)";

export class DuckDuckGoSearchProvider implements SearchProvider {
  id = "duckduckgo";

  async search(query: string): Promise<SearchResult[]> {
    const url = new URL("https://html.duckduckgo.com/html/");
    url.searchParams.set("q", query);
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed (${response.status})`);
    }
    const html = await response.text();
    return parseDuckDuckGoHtml(html);
  }
}

export function parseDuckDuckGoHtml(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  $("a.result__a, a.result-link").each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href") ?? "";
    const resolved = unwrapDuckDuckGoUrl(href);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    const snippet = $(el).closest(".result").find(".result__snippet, .result-snippet").first().text().trim();
    results.push({ title, url: resolved, snippet: snippet || undefined });
  });

  return results.slice(0, 10);
}

export function unwrapDuckDuckGoUrl(href: string): string | null {
  if (!href) return null;
  try {
    const url = href.startsWith("http") ? new URL(href) : new URL(href, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    if (uddg) return uddg;
    if (url.hostname.replace(/^www\./, "") === "duckduckgo.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}
