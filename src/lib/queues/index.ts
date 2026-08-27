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

export function getRedis(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
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
