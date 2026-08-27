const lastHit = new Map<string, number>();
const inflight = new Map<string, number>();

export async function waitForDomain(
  hostname: string,
  delayMs: number,
  maxConcurrent: number
) {
  while ((inflight.get(hostname) ?? 0) >= maxConcurrent) {
    await sleep(50);
  }
  inflight.set(hostname, (inflight.get(hostname) ?? 0) + 1);
  const last = lastHit.get(hostname) ?? 0;
  const wait = delayMs - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  lastHit.set(hostname, Date.now());
}

export function releaseDomain(hostname: string) {
  inflight.set(hostname, Math.max(0, (inflight.get(hostname) ?? 1) - 1));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
