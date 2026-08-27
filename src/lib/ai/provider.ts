import { z } from "zod";
import type { AIAnalysisInput, AIAnalysisResult, AIProvider } from "@/lib/providers/types";

export const aiResultSchema = z.object({
  classification: z.string(),
  websiteQualityInterpretation: z.string(),
  opportunity: z.string(),
  websiteWeaknessSummary: z.string(),
  salesInsight: z.object({
    opportunity: z.string(),
    websiteProblems: z.array(z.string()),
    recommendedService: z.string(),
    pitchAngle: z.string(),
  }),
});

export class MockAIProvider implements AIProvider {
  async analyze(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const problems: string[] = [];
    if (!input.hasWebsite) problems.push("No website");
    if (input.websiteQuality === "POOR" || input.websiteQuality === "OUTDATED") {
      problems.push("Website quality is below local competitors");
    }
    const audit = input.auditSummary ?? {};
    if (audit.hasBookingCta === false) problems.push("No online booking");
    if (audit.mobileViewport === false) problems.push("Poor mobile layout");
    if (audit.hasPricing === false) problems.push("Missing pricing information");

    const location = [input.city, input.country].filter(Boolean).join(", ");
    const opportunity = input.hasWebsite
      ? `Strong local presence${input.reviewCount ? ` with ${input.reviewCount}+ reviews` : ""} but the website underperforms.`
      : `Strong local demand signals but no website to convert search and social traffic.`;

    return aiResultSchema.parse({
      classification: input.businessType,
      websiteQualityInterpretation: input.hasWebsite
        ? `${input.websiteQuality ?? "UNKNOWN"} website for a ${input.businessType.toLowerCase()} in ${location || "this market"}.`
        : "No website detected.",
      opportunity,
      websiteWeaknessSummary: problems.join("; ") || "Limited conversion paths.",
      salesInsight: {
        opportunity,
        websiteProblems: problems.length ? problems : ["Weak conversion paths"],
        recommendedService: input.hasWebsite ? "Website redesign" : "New website build",
        pitchAngle: `Focus on converting Google and Instagram traffic into ${input.businessType.toLowerCase()} bookings.`,
      },
    });
  }
}

export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY ?? "",
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-4o-mini"
  ) {}

  async analyze(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      return new MockAIProvider().analyze(input);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a B2B sales analyst for a web design and digital marketing agency. Return only JSON matching the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              schema: {
                classification: "string",
                websiteQualityInterpretation: "string",
                opportunity: "string",
                websiteWeaknessSummary: "string",
                salesInsight: {
                  opportunity: "string",
                  websiteProblems: ["string"],
                  recommendedService: "string",
                  pitchAngle: "string",
                },
              },
              input,
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      return new MockAIProvider().analyze(input);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return new MockAIProvider().analyze(input);
    try {
      return aiResultSchema.parse(JSON.parse(content));
    } catch {
      return new MockAIProvider().analyze(input);
    }
  }
}

export function createAIProvider(): AIProvider {
  if ((process.env.AI_PROVIDER ?? "mock") === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }
  return new MockAIProvider();
}
