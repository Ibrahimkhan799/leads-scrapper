const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const IGNORED_HOSTS = [
  "example.com",
  "email.com",
  "domain.com",
  "sentry.io",
  "wixpress.com",
  "cloudflare.com",
  "schema.org",
  "w3.org",
  "googleapis.com",
  "gstatic.com",
];

const PRIORITY_LOCAL_PARTS = [
  "info",
  "hello",
  "contact",
  "sales",
  "support",
  "booking",
  "bookings",
  "reservations",
  "admin",
  "office",
];

export function extractEmails(html: string): string[] {
  const found = new Set<string>();

  const mailto = html.matchAll(/mailto:([^"'?\s>]+)/gi);
  for (const match of mailto) {
    addEmail(found, decodeURIComponent(match[1] ?? ""));
  }

  const matches = html.match(EMAIL_RE) ?? [];
  for (const match of matches) addEmail(found, match);

  return rankEmails([...found]);
}

function addEmail(set: Set<string>, raw: string) {
  const value = raw.trim().toLowerCase().replace(/[>,;]+$/, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
  if (value.endsWith(".png") || value.endsWith(".jpg") || value.endsWith(".svg")) return;
  const host = value.split("@")[1] ?? "";
  if (IGNORED_HOSTS.some((ignored) => host === ignored || host.endsWith(`.${ignored}`))) {
    return;
  }
  set.add(value);
}

export function rankEmails(emails: string[]): string[] {
  return [...emails].sort((a, b) => scoreEmail(b) - scoreEmail(a));
}

function scoreEmail(email: string): number {
  const local = email.split("@")[0] ?? "";
  const index = PRIORITY_LOCAL_PARTS.indexOf(local);
  if (index >= 0) return 100 - index;
  if (local.includes("info") || local.includes("contact")) return 50;
  return 10;
}
