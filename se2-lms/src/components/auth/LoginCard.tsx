"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Icon from "@/components/ui/Icon";

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "At least 8 characters"),
});
const codeSchema = z.object({ code: z.string().length(6, "Enter the 6-digit code") });

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
  return data;
}

export default function LoginCard() {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "code">("password");
  const [pendingEmail, setPendingEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rememberRef = useRef(false);
  const [captcha, setCaptcha] = useState<{ a: number; b: number; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const passForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { email: "", password: "" } });
  const codeForm = useForm({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const onPassword = passForm.handleSubmit((v) =>
    run(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          captchaToken: captcha?.token,
          captchaAnswer: captcha ? Number(captchaAnswer) : undefined,
          rememberDevice: rememberRef.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.requiresCaptcha && data.captcha) setCaptcha(data.captcha);
        throw new Error(data.error ?? "Something went wrong. Try again.");
      }
      setCaptcha(null);
      if (data.trustedDevice || data.requiresVerification === false) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setPendingEmail(v.email);
      setStep("code");
      setResendIn(data.resendAfterSec ?? 60);
      const t = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) { clearInterval(t); return 0; }
          return s - 1;
        });
      }, 1000);
    })
  );

  const onVerify = codeForm.handleSubmit((v) =>
    run(async () => {
      await post("/api/auth/otp/verify", { email: pendingEmail, code: v.code, rememberDevice: rememberRef.current });
      router.push("/dashboard");
      router.refresh();
    })
  );

  const resend = async () => {
    if (resendIn > 0) return;
    await run(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...passForm.getValues(),
          captchaToken: captcha?.token,
          captchaAnswer: captcha ? Number(captchaAnswer) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.requiresCaptcha && data.captcha) setCaptcha(data.captcha);
        throw new Error(data.error ?? "Something went wrong. Try again.");
      }
      setResendIn(data.resendAfterSec ?? 60);
      const t = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) { clearInterval(t); return 0; }
          return s - 1;
        });
      }, 1000);
    });
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="card !rounded-3xl shadow-float p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="CVSU LMS" className="w-11 h-11 rounded-xl shadow-card object-cover" />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold text-forest-900 tracking-tight">CVSU LMS</span>
            <span className="block text-[11px] text-ink-soft mt-0.5">Learning Management System</span>
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">
          {step === "password" ? "Welcome back" : "Check your email"}
        </h1>
        <p className="text-sm text-ink-soft mt-1.5 mb-7">
          {step === "password"
            ? "Sign in to continue to your classes."
            : `We sent a 6-digit verification code to ${pendingEmail}.`}
        </p>

        <div className="flex items-center gap-2 mb-6">
          <span className={`h-1.5 flex-1 rounded-full ${step === "password" ? "bg-forest-700" : "bg-mint-100"}`} />
          <span className={`h-1.5 flex-1 rounded-full ${step === "code" ? "bg-forest-700" : "bg-mint-100"}`} />
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">{error}</p>
        )}

        {step === "password" ? (
          <form onSubmit={onPassword} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="text-xs font-bold text-ink mb-2 block">Email address</label>
              <input id="email" type="email" placeholder="you@cvsu.edu.ph" className="input-field !bg-white" {...passForm.register("email")} />
              {passForm.formState.errors.email && <p className="text-xs text-red-600 mt-1.5">{String(passForm.formState.errors.email.message)}</p>}
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-bold text-ink mb-2 block">Password</label>
              <input id="password" type="password" placeholder="Enter your password" className="input-field !bg-white" {...passForm.register("password")} />
              {passForm.formState.errors.password && <p className="text-xs text-red-600 mt-1.5">{String(passForm.formState.errors.password.message)}</p>}
            </div>
            {captcha && (
              <div>
                <label className="text-xs font-bold text-ink mb-2 block">Quick check — you&apos;re human, right?</label>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-mint-50 px-3 py-2.5 text-sm font-bold text-forest-900">{captcha.a} + {captcha.b} = ?</span>
                  <input
                    inputMode="numeric"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Answer"
                    className="input-field !bg-white flex-1"
                    aria-label="Captcha answer"
                  />
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-ink-soft select-none">
              <input
                type="checkbox"
                className="rounded border-mint-300 text-forest-800 focus:ring-forest-700/30"
                onChange={(e) => { rememberRef.current = e.target.checked; }}
              />
              Remember this device
            </label>
            <button type="submit" disabled={busy} className="btn-primary w-full !rounded-xl disabled:opacity-60">
              {busy ? "Verifying…" : "Continue"}
            </button>
            <p className="text-center text-[11px] text-ink-soft leading-relaxed">
              A 6-digit verification code will be emailed to you after your password is accepted.
            </p>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-5" noValidate>
            <input
              className="input-field !bg-white text-center tracking-[0.5em] font-mono text-lg"
              maxLength={6}
              placeholder="••••••"
              autoFocus
              {...codeForm.register("code")}
            />
            {codeForm.formState.errors.code && <p className="text-xs text-red-600">{String(codeForm.formState.errors.code.message)}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full !rounded-xl disabled:opacity-60">
              {busy ? "Verifying…" : "Verify & sign in"}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={() => { setStep("password"); setError(null); }} className="font-bold text-forest-700 hover:underline">
                ← Back
              </button>
              <button type="button" onClick={resend} disabled={busy || resendIn > 0} className="font-bold text-forest-700 hover:underline disabled:opacity-50">
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {step === "password" && (
          <>
            <p className="text-center text-xs text-ink-soft mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-forest-700 hover:underline">Create an account</Link>
            </p>
            <p className="text-center mt-3">
              <Link href="/forgot-password" className="text-xs font-bold text-ink hover:text-forest-700">forgot password?</Link>
            </p>
          </>
        )}
        <p className="text-center mt-3">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:gap-1.5 transition-all">
            <Icon name="arrow_back" className=" text-sm" /> Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
