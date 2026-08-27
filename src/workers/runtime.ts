import { Worker } from "bullmq";
import { getRedis, QUEUE_NAMES } from "@/lib/queues";
import { processDiscoveryJob, processEnrichmentJob } from "@/lib/pipeline/run";
import { enrichBusiness } from "@/lib/pipeline/enrich";
import { analyzeBusinessWithAI, rescoreBusiness } from "@/lib/pipeline/score";
import { failJob, logJob } from "@/lib/jobs/service";
import type { DiscoverInput } from "@/lib/validation/schemas";

function handle(queue: string, processor: (data: Record<string, unknown>) => Promise<void>) {
  return new Worker(
    queue,
    async (job) => {
      try {
        await processor(job.data as Record<string, unknown>);
      } catch (error) {
        const jobId = String((job.data as { jobId?: string }).jobId ?? "");
        if (jobId) {
          await failJob(jobId, error instanceof Error ? error.message : "Worker failed");
        }
        throw error;
      }
    },
    { connection: getRedis(), concurrency: queue === QUEUE_NAMES.discovery ? 1 : 3 }
  );
}

export function startWorkers() {
  const workers = [
    handle(QUEUE_NAMES.discovery, async (data) => {
      await processDiscoveryJob(String(data.jobId), data.input as DiscoverInput);
    }),
    handle(QUEUE_NAMES.enrichment, async (data) => {
      await processEnrichmentJob(String(data.jobId), data.businessIds as string[], Boolean(data.ai));
    }),
    handle(QUEUE_NAMES.websiteCrawl, async (data) => {
      await enrichBusiness(String(data.businessId));
    }),
    handle(QUEUE_NAMES.websiteAnalysis, async (data) => {
      await enrichBusiness(String(data.businessId), { websiteAnalysis: true });
    }),
    handle(QUEUE_NAMES.leadScoring, async (data) => {
      await rescoreBusiness(String(data.businessId));
    }),
    handle(QUEUE_NAMES.aiAnalysis, async (data) => {
      try {
        await analyzeBusinessWithAI(String(data.businessId));
      } catch (error) {
        if (data.jobId) {
          await logJob(String(data.jobId), "warn", error instanceof Error ? error.message : "AI failed");
        }
      }
    }),
  ];

  for (const worker of workers) {
    worker.on("failed", (job, err) => {
      console.error(`[worker] ${job?.queueName} ${job?.id} failed`, err);
    });
  }

  return workers;
}
