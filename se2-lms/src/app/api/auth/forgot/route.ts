import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { generateOtp, hashOtp } from "@/lib/auth/common";
import { sendMail } from "@/lib/mailer";
import { securityEvent } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

  const rl = rateLimit(`forgot:${ip}:${email}`, 3, 15 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: `Too many requests. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  const okResponse = Response.json({
    ok: true,
    message: "If an account exists for that email, a 6-digit reset code has been sent.",
  });

  if (!user || !user.passwordHash) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return okResponse;
  }

  await db.otpCode.updateMany({
    where: {
      userId: user.id,
      purpose: "RESET_PASSWORD",
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  const code = generateOtp();
  await db.otpCode.create({
    data: {
      userId: user.id,
      codeHash: hashOtp(code),
      channel: "email",
      purpose: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 10 * 60_000),
      attempts: 0,
    },
  });

  const html = `
  <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:32px;border:1px solid #c8e6c9;border-radius:16px">
    <h2 style="color:#1b5e20;margin:0 0 8px">Reset your CVSU LMS password</h2>
    <p style="color:#5f6b76;font-size:14px">Enter this one-time code to choose a new password. It expires in 10 minutes.</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#2e7d32">${code}</p>
    <p style="color:#9aa5ad;font-size:12px">If you did not request a password reset, you can ignore this email. Your password will not change.</p>
  </div>`;

  await sendMail(user.email, "CVSU LMS password reset code", html);
  await securityEvent("PASSWORD_RESET_REQUESTED", { userId: user.id, ip, detail: `email:${user.email}` });

  return okResponse;
}
