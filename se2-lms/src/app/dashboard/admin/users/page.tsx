import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import UsersClient from "@/components/dashboard/admin/UsersClient";

export default async function AdminUsersPage() {
  const user = (await getSessionUser())!;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  const pendingTeachers = users.filter((u) => u.role === "TEACHER" && !u.approved);

  const serialized = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role as "STUDENT" | "TEACHER" | "ADMIN",
    approved: u.approved,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">User management</h1>
        <p className="text-sm text-ink-soft mt-1">{users.length} accounts</p>
      </div>

      {pendingTeachers.length > 0 && (
        <div className="card border-l-4 border-l-amber-500 p-4 sm:p-5">
          <p className="text-sm font-bold text-amber-800">
            {pendingTeachers.length} teacher account{pendingTeachers.length === 1 ? "" : "s"} awaiting approval
          </p>
          <p className="text-xs text-ink-soft mt-1">
            These users verified their CVSU email but cannot sign in until you approve them below.
          </p>
        </div>
      )}

      <UsersClient users={serialized} currentUserId={user.id} />
    </div>
  );
}