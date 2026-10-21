"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Icon from "@/components/ui/Icon";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z
    .string()
    .email("Enter a valid email")
    .refine((e) => e.toLowerCase().endsWith("@cvsu.edu.ph"), "Use your @cvsu.edu.ph email"),
  password: z
    .string()
    .min(10, "At least 10 characters")
    .refine(
      (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p),
      "Need uppercase, lowercase, and a number"
    ),
  role: z.enum(["STUDENT", "TEACHER"]),
});

const codeSchema = z.object({ code: z.string().length(6, "Enter the 6-digit code") });

type Details = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [pendingEmail, setPendingEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<Details>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "STUDENT",
    },
  });

  const codeForm = useForm({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const pw = watch("password") ?? "";
  let pwScore = 0;
  if (pw.length >= 10) pwScore++;
  if (pw.length >= 14) pwScore++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) pwScore++;
  if (/[^A-Za-z0-9]/.test(pw)) pwScore++;
  const pwWidth = ["w-0", "w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"][pwScore] ?? "w-0";
  const pwBarCls =
    ["bg-mint-200", "bg-red-500", "bg-red-400", "bg-amber-400", "bg-lime-500", "bg-forest-700"][
      pwScore
    ] ?? "bg-mint-200";
  const pwLabel = ["", "Very weak", "Weak", "Fair", "Good", "Strong"][pwScore] ?? "";

  const onDetails = handleSubmit(async (values) => {
    setBusy(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not send verification code.");
      setPendingEmail(values.email);
      setStep("code");
      setResendIn(60);
      const t = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) {
            clearInterval(t);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  });

  const onVerify = codeForm.handleSubmit(async (values) => {
    setBusy(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: values.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Verification failed.");
      if (data.awaitingApproval) {
        setAwaiting(true);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  });

  const resend = async () => {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getValues()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not resend code.");
      setResendIn(60);
      const t = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) {
            clearInterval(t);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Could not resend code.");
    } finally {
      setBusy(false);
    }
  };

  if (awaiting) {
    return (
      <main className="min-h-screen hero-wash flex flex-col items-center justify-center px-4 py-12">
        <div className="card w-full max-w-[420px] !rounded-3xl p-8 sm:p-10 text-center">
          <Icon name="hourglass_top" className=" text-4xl text-forest-700" />
          <h1 className="mt-4 text-2xl font-extrabold text-forest-900">Awaiting approval</h1>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            Your teacher account was verified. An administrator must approve it before you can sign
            in. You will be notified once approved.
          </p>
          <Link href="/login" className="btn-primary mt-6 inline-flex !rounded-xl">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen hero-wash flex flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-[420px] flex-col items-center">
        <div className="card w-full !rounded-3xl p-8 sm:p-10 shadow-float">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo.png" alt="CVSU LMS" className="h-11 w-11 rounded-xl shadow-card object-cover" />
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-forest-900">
                CVSU LMS
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-soft">Create your account</span>
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-forest-900">
            {step === "details" ? "Register" : "Check your email"}
          </h1>
          <p className="mt-1.5 mb-7 text-sm text-ink-soft">
            {step === "details"
              ? "Use your @cvsu.edu.ph email. Teachers need admin approval after signup."
              : `Enter the 6-digit code we sent to ${pendingEmail}.`}
          </p>

          <div className="mb-6 flex items-center gap-2">
            <span
              className={`h-1.5 flex-1 rounded-full ${step === "details" ? "bg-forest-700" : "bg-mint-100"}`}
            />
            <span
              className={`h-1.5 flex-1 rounded-full ${step === "code" ? "bg-forest-700" : "bg-mint-100"}`}
            />
          </div>

          {serverError && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700"
            >
              {serverError}
            </p>
          )}

          {step === "details" ? (
            <form onSubmit={onDetails} className="space-y-5" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-wide text-ink" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    className="input-field !bg-white"
                    autoComplete="given-name"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{String(errors.firstName.message)}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-wide text-ink" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    className="input-field !bg-white"
                    autoComplete="family-name"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{String(errors.lastName.message)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-wide text-ink" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field !bg-white"
                  placeholder="you@cvsu.edu.ph"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.email.message)}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-wide text-ink" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input-field !bg-white"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {pw.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-mint-100">
                      <div className={`h-full rounded-full transition-all ${pwWidth} ${pwBarCls}`} />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-soft">{pwLabel}</p>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.password.message)}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-wide text-ink" htmlFor="role">
                  I am a
                </label>
                <select id="role" className="select-field" {...register("role")}>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary w-full !rounded-xl disabled:opacity-60"
                >
                  {busy ? "Sending code…" : "Send verification code"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onVerify} className="space-y-5" noValidate>
              <p className="text-sm leading-relaxed text-ink-soft">
                We sent a <b className="text-ink">6-digit code</b> to{" "}
                <b className="text-ink">{pendingEmail}</b>. Enter it below to activate your account.
              </p>
              <input
                className="input-field !bg-white text-center font-mono text-lg tracking-[0.5em]"
                maxLength={6}
                placeholder="••••••"
                autoComplete="one-time-code"
                inputMode="numeric"
                {...codeForm.register("code")}
              />
              {codeForm.formState.errors.code && (
                <p className="text-xs text-red-600">
                  {String(codeForm.formState.errors.code.message)}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full !rounded-xl disabled:opacity-60"
              >
                {busy ? "Verifying…" : "Verify & create account"}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setServerError(null);
                  }}
                  className="font-bold text-forest-700 hover:underline"
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={busy || resendIn > 0}
                  className="font-bold text-forest-700 hover:underline disabled:opacity-50"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          <p className="pt-1 text-center text-xs text-ink-soft">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-forest-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 transition-all hover:gap-2.5"
        >
          <Icon name="arrow_back" className=" text-base" /> Back to home
        </Link>
      </div>
    </main>
  );
}
