import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashOtp, establishSession, enrollMethod } from "@/lib/auth/common";
import { publicUser } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`register-verify:${ip}`, 10, 10 * 60_000);
  if (!rl.ok)
    return Response.json({ error: `Too many attempts. Retry in ${rl.retryAfterSec}s.` }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter the 6-digit code." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const pending = await db.pendingRegistration.findUnique({ where: { email } });

  const invalid =
    !pending ||
    pending.expiresAt < new Date() ||
    pending.attempts >= 5 ||
    pending.codeHash !== hashOtp(parsed.data.code);

  if (invalid) {
    if (pending && pending.attempts < 5)
      await db.pendingRegistration.update({
        where: { id: pending.id },
        data: { attempts: { increment: 1 } },
      });
    return Response.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    await db.pendingRegistration.delete({ where: { id: pending.id } });
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      email,
      firstName: pending.firstName,
      lastName: pending.lastName,
      passwordHash: pending.passwordHash,
      role: pending.role,
      approved: pending.role === "STUDENT",
    },
  });
  await db.pendingRegistration.delete({ where: { id: pending.id } });
  await enrollMethod(user.id, "PASSWORD");

  if (user.role === "TEACHER") {
    return Response.json({ ok: true, awaitingApproval: true, userId: user.id }, { status: 201 });
  }

  await establishSession(req, user.id, true);
  return Response.json({ ok: true, user: publicUser(user) }, { status: 201 });
}
