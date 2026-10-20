"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Icon from "@/components/ui/Icon";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const resetSchema = z
  .object({
    code: z.string().length(6, "Enter the 6-digit code"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export default function ForgotPasswordCard() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "", confirm: "" },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = (sec = 60) => {
    setResendIn(sec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const onRequest = emailForm.handleSubmit((v) =>
    run(async () => {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setEmail(v.email);
      setStep("code");
      setInfo(data.message ?? "Check your email for a 6-digit code.");
      startResendTimer(60);
    })
  );

  const onReset = resetForm.handleSubmit((v) =>
    run(async () => {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: v.code, password: v.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Reset failed.");
      setInfo(data.message ?? "Password updated. Redirecting to login…");
      setTimeout(() => router.push("/login"), 1500);
    })
  );

  const resend = () =>
    run(async () => {
      if (resendIn > 0) return;
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not resend.");
      setInfo("A new code has been sent.");
      startResendTimer(60);
    });

  return (
    <div className="w-full max-w-[400px]">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-forest-900">
          {step === "email" ? "Forgot password" : "Choose a new password"}
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          {step === "email"
            ? "Enter your @cvsu.edu.ph email. We will send a 6-digit verification code."
            : `We sent a code to ${email}. Enter it below with your new password.`}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {info && (
          <div className="mt-4 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-forest-800">
            {info}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={onRequest} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink" htmlFor="fp-email">
                Email
              </label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-mint-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20"
                placeholder="you@cvsu.edu.ph"
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !rounded-xl">
              {busy ? "Sending…" : "Send reset code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={onReset} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink" htmlFor="fp-code">
                6-digit code
              </label>
              <input
                id="fp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-full rounded-xl border border-mint-200 bg-white px-4 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20"
                placeholder="000000"
                {...resetForm.register("code")}
              />
              {resetForm.formState.errors.code && (
                <p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.code.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink" htmlFor="fp-pass">
                New password
              </label>
              <input
                id="fp-pass"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-mint-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20"
                {...resetForm.register("password")}
              />
              {resetForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink" htmlFor="fp-confirm">
                Confirm password
              </label>
              <input
                id="fp-confirm"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-mint-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20"
                {...resetForm.register("confirm")}
              />
              {resetForm.formState.errors.confirm && (
                <p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.confirm.message}</p>
              )}
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !rounded-xl">
              {busy ? "Updating…" : "Update password"}
            </button>
            <p className="text-center text-xs text-ink-soft">
              Didn&apos;t get a code?{" "}
              <button
                type="button"
                disabled={resendIn > 0 || busy}
                onClick={resend}
                className="font-bold text-forest-700 hover:underline disabled:opacity-50"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink-soft">
          Remember your password?{" "}
          <Link href="/login" className="font-bold text-forest-700 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition-all hover:gap-1.5"
          >
            <Icon name="arrow_back" className=" text-sm" /> Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
