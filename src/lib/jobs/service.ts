import { JobType, JobStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function createJob(type: JobType, input: unknown, parentJobId?: string) {
  return prisma.scrapingJob.create({
    data: {
      type,
      status: "QUEUED",
      input: input as Prisma.InputJsonValue,
      parentJobId,
    },
  });
}

export async function startJob(id: string, total = 0) {
  return prisma.scrapingJob.update({
    where: { id },
    data: { status: "RUNNING", startedAt: new Date(), total, progress: 0 },
  });
}

export async function updateJobProgress(
  id: string,
  data: {
    processed?: number;
    failed?: number;
    total?: number;
    result?: Prisma.InputJsonValue;
  }
) {
  const job = await prisma.scrapingJob.findUnique({ where: { id } });
  if (!job) return;
  const processed = data.processed ?? job.processed;
  const total = data.total ?? job.total;
  const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : job.progress;
  return prisma.scrapingJob.update({
    where: { id },
    data: {
      processed,
      failed: data.failed ?? job.failed,
      total,
      progress,
      result: data.result ?? job.result ?? undefined,
    },
  });
}

export async function completeJob(id: string, result?: Prisma.InputJsonValue) {
  return prisma.scrapingJob.update({
    where: { id },
    data: {
      status: "COMPLETED",
      progress: 100,
      completedAt: new Date(),
      result,
    },
  });
}

export async function failJob(id: string, error: string) {
  return prisma.scrapingJob.update({
    where: { id },
    data: { status: "FAILED", error, completedAt: new Date() },
  });
}

export async function cancelJob(id: string) {
  const job = await prisma.scrapingJob.findUnique({ where: { id } });
  if (!job) throw new Error("Job not found");
  if (job.status === "COMPLETED") throw new Error("Completed jobs cannot be cancelled");
  return prisma.scrapingJob.update({
    where: { id },
    data: { status: "CANCELLED", completedAt: new Date() },
  });
}

export async function logJob(
  jobId: string,
  level: "info" | "warn" | "error",
  message: string,
  meta?: Prisma.InputJsonValue
) {
  await prisma.scrapingJobLog.create({
    data: { jobId, level, message, meta },
  });
}

export function isCancelled(status: JobStatus) {
  return status === "CANCELLED";
}
