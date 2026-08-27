import { describe, expect, it } from "vitest";
import { isBlockedHostname, isPrivateOrReservedIp, parsePublicHttpUrl, UnsafeUrlError } from "@/lib/utils/ssrf";

describe("SSRF protections", () => {
  it("blocks localhost and loopback", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("0.0.0.0")).toBe(true);
    expect(isPrivateOrReservedIp("::1")).toBe(true);
  });

  it("blocks private and metadata IPs", () => {
    expect(isPrivateOrReservedIp("10.0.0.8")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.10")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.4.4")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
    expect(isBlockedHostname("metadata.google.internal")).toBe(true);
  });

  it("rejects malformed and non-http URLs", () => {
    expect(() => parsePublicHttpUrl("not a url")).toThrow(UnsafeUrlError);
    expect(() => parsePublicHttpUrl("file:///etc/passwd")).toThrow(UnsafeUrlError);
    expect(() => parsePublicHttpUrl("http://localhost/admin")).toThrow(UnsafeUrlError);
    expect(() => parsePublicHttpUrl("https://user:pass@example.com")).toThrow(UnsafeUrlError);
  });

  it("allows public http URLs", () => {
    expect(parsePublicHttpUrl("https://example.com/about").hostname).toBe("example.com");
  });
});
