import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendMail, verifyOtpEmail } from "@/lib/mailer";
import { generateOtp, hashOtp } from "@/lib/auth/common";
import { hashPassword } from "@/lib/password";
import { isBreachedPassword } from "@/lib/breach";

const ALLOWED_DOMAIN = "cvsu.edu.ph";

const schema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z
    .string()
    .email()
    .max(120)
    .refine((e) => e.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`), {
      message: `Use your official @${ALLOWED_DOMAIN} email address.`,
    }),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(72)
    .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), {
      message: "Password must include uppercase, lowercase, and a number",
    }),
  role: z.enum(["STUDENT", "TEACHER"]).default("STUDENT"),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`register:${ip}`, 5, 10 * 60_000);
  if (!rl.ok)
    return Response.json({ error: `Too many attempts. Retry in ${rl.retryAfterSec}s.` }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid registration details." },
      { status: 400 }
    );

  if (await isBreachedPassword(parsed.data.password))
    return Response.json(
      { error: "That password appears in public data breaches. Please pick a different one." },
      { status: 422 }
    );

  const email = parsed.data.email.toLowerCase();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists)
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });

  const code = generateOtp();
  const passwordHash = hashPassword(parsed.data.password);

  await db.pendingRegistration.upsert({
    where: { email },
    update: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      passwordHash,
      role: parsed.data.role,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + 10 * 60_000),
      attempts: 0,
    },
    create: {
      email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      passwordHash,
      role: parsed.data.role,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });

  await sendMail(email, "Verify your CVSU LMS account", verifyOtpEmail(code));

  return Response.json({
    ok: true,
    email,
    requiresVerification: true,
    
    ...(process.env.ALLOW_DEVCODES === "true" ? { devCode: code } : {}),
  });
}
