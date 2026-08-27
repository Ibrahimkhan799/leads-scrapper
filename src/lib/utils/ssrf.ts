import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".corp",
  ".home",
  ".lan",
];

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function isPrivateOrReservedIp(ip: string): boolean {
  try {
    const parsed = ipaddr.parse(ip);
    const range = parsed.range();
    return (
      range === "loopback" ||
      range === "private" ||
      range === "linkLocal" ||
      range === "uniqueLocal" ||
      range === "carrierGradeNat" ||
      range === "broadcast" ||
      range === "unspecified" ||
      range === "reserved" ||
      range === "multicast" ||
      ip === "169.254.169.254" ||
      ip === "0.0.0.0" ||
      ip === "::" ||
      ip === "::1"
    );
  } catch {
    return true;
  }
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (host === "169.254.169.254") return true;
  if (ipaddr.isValid(host) && isPrivateOrReservedIp(host)) return true;
  return false;
}

export function parsePublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Malformed URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with credentials are not allowed");
  }
  if (isBlockedHostname(url.hostname)) {
    throw new UnsafeUrlError("URL hostname is not allowed");
  }
  return url;
}

export async function assertSafeUrl(raw: string): Promise<URL> {
  const url = parsePublicHttpUrl(raw);
  const { address } = await lookup(url.hostname, { all: false });
  if (isPrivateOrReservedIp(address)) {
    throw new UnsafeUrlError("Resolved IP is not allowed");
  }
  return url;
}

export async function safeFetch(
  raw: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const url = await assertSafeUrl(raw);
  const timeoutMs = init.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: init.redirect ?? "manual",
      headers: {
        "User-Agent": "LeadIntelBot/1.0 (+https://localhost; public business research)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}
