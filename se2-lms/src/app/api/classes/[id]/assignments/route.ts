import { z } from "zod";
import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";
import { notifyMany } from "@/lib/notify";

const schema = z.object({
  title: z.string().min(1).max(140),
  instructions: z.string().max(10000).optional(),
  points: z.coerce.number().int().min(0).max(1000).default(100),
  dueAt: z.string().datetime().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, cls, isTeacher } = await getClassAccess(params.id);
  if (!user || !cls) return Response.json({ error: "Not found." }, { status: 404 });
  if (!isTeacher) return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid assignment details." }, { status: 400 });

  const a = await db.assignment.create({
    data: {
      classId: cls.id,
      title: parsed.data.title,
      instructions: parsed.data.instructions || null,
      points: parsed.data.points,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    },
  });

  await db.calendarEvent.create({ data: { classId: cls.id, title: `Due: ${a.title}`, kind: "HOMEWORK", startsAt: a.dueAt ?? new Date(), createdById: user.id } });
  const students = await db.enrollment.findMany({ where: { classId: cls.id }, select: { userId: true } });
  await notifyMany(
    students.map((s) => s.userId),
    `New assignment in ${cls.name}`,
    `${a.title} · due ${a.dueAt ? a.dueAt.toLocaleDateString() : "anytime"}`,
    `/dashboard/classes/${cls.id}/assignments/${a.id}`
  );
  return Response.json({ ok: true, id: a.id }, { status: 201 });
}
