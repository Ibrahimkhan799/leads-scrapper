import { inlineJobsEnabled } from "@/lib/env";
import { redisReady } from "@/lib/queues";
import { startWorkers } from "@/workers/runtime";

function hang() {
  return new Promise<void>(() => {
    setInterval(() => {}, 60_000);
  });
}

async function main() {
  if (inlineJobsEnabled()) {
    console.log("INLINE_JOBS enabled — skipping queue workers (jobs run in the web app).");
    await hang();
    return;
  }

  const ready = await redisReady();
  if (!ready) {
    console.warn("Redis is not reachable. Start Redis, or set INLINE_JOBS=true (the default).");
    await hang();
    return;
  }

  startWorkers();
  console.log("LeadIntel workers started");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
