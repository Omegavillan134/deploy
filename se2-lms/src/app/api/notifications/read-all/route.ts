import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function POST() {
  const user = await getSessionUser();
  if (user) await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  redirect("/dashboard/notifications");
}
