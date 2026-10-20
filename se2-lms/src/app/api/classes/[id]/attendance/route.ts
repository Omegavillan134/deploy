import { z } from "zod";
import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";

const schema = z.object({
  date: z.string(),
  records: z.array(z.object({ studentId: z.string(), status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]) })).min(1),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, cls, isTeacher } = await getClassAccess(params.id);
  if (!user || !cls) return Response.json({ error: "Not found." }, { status: 404 });
  if (!isTeacher) return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid attendance data." }, { status: 400 });
  const date = new Date(parsed.data.date + "T00:00:00.000Z");

  await db.$transaction(
    parsed.data.records.map((r) =>
      db.attendanceRecord.upsert({
        where: { classId_studentId_date: { classId: cls.id, studentId: r.studentId, date } },
        update: { status: r.status, markedById: user.id },
        create: { classId: cls.id, studentId: r.studentId, date, status: r.status, markedById: user.id },
      })
    )
  );
  return Response.json({ ok: true, count: parsed.data.records.length });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { user, cls, isMember, isTeacher } = await getClassAccess(params.id);
  if (!user || !cls || !isMember) return Response.json({ error: "Not found." }, { status: 404 });

  const records = isTeacher
    ? await db.attendanceRecord.findMany({ where: { classId: cls.id }, include: { student: true }, orderBy: { date: "desc" } })
    : await db.attendanceRecord.findMany({ where: { classId: cls.id, studentId: user.id }, orderBy: { date: "desc" } });
  const students = isTeacher
    ? await db.enrollment.findMany({ where: { classId: cls.id }, include: { user: true } })
    : [];
  return Response.json({ records, students: students.map((s) => ({ id: s.user.id, name: `${s.user.firstName} ${s.user.lastName}` })) });
}
