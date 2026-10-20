import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SecurityDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [events, audits] = await Promise.all([
    db.securityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const count = (t: string) => events.filter((e) => e.type === t).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Security events</h1>
        <p className="text-sm text-ink-soft mt-1">Suspicious activity, failed logins, and rate-limit hits.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Failed logins", value: count("FAILED_LOGIN"), color: "text-red-600" },
          { label: "Suspicious exams", value: count("SUSPICIOUS_EXAM"), color: "text-amber-600" },
          { label: "Rate limited", value: count("RATE_LIMITED"), color: "text-amber-600" },
          { label: "Doc parse failures", value: count("DOC_PARSE_FAILED"), color: "text-ink" },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-ink-soft mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <h2 className="px-5 pt-5 font-bold text-forest-900">Recent events</h2>
        <table className="w-full min-w-[640px] text-sm mt-2">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-b border-mint-100">
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">IP</th>
              <th className="px-5 py-3 font-semibold">Detail</th>
              <th className="px-5 py-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-mint-50 last:border-0">
                <td className="px-5 py-2.5 font-bold text-ink">{e.type}</td>
                <td className="px-5 py-2.5 text-ink-soft">{e.userId ?? "—"}</td>
                <td className="px-5 py-2.5 text-ink-soft font-mono text-xs">{e.ip ?? "—"}</td>
                <td className="px-5 py-2.5 text-ink-soft text-xs">{e.detail ?? "—"}</td>
                <td className="px-5 py-2.5 text-ink-soft text-xs">{e.createdAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card overflow-x-auto">
        <h2 className="px-5 pt-5 font-bold text-forest-900">Audit log (sensitive reads/writes)</h2>
        <table className="w-full min-w-[640px] text-sm mt-2">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-b border-mint-100">
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Actor</th>
              <th className="px-5 py-3 font-semibold">Target</th>
              <th className="px-5 py-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a) => (
              <tr key={a.id} className="border-b border-mint-50 last:border-0">
                <td className="px-5 py-2.5 font-bold text-ink">{a.action}</td>
                <td className="px-5 py-2.5 text-ink-soft text-xs">{a.actorId ?? "—"}</td>
                <td className="px-5 py-2.5 text-ink-soft text-xs">{a.target ?? "—"}</td>
                <td className="px-5 py-2.5 text-ink-soft text-xs">{a.createdAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
