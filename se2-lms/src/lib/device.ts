import crypto from "crypto";

export function deviceFingerprint(req: Request, ip: string): string {
  const raw = [
    req.headers.get("user-agent") ?? "",
    req.headers.get("accept-language") ?? "",
    ip,
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function deviceName(userAgent: string | null): string {
  const ua = (userAgent ?? "").toLowerCase();
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome")
    ? "Chrome"
    : ua.includes("safari")
    ? "Safari"
    : ua.includes("firefox")
    ? "Firefox"
    : "Browser";
  const os = ua.includes("windows")
    ? "Windows"
    : ua.includes("android")
    ? "Android"
    : ua.includes("iphone") || ua.includes("ipad")
    ? "iOS"
    : ua.includes("mac os")
    ? "macOS"
    : ua.includes("linux")
    ? "Linux"
    : "Device";
  return `${browser} on ${os}`;
}
