import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import StudentOverview from "@/components/dashboard/StudentOverview";
import TeacherOverview from "@/components/dashboard/TeacherOverview";
import AdminOverview from "@/components/dashboard/AdminOverview";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role === "TEACHER") return <TeacherOverview userId={user.id} />;
  if (user.role === "ADMIN") return <AdminOverview />;
  return <StudentOverview userId={user.id} />;
}
