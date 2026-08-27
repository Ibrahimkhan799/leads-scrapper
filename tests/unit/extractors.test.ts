import { describe, expect, it } from "vitest";
import { extractEmails } from "@/lib/scraping/extractors/email";
import { extractPhones } from "@/lib/scraping/extractors/phone";
import { extractWhatsApp, parseWhatsAppTarget } from "@/lib/scraping/extractors/whatsapp";
import { extractSocialProfiles } from "@/lib/scraping/extractors/social";
import { extractBooking } from "@/lib/scraping/extractors/booking";

const html = `
  <a href="mailto:info@harbor.gym">info@harbor.gym</a>
  <a href="tel:+971501112233">call</a>
  <a href="https://wa.me/971501112233">WhatsApp</a>
  <a href="https://instagram.com/harborgym">IG</a>
  <a href="https://facebook.com/harborgym">FB</a>
  <a href="https://calendly.com/harbor/book">Book</a>
  Contact support@harbor.gym
`;

describe("contact extraction", () => {
  it("extracts emails including mailto", () => {
    expect(extractEmails(html)).toContain("info@harbor.gym");
  });

  it("extracts phones", () => {
    expect(extractPhones(html, "AE").some((item) => item.includes("971"))).toBe(true);
  });

  it("extracts WhatsApp", () => {
    expect(extractWhatsApp(html, "AE").length).toBeGreaterThan(0);
    expect(parseWhatsAppTarget("https://api.whatsapp.com/send?phone=971501112233")).toBe("+971501112233");
  });

  it("extracts social profiles independently", () => {
    const social = extractSocialProfiles(html);
    expect(social.map((item) => item.platform).sort()).toEqual(["facebook", "instagram"]);
  });

  it("detects booking providers", () => {
    expect(extractBooking(html).some((item) => item.provider === "calendly")).toBe(true);
  });
});
