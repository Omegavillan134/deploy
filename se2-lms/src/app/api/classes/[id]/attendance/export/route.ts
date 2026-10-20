import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { user, cls, isTeacher } = await getClassAccess(params.id);
  if (!user || !cls) return new Response("Not found.", { status: 404 });
  if (!isTeacher) return new Response("Teachers only.", { status: 404 });

  const records = await db.attendanceRecord.findMany({ where: { classId: cls.id }, include: { student: true }, orderBy: [{ date: "asc" }] });
  const rows = ["Student,Email,Date,Status", ...records.map((r) =>
    `"${r.student.lastName}, ${r.student.firstName}","${r.student.email}","${r.date.toISOString().slice(0, 10)}","${r.status}"`)];
  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="attendance-${cls.code}.csv"`,
    },
  });
}
