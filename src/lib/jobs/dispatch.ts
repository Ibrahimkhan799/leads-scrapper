import { enqueue, QUEUE_NAMES, redisReady } from "@/lib/queues";
import { inlineJobsEnabled } from "@/lib/env";
import { processDiscoveryJob, processEnrichmentJob } from "@/lib/pipeline/run";
import type { DiscoverInput } from "@/lib/validation/schemas";

export type DispatchMode = "inline" | "queue";

function runBackground(label: string, work: () => Promise<void>) {
  void work().catch((error) => {
    console.error(`${label} failed`, error);
  });
}

async function shouldRunInline(): Promise<boolean> {
  if (inlineJobsEnabled()) return true;
  const ready = await redisReady();
  if (!ready) {
    console.warn("Redis is not reachable — running this job inline (free local mode). Set INLINE_JOBS=true or start Redis.");
  }
  return !ready;
}

export async function dispatchDiscovery(jobId: string, input: DiscoverInput): Promise<DispatchMode> {
  if (await shouldRunInline()) {
    runBackground("discovery", () => processDiscoveryJob(jobId, input));
    return "inline";
  }
  await enqueue(QUEUE_NAMES.discovery, { jobId, input });
  return "queue";
}

export async function dispatchEnrichment(
  jobId: string,
  businessIds: string[],
  ai = false
): Promise<DispatchMode> {
  if (await shouldRunInline()) {
    runBackground("enrichment", () => processEnrichmentJob(jobId, businessIds, ai));
    return "inline";
  }
  await enqueue(QUEUE_NAMES.enrichment, { jobId, businessIds, ai });
  return "queue";
}
