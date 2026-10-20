import { db } from "@/lib/db";
import Icon from "@/components/ui/Icon";

export default async function AdminOverview() {
  const [students, teachers, admins, classes, submissions, users] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.class.count(),
    db.submission.count(),
    db.user.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true } }),
  ]);

  const stats = [
    { label: "Students", value: students, icon: "school" },
    { label: "Teachers", value: teachers, icon: "co_present" },
    { label: "Admins", value: admins, icon: "admin_panel_settings" },
    { label: "Classes", value: classes, icon: "groups" },
    { label: "Submissions", value: submissions, icon: "assignment" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Platform overview</h1>
        <p className="text-sm text-ink-soft mt-1">System-wide usage at a glance.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <Icon name={String(s.icon)} className=" text-forest-700" />
            <p className="mt-2 text-2xl font-extrabold text-forest-900">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>
      <section className="card p-6">
        <h2 className="font-bold text-forest-900">Newest accounts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft">
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">Email</th>
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-mint-50">
                  <td className="py-2.5 font-medium text-ink">{u.firstName} {u.lastName}</td>
                  <td className="py-2.5 text-ink-soft">{u.email}</td>
                  <td className="py-2.5"><span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-[11px] font-bold text-forest-700">{u.role}</span></td>
                  <td className="py-2.5 text-ink-soft">{u.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
