import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashOtp } from "@/lib/auth/common";
import { hashPassword } from "@/lib/password";
import { isBreachedPassword } from "@/lib/breach";
import { securityEvent } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

const MAX_FAILS = 3;
const state = new Map<string, { fails: number; lockedUntil: number; lockMs: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of state) if (v.lockedUntil < now) state.delete(k);
}, 60_000).unref();

export async function POST(req: Request) {
  const ip = clientIp(req);
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

  const rl = rateLimit(`reset:${ip}:${email}`, 10, 15 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const key = `${ip}|${email}`;
  const entry = state.get(key) ?? { fails: 0, lockedUntil: 0, lockMs: 5 * 60_000 };
  if (entry.lockedUntil > Date.now()) {
    const retry = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return Response.json(
      { error: `Too many failed attempts. Try again in ${retry}s.` },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  if (await isBreachedPassword(parsed.data.password)) {
    return Response.json(
      { error: "That password appears in public data breaches. Please pick a different one." },
      { status: 422 }
    );
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const record = user
    ? await db.otpCode.findFirst({
        where: {
          userId: user.id,
          purpose: "RESET_PASSWORD",
          consumedAt: null,
        },
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
    if (record && record.attempts < 5) {
      await db.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
    }
    entry.fails += 1;
    if (entry.fails >= MAX_FAILS) {
      entry.lockedUntil = Date.now() + entry.lockMs;
      entry.lockMs = Math.min(entry.lockMs * 2, 60 * 60_000);
      entry.fails = 0;
    }
    state.set(key, entry);
    return Response.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  await db.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.password) },
  });
  await db.authSession.deleteMany({ where: { userId: user.id } });
  await securityEvent("PASSWORD_RESET_SUCCESS", { userId: user.id, ip });

  state.delete(key);

  return Response.json({
    ok: true,
    message: "Password updated. You can now sign in with your new password.",
  });
}
