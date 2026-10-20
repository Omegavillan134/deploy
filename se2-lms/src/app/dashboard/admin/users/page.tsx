import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import RoleSelect from "@/components/dashboard/admin/RoleSelect";
import ApproveButton from "@/components/dashboard/admin/ApproveButton";

export default async function AdminUsersPage() {
  const user = (await getSessionUser())!;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  const pendingTeachers = users.filter((u) => u.role === "TEACHER" && !u.approved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">User management</h1>
        <p className="text-sm text-ink-soft mt-1">{users.length} accounts</p>
      </div>

      {pendingTeachers.length > 0 && (
        <div className="card border-l-4 border-l-amber-500 p-5">
          <p className="text-sm font-bold text-amber-800">
            {pendingTeachers.length} teacher account{pendingTeachers.length === 1 ? "" : "s"} awaiting approval
          </p>
          <p className="text-xs text-ink-soft mt-1">
            These users verified their CVSU email but cannot sign in until you approve them below.
          </p>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-mint-100 text-left text-xs text-ink-soft">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-mint-50 last:border-0">
                <td className="px-5 py-3 font-medium text-ink">
                  {u.firstName} {u.lastName}
                  {u.id === user.id && <span className="ml-2 text-[10px] font-bold text-forest-700">(you)</span>}
                </td>
                <td className="px-5 py-3 text-ink-soft">{u.email}</td>
                <td className="px-5 py-3">
                  <RoleSelect userId={u.id} role={u.role} disabled={u.id === user.id} />
                </td>
                <td className="px-5 py-3">
                  {u.role === "TEACHER" && !u.approved ? (
                    <ApproveButton userId={u.id} />
                  ) : (
                    <span className="rounded-full bg-mint-100 px-3 py-1 text-[11px] font-bold text-forest-700">Active</span>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-soft">{u.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
