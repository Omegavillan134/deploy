import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function getClassAccess(classId: string) {
  const user = await getSessionUser();
  if (!user) return { user: null, cls: null, isTeacher: false, isMember: false };

  const cls = await db.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });
  if (!cls) return { user, cls: null, isTeacher: false, isMember: false };

  const isTeacher = cls.teacherId === user.id || user.role === "ADMIN";
  const isMember = isTeacher || (await db.enrollment.findUnique({
    where: { classId_userId: { classId, userId: user.id } },
  })) !== null;

  return { user, cls, isTeacher, isMember };
}
