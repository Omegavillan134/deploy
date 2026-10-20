import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-cvsu_session" : "cvsu_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export async function createSession(
  userId: string,
  deviceId: string | null,
  ip: string | null,
  userAgent: string | null
): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  await db.authSession.create({
    data: {
      userId,
      deviceId,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip,
      userAgent,
    },
  });
  return token;
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.authSession.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  
  if (session.fpHash) {
    const h = headers();
    const ua = h.get("user-agent") ?? "";
    let ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "127.0.0.1";
    if (ip === "::1" || ip === ":1") ip = "127.0.0.1";
    const fp = crypto.createHash("sha256").update([ua, h.get("accept-language") ?? "", ip].join("|")).digest("hex");
    if (fp !== session.fpHash) {
      const isLocal = ip === "127.0.0.1" || process.env.NODE_ENV !== "production";
      if (!isLocal) {
        await db.authSession.delete({ where: { id: session.id } }).catch(() => {});
        return null;
      }
    }
  }

  
  const day = 24 * 3600 * 1000;
  if (session.expiresAt.getTime() - Date.now() < 3 * day) {
    await db.authSession.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + 7 * day) },
    }).catch(() => {});
  }

  return session.user;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return;
  await db.authSession.deleteMany({ where: { tokenHash: hash(token) } });
  clearSessionCookie();
}

export const publicUser = (u: {
  id: string; email: string; firstName: string; lastName: string;
  role: string; avatarUrl: string | null; studentNumber: string | null;
}) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  avatarUrl: u.avatarUrl,
  studentNumber: u.studentNumber,
});
