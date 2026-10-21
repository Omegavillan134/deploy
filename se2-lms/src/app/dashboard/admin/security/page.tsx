import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import LocalDateTime from "@/components/ui/LocalDateTime";

export default async function SecurityDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [events, audits] = await Promise.all([
    db.securityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const count = (t: string) => events.filter((e) => e.type === t).length;

  const stats = [
    { label: "Failed logins", value: count("FAILED_LOGIN"), color: "text-red-600" },
    { label: "Rate limited", value: count("RATE_LIMITED"), color: "text-amber-600" },
    { label: "Doc parse failures", value: count("DOC_PARSE_FAILED"), color: "text-ink" },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Security events</h1>
        <p className="text-sm text-ink-soft mt-1">Suspicious activity, failed logins, and rate-limit hits.</p>
      </div>

      {/* Stat boxes — equal width, no awkward empty 4th column */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card px-4 py-4 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-ink-soft mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <h2 className="px-4 pt-4 pb-2 font-bold text-forest-900">Recent events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[26%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-mint-100">
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">User</th>
                <th className="px-3 py-2.5 font-semibold">IP</th>
                <th className="px-3 py-2.5 font-semibold">Detail</th>
                <th className="px-3 py-2.5 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-ink-soft">
                    No security events yet.
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-b border-mint-50 last:border-0 align-top">
                  <td className="px-3 py-2.5 font-bold text-ink text-xs break-words">{e.type}</td>
                  <td className="px-3 py-2.5 text-ink-soft text-xs break-all">{e.userId ?? "—"}</td>
                  <td className="px-3 py-2.5 text-ink-soft font-mono text-[11px] break-all">{e.ip ?? "—"}</td>
                  <td className="px-3 py-2.5 text-ink-soft text-xs break-words">{e.detail ?? "—"}</td>
                  <td className="px-3 py-2.5 text-ink-soft text-[11px] whitespace-nowrap">
                    <LocalDateTime value={e.createdAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="px-4 pt-4 pb-2 font-bold text-forest-900">Audit log (sensitive reads/writes)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[28%]" />
              <col className="w-[26%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-mint-100">
                <th className="px-3 py-2.5 font-semibold">Action</th>
                <th className="px-3 py-2.5 font-semibold">Actor</th>
                <th className="px-3 py-2.5 font-semibold">Target</th>
                <th className="px-3 py-2.5 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-ink-soft">
                    No audit entries yet.
                  </td>
                </tr>
              )}
              {audits.map((a) => (
                <tr key={a.id} className="border-b border-mint-50 last:border-0 align-top">
                  <td className="px-3 py-2.5 font-bold text-ink text-xs break-words">{a.action}</td>
                  <td className="px-3 py-2.5 text-ink-soft text-xs break-all">{a.actorId ?? "—"}</td>
                  <td className="px-3 py-2.5 text-ink-soft text-xs break-words">{a.target ?? "—"}</td>
                  <td className="px-3 py-2.5 text-ink-soft text-[11px] whitespace-nowrap">
                    <LocalDateTime value={a.createdAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}