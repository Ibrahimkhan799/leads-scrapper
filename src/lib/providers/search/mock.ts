import type { SearchProvider, SearchResult } from "@/lib/providers/types";

export class MockSearchProvider implements SearchProvider {
  id = "mock-search";

  async search(query: string): Promise<SearchResult[]> {
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";
    return [
      {
        title: `${query} | Official site`,
        url: `https://${slug.slice(0, 24)}.example`,
        snippet: `Official website for ${query}`,
      },
      {
        title: `${query} | Instagram`,
        url: `https://instagram.com/${slug.slice(0, 18)}`,
        snippet: "Social profile",
      },
      {
        title: `${query} | Directory listing`,
        url: `https://directories.example/${slug}`,
        snippet: "Business directory",
      },
    ];
  }
}
