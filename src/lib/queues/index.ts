import { Queue, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

export const QUEUE_NAMES = {
  discovery: "discovery",
  deduplication: "deduplication",
  websiteDiscovery: "website-discovery",
  websiteCrawl: "website-crawl",
  contactExtraction: "contact-extraction",
  socialDiscovery: "social-discovery",
  websiteAnalysis: "website-analysis",
  aiAnalysis: "ai-analysis",
  leadScoring: "lead-scoring",
  enrichment: "enrichment-pipeline",
} as const;

let connection: IORedis | null = null;
const queues = new Map<string, Queue>();

function redisUrl() {
  return process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
}

export function getRedis(): IORedis {
  if (!connection) {
    connection = new IORedis(redisUrl(), {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return connection;
}

export async function redisReady(timeoutMs = 1500): Promise<boolean> {
  const probe = new IORedis(redisUrl(), {
    maxRetriesPerRequest: 1,
    connectTimeout: timeoutMs,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  try {
    const result = await Promise.race([
      probe.connect().then(() => probe.ping()),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("redis probe timeout")), timeoutMs);
      }),
    ]);
    return result === "PONG";
  } catch {
    return false;
  } finally {
    probe.disconnect();
  }
}

export function getQueue(name: string): Queue {
  const existing = queues.get(name);
  if (existing) return existing;
  const queue = new Queue(name, { connection: getRedis() });
  queues.set(name, queue);
  return queue;
}

export async function enqueue<T extends Record<string, unknown>>(
  name: string,
  payload: T,
  options?: JobsOptions
) {
  return getQueue(name).add(name, payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 200,
    ...options,
  });
}
