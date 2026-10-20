import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const unread = await db.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <DashboardShell
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }}
      unread={unread}
    >
      {children}
    </DashboardShell>
  );
}
