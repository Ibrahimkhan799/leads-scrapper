export function isSameDomain(a: string, b: string): boolean {
  try {
    const hostA = new URL(a).hostname.replace(/^www\./, "").toLowerCase();
    const hostB = new URL(b).hostname.replace(/^www\./, "").toLowerCase();
    return hostA === hostB;
  } catch {
    return false;
  }
}

export function absolutizeUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export function pathOf(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return "/";
  }
}

export function stripFragment(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}
