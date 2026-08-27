export interface BookingMatch {
  provider: string;
  url: string;
}

const BOOKING_PROVIDERS: Array<{ provider: string; test: RegExp }> = [
  { provider: "opentable", test: /opentable\.com/i },
  { provider: "resy", test: /resy\.com/i },
  { provider: "tock", test: /exploretock\.com/i },
  { provider: "sevenrooms", test: /sevenrooms\.com/i },
  { provider: "calendly", test: /calendly\.com/i },
  { provider: "cal.com", test: /cal\.com/i },
  { provider: "mindbody", test: /mindbodyonline\.com/i },
  { provider: "booksy", test: /booksy\.com/i },
  { provider: "fresha", test: /fresha\.com/i },
  { provider: "treatwell", test: /treatwell\./i },
  { provider: "square", test: /squareup\.com|square\.site/i },
  { provider: "simplybook", test: /simplybook\.(me|io)/i },
  { provider: "setmore", test: /setmore\.com/i },
  { provider: "acuity", test: /acuityscheduling\.com/i },
  { provider: "thefork", test: /thefork\./i },
  { provider: "yelp-reservations", test: /yelp\.com\/reservations/i },
  { provider: "google-reserve", test: /reserve with google|google.com\/maps\/reserve/i },
];

const PATH_HINTS = /(\/book|\/booking|\/reserve|\/reservation|\/appointments?|\/schedule)/i;

export function extractBooking(html: string, pageUrl?: string): BookingMatch[] {
  const found: BookingMatch[] = [];
  const seen = new Set<string>();

  const urls: string[] = [...(html.match(/https?:\/\/[^\s"'<>]+/gi) ?? [])];
  if (pageUrl) urls.push(pageUrl);

  for (const raw of urls) {
    const url = raw.replace(/[),.;]+$/, "");
    for (const rule of BOOKING_PROVIDERS) {
      if (!rule.test.test(url)) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      found.push({ provider: rule.provider, url });
    }
  }

  if (PATH_HINTS.test(html) || (pageUrl && PATH_HINTS.test(pageUrl))) {
    const bookLinks = html.matchAll(/href=["']([^"']*(?:book|reserv|appoint)[^"']*)["']/gi);
    for (const match of bookLinks) {
      const href = match[1] ?? "";
      let url = href;
      if (pageUrl && !href.startsWith("http")) {
        try {
          url = new URL(href, pageUrl).toString();
        } catch {
          continue;
        }
      }
      if (!url.startsWith("http") || seen.has(url)) continue;
      seen.add(url);
      found.push({ provider: "custom", url });
    }
  }

  return found;
}

export function looksLikeOnlineBooking(html: string, pageUrl?: string): boolean {
  return extractBooking(html, pageUrl).length > 0;
}
