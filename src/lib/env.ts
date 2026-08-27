import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  APP_SECRET: z.string().min(8).default("dev-secret-change-in-production-leadintel-2026"),
  USE_MOCK_PROVIDERS: z.string().default("false"),
  INLINE_JOBS: z.string().default("false"),
  GOOGLE_PLACES_API_KEY: z.string().optional().default(""),
  SEARCH_API_KEY: z.string().optional().default(""),
  SEARCH_API_URL: z.string().optional().default(""),
  APIFY_TOKEN: z.string().optional().default(""),
  OUTSCRAPER_API_KEY: z.string().optional().default(""),
  AI_ENABLED: z.string().default("false"),
  AI_PROVIDER: z.string().default("mock"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  PLAYWRIGHT_ENABLED: z.string().default("false"),
  CRAWL_MAX_PAGES: z.string().default("10"),
  CRAWL_MAX_DEPTH: z.string().default("2"),
  CRAWL_TIMEOUT_MS: z.string().default("15000"),
  CRAWL_DELAY_MS: z.string().default("1000"),
  CRAWL_MAX_CONCURRENT: z.string().default("3"),
  CRAWL_MAX_RETRIES: z.string().default("3"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    APP_SECRET: process.env.APP_SECRET,
    USE_MOCK_PROVIDERS: process.env.USE_MOCK_PROVIDERS,
    INLINE_JOBS: process.env.INLINE_JOBS,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    SEARCH_API_KEY: process.env.SEARCH_API_KEY,
    SEARCH_API_URL: process.env.SEARCH_API_URL,
    APIFY_TOKEN: process.env.APIFY_TOKEN,
    OUTSCRAPER_API_KEY: process.env.OUTSCRAPER_API_KEY,
    AI_ENABLED: process.env.AI_ENABLED,
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    PLAYWRIGHT_ENABLED: process.env.PLAYWRIGHT_ENABLED,
    CRAWL_MAX_PAGES: process.env.CRAWL_MAX_PAGES,
    CRAWL_MAX_DEPTH: process.env.CRAWL_MAX_DEPTH,
    CRAWL_TIMEOUT_MS: process.env.CRAWL_TIMEOUT_MS,
    CRAWL_DELAY_MS: process.env.CRAWL_DELAY_MS,
    CRAWL_MAX_CONCURRENT: process.env.CRAWL_MAX_CONCURRENT,
    CRAWL_MAX_RETRIES: process.env.CRAWL_MAX_RETRIES,
  });
}

export function mockProvidersEnabled(): boolean {
  const flag = (process.env.USE_MOCK_PROVIDERS ?? "false").toLowerCase();
  return ["1", "true", "yes", "on"].includes(flag);
}

export function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
