import { describe, it, expect } from "vitest";
import { deviceFingerprint, deviceName } from "@/lib/device";

const mkReq = (ua: string, lang = "en-US") =>
  new Request("http://localhost/", { headers: { "user-agent": ua, "accept-language": lang } });

describe("deviceFingerprint", () => {
  it("is stable for identical inputs", () => {
    const a = deviceFingerprint(mkReq("Mozilla/5.0 Chrome/126"), "1.2.3.4");
    const b = deviceFingerprint(mkReq("Mozilla/5.0 Chrome/126"), "1.2.3.4");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("changes when the user agent changes", () => {
    const a = deviceFingerprint(mkReq("Chrome/126"), "1.2.3.4");
    const b = deviceFingerprint(mkReq("Firefox/128"), "1.2.3.4");
    expect(a).not.toBe(b);
  });
});

describe("deviceName", () => {
  it("detects browser + OS", () => {
    expect(deviceName("Mozilla/5.0 (Windows NT 10.0) Chrome/126")).toBe("Chrome on Windows");
    expect(deviceName("Mozilla/5.0 (iPhone) Safari/604")).toBe("Safari on iOS");
    expect(deviceName("Mozilla/5.0 (X11; Linux x86_64) Firefox/128")).toBe("Firefox on Linux");
    expect(deviceName(null)).toBe("Browser on Device");
  });
});
