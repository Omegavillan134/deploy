import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not found." }, { status: 404 });
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ notifications });
}
