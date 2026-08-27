import { MockDiscoveryProvider } from "@/lib/providers/discovery/mock";
import { GooglePlacesDiscoveryProvider } from "@/lib/providers/discovery/google-places";
import { OpenStreetMapDiscoveryProvider } from "@/lib/providers/discovery/openstreetmap";
import { MockSearchProvider } from "@/lib/providers/search/mock";
import { HttpSearchProvider } from "@/lib/providers/search/http";
import { DuckDuckGoSearchProvider } from "@/lib/providers/search/duckduckgo";
import { SearchWebsiteDiscoveryProvider } from "@/lib/providers/website-discovery";
import { CheerioCrawler } from "@/lib/scraping/cheerio-crawler";
import { PlaywrightCrawler } from "@/lib/scraping/crawler";
import { MockAIProvider, OpenAIProvider } from "@/lib/ai/provider";
import { mockProvidersEnabled } from "@/lib/env";
import type { BusinessDiscoveryProvider, SearchProvider, WebsiteCrawler } from "@/lib/providers/types";

export function createDiscoveryProviders(): BusinessDiscoveryProvider[] {
  if (mockProvidersEnabled()) return [new MockDiscoveryProvider()];
  const google = new GooglePlacesDiscoveryProvider();
  const osm = new OpenStreetMapDiscoveryProvider();
  return google.enabled() ? [osm, google] : [osm];
}

export function createSearchProvider(): SearchProvider {
  const http = new HttpSearchProvider();
  if (http.enabled()) return http;
  if (!mockProvidersEnabled()) return new DuckDuckGoSearchProvider();
  return new MockSearchProvider();
}

export function createWebsiteCrawler(): WebsiteCrawler {
  return process.env.PLAYWRIGHT_ENABLED === "true" ? new PlaywrightCrawler() : new CheerioCrawler();
}

export function createWebsiteDiscovery() {
  return new SearchWebsiteDiscoveryProvider(createSearchProvider());
}

export { MockAIProvider, OpenAIProvider };
