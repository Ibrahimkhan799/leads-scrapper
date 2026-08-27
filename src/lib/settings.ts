import { prisma } from "@/lib/db/prisma";
import { DEFAULT_SCORING_PROFILE, type ScoringProfile } from "@/lib/scoring/rules";

export interface AppSettings {
  discovery: {
    provider: "mock" | "google-places" | "auto";
    maxResults: number;
    queryExpansion: boolean;
    maxQueries: number;
  };
  scraping: {
    concurrency: number;
    delayMs: number;
    timeoutMs: number;
    maxPages: number;
    maxDepth: number;
    retries: number;
  };
  scoring: ScoringProfile;
  ai: {
    enabled: boolean;
    provider: string;
    model: string;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  discovery: {
    provider: "auto",
    maxResults: 200,
    queryExpansion: true,
    maxQueries: 8,
  },
  scraping: {
    concurrency: 3,
    delayMs: 1000,
    timeoutMs: 15000,
    maxPages: 10,
    maxDepth: 2,
    retries: 3,
  },
  scoring: DEFAULT_SCORING_PROFILE,
  ai: {
    enabled: false,
    provider: "mock",
    model: "gpt-4o-mini",
  },
};

export async function getSettings(): Promise<AppSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: "app" } });
  if (!row) return DEFAULT_SETTINGS;
  return deepMerge(DEFAULT_SETTINGS, row.value as Partial<AppSettings>);
}

export async function saveSettings(value: AppSettings): Promise<AppSettings> {
  await prisma.appSetting.upsert({
    where: { key: "app" },
    update: { value: value as object },
    create: { key: "app", value: value as object },
  });
  return value;
}

export function publicSettings(settings: AppSettings) {
  return {
    discovery: settings.discovery,
    scraping: settings.scraping,
    scoring: settings.scoring,
    ai: {
      enabled: settings.ai.enabled,
      provider: settings.ai.provider,
      model: settings.ai.model,
    },
  };
}

function deepMerge<T>(base: T, override: Partial<T>): T {
  const output = { ...base };
  for (const [key, value] of Object.entries(override as object)) {
    const current = (output as Record<string, unknown>)[key];
    if (value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object") {
      (output as Record<string, unknown>)[key] = deepMerge(current, value as never);
    } else if (value !== undefined) {
      (output as Record<string, unknown>)[key] = value;
    }
  }
  return output;
}
