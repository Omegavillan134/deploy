import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";
import AttendancePanel from "@/components/dashboard/AttendancePanel";
import Icon from "@/components/ui/Icon";

const ATT_COLORS: Record<string, string> = {
  PRESENT: "#4CAF50", ABSENT: "#EF5350", LATE: "#FF9800", EXCUSED: "#42A5F5",
};

export default async function AttendancePage({ params }: { params: { id: string } }) {
  const { user, cls, isTeacher, isMember } = await getClassAccess(params.id);
  if (!user) redirect("/login");
  if (!cls || !isMember) notFound();

  const records = isTeacher
    ? await db.attendanceRecord.findMany({ where: { classId: cls.id }, include: { student: true }, orderBy: { date: "desc" } })
    : await db.attendanceRecord.findMany({ where: { classId: cls.id, studentId: user.id }, include: { student: true }, orderBy: { date: "desc" } });
  const students = isTeacher
    ? (await db.enrollment.findMany({ where: { classId: cls.id }, include: { user: true } })).map((e) => ({ id: e.user.id, name: `${e.user.firstName} ${e.user.lastName}` }))
    : [];

  return (
    <div className="max-w-4xl space-y-6">
      <Link href={`/dashboard/classes/${cls.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:gap-2 transition-all">
        <Icon name="arrow_back" className=" text-base" /> Back to {cls.name}
      </Link>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-ink-soft mt-1">Color-coded: <span className="font-bold" style={{ color: ATT_COLORS.PRESENT }}>present</span> · <span className="font-bold" style={{ color: ATT_COLORS.ABSENT }}>absent</span> · <span className="font-bold" style={{ color: ATT_COLORS.LATE }}>late</span> · <span className="font-bold" style={{ color: ATT_COLORS.EXCUSED }}>excused</span></p>
        </div>
        {isTeacher && <a href={`/api/classes/${cls.id}/attendance/export`} className="btn-outline btn-sm"><Icon name="download" className=" text-base" /> Export CSV</a>}
      </div>
      <AttendancePanel classId={cls.id} isTeacher={isTeacher}
        students={students}
        records={records.map((r) => ({ id: r.id, studentId: r.studentId, date: r.date.toISOString().slice(0, 10), status: r.status, name: isTeacher ? `${r.student.firstName} ${r.student.lastName}` : undefined }))} />
    </div>
  );
}
