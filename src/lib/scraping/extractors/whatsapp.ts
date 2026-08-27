import { normalizePhone } from "@/lib/utils/normalize";

const WA_PATTERNS = [
  /https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send)\S+/gi,
  /(?:wa\.me|api\.whatsapp\.com\/send)\/?\??[^\s"'<>]*/gi,
];

export function extractWhatsApp(html: string, defaultCountry?: string | null): string[] {
  const found = new Set<string>();

  for (const pattern of WA_PATTERNS) {
    const matches = html.match(pattern) ?? [];
    for (const match of matches) {
      const parsed = parseWhatsAppTarget(match, defaultCountry);
      if (parsed) found.add(parsed);
    }
  }

  if (/whatsapp/i.test(html)) {
    const dataPhones = html.matchAll(/data-(?:whatsapp|wa)(?:-number|-phone)?=["']([^"']+)/gi);
    for (const match of dataPhones) {
      const parsed = parseWhatsAppTarget(match[1] ?? "", defaultCountry);
      if (parsed) found.add(parsed);
    }
  }

  return [...found];
}

export function parseWhatsAppTarget(
  raw: string,
  defaultCountry?: string | null
): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const url = value.includes("://") ? new URL(value) : new URL(`https://${value.replace(/^\/+/, "")}`);
    const phoneParam = url.searchParams.get("phone");
    if (phoneParam) {
      const prepared = phoneParam.startsWith("+") ? phoneParam : `+${phoneParam.replace(/\D/g, "")}`;
      return normalizePhone(prepared, defaultCountry);
    }
    if (url.hostname.replace(/^www\./, "") === "wa.me") {
      const pathPhone = url.pathname.replace(/\//g, "");
      const prepared = pathPhone.startsWith("+") ? pathPhone : `+${pathPhone.replace(/\D/g, "")}`;
      return normalizePhone(prepared, defaultCountry);
    }
  } catch {
    // fall through
  }

  const digits = value.match(/\+?\d{8,15}/)?.[0];
  return digits ? normalizePhone(digits, defaultCountry) : null;
}
