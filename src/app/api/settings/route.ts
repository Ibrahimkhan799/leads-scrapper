import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, publicSettings, saveSettings, type AppSettings } from "@/lib/settings";
import { handleError } from "@/lib/api/http";

const settingsSchema = z.object({
  discovery: z.object({
    provider: z.enum(["mock", "google-places", "auto"]),
    maxResults: z.number().int().min(1).max(500),
    queryExpansion: z.boolean(),
    maxQueries: z.number().int().min(1).max(20),
  }),
  scraping: z.object({
    concurrency: z.number().int().min(1).max(10),
    delayMs: z.number().int().min(0).max(10000),
    timeoutMs: z.number().int().min(1000).max(60000),
    maxPages: z.number().int().min(1).max(30),
    maxDepth: z.number().int().min(1).max(4),
    retries: z.number().int().min(0).max(5),
  }),
  scoring: z.object({
    id: z.string(),
    name: z.string(),
    rules: z.array(z.any()),
  }),
  ai: z.object({
    enabled: z.boolean(),
    provider: z.string(),
    model: z.string(),
  }),
});

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(publicSettings(settings));
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = settingsSchema.parse(await request.json());
    const saved = await saveSettings(body as AppSettings);
    return NextResponse.json(publicSettings(saved));
  } catch (error) {
    return handleError(error);
  }
}
