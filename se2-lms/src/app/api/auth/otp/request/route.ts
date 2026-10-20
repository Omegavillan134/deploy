import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendMail, signinOtpEmail } from "@/lib/mailer";
import { generateOtp, hashOtp } from "@/lib/auth/common";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`otp-req:${ip}`, 3, 10 * 60_000);
  if (!rl.ok)
    return Response.json({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  
  if (user) {
    const code = generateOtp();
    await db.otpCode.create({
      data: {
        userId: user.id,
        codeHash: hashOtp(code),
        channel: "email",
        purpose: "LOGIN",
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });
    await sendMail(email, "Your CVSU LMS sign-in code", signinOtpEmail(code));
  } else {
    await new Promise((r) => setTimeout(r, 300));
  }

  return Response.json({ ok: true, message: "If an account exists, a code is on its way." });
}
