import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { establishSession, enrollMethod, hashOtp } from "@/lib/auth/common";
import { publicUser } from "@/lib/auth/session";
import { audit, securityEvent } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  rememberDevice: z.boolean().default(false),
});

const MAX_FAILS = 3;
const BASE_LOCK_MS = 5 * 60_000;
const state = new Map<string, { fails: number; lockedUntil: number; lockMs: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of state) if (v.lockedUntil < now && v.fails === 0) state.delete(k);
}, 60_000).unref();

export async function POST(req: Request) {
  const ip = clientIp(req);
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase() : "";

  const rl = rateLimit(`otp-verify:${ip}:${email}`, 12, 10 * 60_000);
  if (!rl.ok)
    return Response.json({ error: `Too many attempts. Retry in ${rl.retryAfterSec}s.` }, { status: 429 });

  const key = `${ip}|${email}`;
  const entry = state.get(key) ?? { fails: 0, lockedUntil: 0, lockMs: BASE_LOCK_MS };
  if (entry.lockedUntil > Date.now()) {
    const retry = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return Response.json(
      { error: `Too many wrong codes. Try again in ${retry}s.` },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Invalid code." }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const record = user
    ? await db.otpCode.findFirst({
        where: { userId: user.id, purpose: "LOGIN", consumedAt: null },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const invalid =
    !user ||
    !record ||
    record.expiresAt < new Date() ||
    record.attempts >= 5 ||
    record.codeHash !== hashOtp(parsed.data.code);

  if (invalid) {
    if (record && record.attempts < 5)
      await db.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
    entry.fails += 1;
    if (entry.fails >= MAX_FAILS) {
      entry.lockedUntil = Date.now() + entry.lockMs;
      entry.lockMs = Math.min(entry.lockMs * 2, 60 * 60_000);
      entry.fails = 0;
      await securityEvent("OTP_LOCKED", {
        userId: user?.id,
        ip,
        detail: `lock ${entry.lockMs / 1000}s`,
      });
    }
    state.set(key, entry);
    return Response.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  if (user.role === "TEACHER" && !user.approved)
    return Response.json(
      {
        error: "Your teacher account is awaiting admin approval. Please contact your administrator.",
      },
      { status: 403 }
    );

  await db.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  await audit(user.id, "LOGIN_SUCCESS", `user:${user.id}`, undefined, req);
  await enrollMethod(user.id, "OTP");
  await establishSession(req, user.id, parsed.data.rememberDevice);
  state.delete(key);
  return Response.json({ ok: true, user: publicUser(user) });
}
