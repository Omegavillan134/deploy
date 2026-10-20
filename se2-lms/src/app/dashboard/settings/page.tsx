import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const user = (await getSessionUser())!;
  const methods = await db.authMethodEnrollment.findMany({ where: { userId: user.id } });

  const labels: Record<string, string> = {
    PASSWORD: "Password",
    OTP: "Email verification code",
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Settings</h1>
        <p className="text-sm text-ink-soft mt-1">{user.firstName} {user.lastName} · {user.email}</p>
      </div>

      <section className="card p-6">
        <h2 className="font-bold text-forest-900">Sign-in security</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Signing in requires your password <b>plus</b> a 6-digit verification code emailed to you —
          every sign-in, every device.
        </p>
        <ul className="mt-4 space-y-2">
          {Object.entries(labels).map(([m, label]) => {
            const enrolled = methods.find((x) => x.method === m)?.enabled;
            return (
              <li key={m} className="flex items-center justify-between rounded-xl border border-mint-100 px-4 py-3">
                <span className="text-sm font-semibold text-ink">{label}</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${enrolled ? "bg-mint-100 text-forest-800" : "bg-gray-100 text-gray-500"}`}>
                  {enrolled ? "Enrolled" : "Not set up"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

    </div>
  );
}
