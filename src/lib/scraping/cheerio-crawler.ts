import * as cheerio from "cheerio";
import type { CrawlOptions, CrawlPageResult, CrawlResult, WebsiteCrawler } from "@/lib/providers/types";
import { assertSafeUrl, safeFetch, UnsafeUrlError } from "@/lib/utils/ssrf";
import { absolutizeUrl, isSameDomain, pathOf, stripFragment } from "@/lib/utils/url";
import { normalizeDomain } from "@/lib/utils/normalize";
import { releaseDomain, waitForDomain } from "@/lib/scraping/domain-limit";

const DEFAULT_PATHS = [
  "/",
  "/about",
  "/about-us",
  "/contact",
  "/contact-us",
  "/services",
  "/pricing",
  "/book",
  "/booking",
  "/location",
  "/locations",
  "/team",
];

export class CheerioCrawler implements WebsiteCrawler {
  async crawl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const maxPages = options.maxPages ?? 10;
    const maxDepth = options.maxDepth ?? 2;
    const timeoutMs = options.timeoutMs ?? 15_000;
    const delayMs = options.delayMs ?? 1_000;

    let start: URL;
    try {
      start = await assertSafeUrl(url);
    } catch (error) {
      return {
        url,
        domain: normalizeDomain(url) ?? "",
        status: "ERROR",
        pages: [],
        error: error instanceof UnsafeUrlError ? error.message : "Invalid URL",
      };
    }

    const domain = normalizeDomain(start.toString()) ?? start.hostname;
    const queue: Array<{ href: string; depth: number }> = [{ href: start.toString(), depth: 0 }];
    const seen = new Set<string>();
    const pages: CrawlPageResult[] = [];

    for (const path of DEFAULT_PATHS) {
      try {
        queue.push({ href: new URL(path, start).toString(), depth: 1 });
      } catch {
        // ignore
      }
    }

    while (queue.length && pages.length < maxPages) {
      const next = queue.shift();
      if (!next) break;
      const href = stripFragment(next.href);
      if (seen.has(href)) continue;
      seen.add(href);
      if (!isSameDomain(href, start.toString())) continue;

      const started = Date.now();
      try {
        await waitForDomain(start.hostname, delayMs, 3);
        const response = await fetchWithRetry(href, timeoutMs, 3);
        releaseDomain(start.hostname);
        const loadTimeMs = Date.now() - started;
        const status = response.status;

        if (status === 403 || status === 429) {
          return {
            url: start.toString(),
            domain,
            status: "BLOCKED",
            pages,
            error: `Blocked with HTTP ${status}`,
          };
        }

        const contentType = response.headers.get("content-type") ?? "";
        const html = contentType.includes("html") ? await response.text() : "";
        pages.push({
          url: href,
          path: pathOf(href),
          title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim(),
          html,
          httpStatus: status,
          loadTimeMs,
        });

        if (html && next.depth < maxDepth) {
          const $ = cheerio.load(html);
          $("a[href]").each((_, el) => {
            const abs = absolutizeUrl($(el).attr("href") || "", href);
            if (abs && isSameDomain(abs, start.toString())) {
              queue.push({ href: stripFragment(abs), depth: next.depth + 1 });
            }
          });
        }
      } catch (error) {
        releaseDomain(start.hostname);
        const message = error instanceof Error ? error.message : "Crawl failed";
        if (message.toLowerCase().includes("timeout") || message.includes("AbortError")) {
          if (pages.length === 0) {
            return { url: start.toString(), domain, status: "TIMEOUT", pages, error: message };
          }
          continue;
        }
        if (pages.length === 0) {
          return { url: start.toString(), domain, status: "UNAVAILABLE", pages, error: message };
        }
      }
    }

    return {
      url: start.toString(),
      domain,
      status: pages.length ? "SUCCESS" : "UNAVAILABLE",
      pages,
    };
  }
}

async function fetchWithRetry(url: string, timeoutMs: number, maxRetries: number): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await safeFetch(url, { timeoutMs, redirect: "follow" });
      if (response.status >= 500 && attempt < maxRetries - 1) {
        await backoff(attempt);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (error instanceof UnsafeUrlError) throw error;
      await backoff(attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

function backoff(attempt: number) {
  const ms = Math.min(8_000, 500 * 2 ** attempt);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
