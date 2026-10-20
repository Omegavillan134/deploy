import crypto from "crypto";
import { db } from "@/lib/db";
import { deviceFingerprint, deviceName } from "@/lib/device";
import { createSession, setSessionCookie } from "./session";

export async function establishSession(
  req: Request,
  userId: string,
  rememberDevice: boolean
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const ua = req.headers.get("user-agent");

  let deviceId: string | null = null;
  if (rememberDevice) {
    const fingerprint = deviceFingerprint(req, ip);
    const device = await db.device.upsert({
      where: { userId_fingerprint: { userId, fingerprint } },
      update: { trusted: true, lastSeenAt: new Date(), name: deviceName(ua) },
      create: { userId, fingerprint, name: deviceName(ua), trusted: true },
    });
    deviceId = device.id;
  }

  const fpHash = crypto
    .createHash("sha256")
    .update([(ua ?? ""), req.headers.get("accept-language") ?? "", ip].join("|"))
    .digest("hex");

  const token = await createSession(userId, deviceId, ip, ua);
  await db.authSession.updateMany({
    where: { user: { id: userId }, tokenHash: crypto.createHash("sha256").update(token).digest("hex") },
    data: { fpHash },
  });
  setSessionCookie(token);
}

export async function enrollMethod(userId: string, method: "PASSWORD" | "OTP" | "QR" | "NFC" | "MAGIC_LINK") {
  await db.authMethodEnrollment.upsert({
    where: { userId_method: { userId, method } },
    update: { enabled: true },
    create: { userId, method },
  });
}

export const hashOtp = (code: string) =>
  crypto.createHash("sha256").update(code).digest("hex");

export const generateOtp = () =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
