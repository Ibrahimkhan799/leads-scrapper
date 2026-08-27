import type { SearchProvider, SearchResult } from "@/lib/providers/types";
import { parsePublicHttpUrl } from "@/lib/utils/ssrf";

export class HttpSearchProvider implements SearchProvider {
  id = "search-api";

  constructor(
    private readonly endpoint = process.env.SEARCH_API_URL ?? "",
    private readonly apiKey = process.env.SEARCH_API_KEY ?? ""
  ) {}

  enabled(): boolean {
    return Boolean(this.endpoint && this.apiKey);
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.enabled()) return [];
    const url = parsePublicHttpUrl(this.endpoint);
    url.searchParams.set("q", query);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      throw new Error(`Search API failed (${response.status})`);
    }
    const data = (await response.json()) as {
      results?: Array<{ title?: string; url?: string; link?: string; snippet?: string }>;
    };
    return (data.results ?? [])
      .map((item) => ({
        title: item.title ?? "",
        url: item.url || item.link || "",
        snippet: item.snippet,
      }))
      .filter((item) => item.url);
  }
}
