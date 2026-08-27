import type { CrawlOptions, CrawlResult, WebsiteCrawler } from "@/lib/providers/types";
import { CheerioCrawler } from "@/lib/scraping/cheerio-crawler";
import { assertSafeUrl } from "@/lib/utils/ssrf";
import { isTruthy } from "@/lib/env";

export class PlaywrightCrawler implements WebsiteCrawler {
  private fallback = new CheerioCrawler();

  async crawl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    if (!isTruthy(process.env.PLAYWRIGHT_ENABLED)) {
      return this.fallback.crawl(url, options);
    }

    await assertSafeUrl(url);

    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();
        const timeout = options.timeoutMs ?? 15_000;
        const started = Date.now();
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout });
        const html = await page.content();
        const title = await page.title();
        return {
          url,
          domain: new URL(url).hostname,
          status: "SUCCESS",
          pages: [
            {
              url,
              path: new URL(url).pathname,
              title,
              html,
              httpStatus: response?.status() ?? 0,
              loadTimeMs: Date.now() - started,
            },
          ],
        };
      } finally {
        await browser.close();
      }
    } catch {
      return this.fallback.crawl(url, options);
    }
  }
}

export function createCrawler(): WebsiteCrawler {
  return isTruthy(process.env.PLAYWRIGHT_ENABLED)
    ? new PlaywrightCrawler()
    : new CheerioCrawler();
}
