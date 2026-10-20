import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { enrollMethod, generateOtp, hashOtp, establishSession } from "@/lib/auth/common";
import { verifyPassword } from "@/lib/password";
import { sendMail, signinOtpEmail } from "@/lib/mailer";
import { securityEvent } from "@/lib/audit";
import { newChallenge, checkChallenge } from "@/lib/captcha";
import { deviceFingerprint } from "@/lib/device";
import { publicUser } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  captchaToken: z.string().optional(),
  captchaAnswer: z.coerce.number().optional(),
  rememberDevice: z.boolean().optional(),
});

const CAPTCHA_AFTER = 3;
const BASE_LOCK_MS = 5 * 60_000;
const state = new Map<string, { fails: number; lockedUntil: number; lockMs: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of state) if (v.lockedUntil < now && v.fails === 0) state.delete(k);
}, 60_000).unref();

const resendCooldown = new Map<string, number>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of resendCooldown) if (v <= now) resendCooldown.delete(k);
}, 30_000).unref();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const ip = clientIp(req);
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase() : "";

  const rl = rateLimit(`login:${ip}:${email}`, 8, 5 * 60_000);
  if (!rl.ok)
    return Response.json({ error: `Too many attempts. Retry in ${rl.retryAfterSec}s.` }, { status: 429 });

  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Invalid email or password." }, { status: 400 });

  const key = `${ip}|${email}`;
  const entry = state.get(key) ?? { fails: 0, lockedUntil: 0, lockMs: BASE_LOCK_MS };

  if (entry.lockedUntil > Date.now()) {
    const retry = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return Response.json(
      { error: `Account temporarily locked. Try again in ${retry}s.` },
      { status: 423 }
    );
  }

  if (entry.fails >= CAPTCHA_AFTER) {
    const ok =
      parsed.data.captchaToken &&
      parsed.data.captchaAnswer !== undefined &&
      checkChallenge(parsed.data.captchaToken, parsed.data.captchaAnswer);
    if (!ok)
      return Response.json(
        {
          error: "Too many failed attempts. Complete the quick check.",
          requiresCaptcha: true,
          captcha: newChallenge(),
        },
        { status: 401 }
      );
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = user?.passwordHash
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !valid) {
    entry.fails += 1;
    if (entry.fails >= 3) {
      entry.lockedUntil = Date.now() + entry.lockMs;
      entry.lockMs = Math.min(entry.lockMs * 2, 60 * 60_000);
      await securityEvent("ACCOUNT_LOCKED", {
        userId: user?.id,
        ip,
        detail: `${email} locked ${entry.lockMs / 1000}s after fails`,
      });
      entry.fails = 0;
    }
    state.set(key, entry);
    await securityEvent("FAILED_LOGIN", { userId: user?.id, ip, detail: email });
    await sleep(Math.min(300 * (entry.fails || 1), 3000));
    const needCaptcha = entry.fails >= CAPTCHA_AFTER || entry.lockedUntil > Date.now();
    return Response.json(
      {
        error: "Invalid email or password.",
        requiresCaptcha: needCaptcha,
        captcha: needCaptcha ? newChallenge() : undefined,
      },
      { status: 401 }
    );
  }

  state.delete(key);

  if (user.role === "TEACHER" && !user.approved)
    return Response.json(
      {
        error: "Your teacher account is awaiting admin approval. Please contact your administrator.",
      },
      { status: 403 }
    );

  const fp = deviceFingerprint(req, ip);
  const trusted = await db.device.findUnique({
    where: { userId_fingerprint: { userId: user.id, fingerprint: fp } },
  });
  if (trusted?.trusted) {
    await db.device.update({
      where: { id: trusted.id },
      data: { lastSeenAt: new Date() },
    });
    await enrollMethod(user.id, "PASSWORD");
    await establishSession(req, user.id, true);
    return Response.json({
      ok: true,
      email,
      requiresVerification: false,
      trustedDevice: true,
      user: publicUser(user),
    });
  }

  const cooldownUntil = resendCooldown.get(email) ?? 0;
  if (cooldownUntil > Date.now()) {
    const retry = Math.ceil((cooldownUntil - Date.now()) / 1000);
    return Response.json(
      { error: `Please wait ${retry}s before requesting another code.`, retryAfterSec: retry },
      { status: 429 }
    );
  }

  await db.otpCode.updateMany({
    where: { userId: user.id, purpose: "LOGIN", consumedAt: null },
    data: { consumedAt: new Date() },
  });

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
  resendCooldown.set(email, Date.now() + 60_000);
  await sendMail(email, "Your CVSU LMS verification code", signinOtpEmail(code));
  await enrollMethod(user.id, "PASSWORD");

  return Response.json({
    ok: true,
    email,
    requiresVerification: true,
    resendAfterSec: 60,
    ...(process.env.ALLOW_DEVCODES === "true" ? { devCode: code } : {}),
  });
}
