import Link from "next/link";
import CalendarEventForm from "@/components/dashboard/CalendarEventForm";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import Icon from "@/components/ui/Icon";

const KIND_COLORS: Record<string, string> = {
  CLASS: "#4CAF50", HOMEWORK: "#009688", EXAM: "#3F51B5", ACTIVITY: "#009688",
  PRESENTATION: "#FF9800", HOLIDAY: "#AB47BC", ATTENDANCE: "#C8E6C9",
};

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const user = (await getSessionUser())!;

  const classFilter =
    user.role === "TEACHER" ? { class: { teacherId: user.id } }
    : user.role === "ADMIN" ? {}
    : { class: { enrollments: { some: { userId: user.id } } } };

  const base = searchParams.month ? new Date(searchParams.month + "-01") : new Date();
  const year = base.getFullYear(), month = base.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const teacherClasses = user.role !== "STUDENT"
    ? await db.class.findMany({ where: user.role === "ADMIN" ? {} : { teacherId: user.id }, select: { id: true, name: true } })
    : [];

  const [assignments, events, holidays, meetings] = await Promise.all([
    db.assignment.findMany({ where: { dueAt: { not: null }, ...classFilter }, include: { class: true } }),
    db.calendarEvent.findMany({ where: classFilter }),
    db.holiday.findMany(),
    db.classMeeting.findMany({ where: user.role === "TEACHER" ? { class: { teacherId: user.id } } : user.role === "ADMIN" ? {} : { class: { enrollments: { some: { userId: user.id } } } }, include: { class: true } }),
  ]);

  interface Cell { label: string; color: string; href?: string; title: string }
  const byDay = new Map<number, Cell[]>();
  const push = (d: number, c: Cell) => byDay.set(d, [...(byDay.get(d) ?? []), c]);

  for (const a of assignments) {
    const dt = a.dueAt!;
    if (dt.getFullYear() === year && dt.getMonth() === month)
      push(dt.getDate(), { label: a.title, color: KIND_COLORS.HOMEWORK, title: a.title, href: `/dashboard/classes/${a.classId}/assignments/${a.id}` });
  }
  for (const ev of events) {
    const dt = new Date(ev.startsAt);
    if (dt.getFullYear() === year && dt.getMonth() === month)
      push(dt.getDate(), { label: ev.title, color: ev.color ?? KIND_COLORS[ev.kind] ?? "#009688", title: ev.title });
  }
  for (const h of holidays) {
    const d = new Date(h.date);
    const match = h.recurring ? d.getMonth() === month : d.getFullYear() === year && d.getMonth() === month;
    if (match) push(d.getDate(), { label: h.name, color: KIND_COLORS.HOLIDAY, title: h.name });
  }
  for (const m of meetings) {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() === m.dayOfWeek)
        push(d, { label: `${m.class.name}`, color: "transparent", title: `Class session ${m.startTime}–${m.endTime}`, href: `/dashboard/classes/${m.classId}` });
    }
  }

  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const prev = new Date(year, month - 1, 1).toISOString().slice(0, 7);
  const next = new Date(year, month + 1, 1).toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Calendar</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLORS.HOMEWORK }} /> Homework/Activity</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLORS.EXAM }} /> Exam</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLORS.CLASS }} /> Class session</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLORS.HOLIDAY }} /> Holiday</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/calendar?month=${prev}`} className="btn-outline btn-sm" aria-label="Previous month"><Icon name="chevron_left" className=" text-base" /></Link>
          <span className="text-sm font-bold text-forest-900 w-40 text-center">{base.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          <Link href={`/dashboard/calendar?month=${next}`} className="btn-outline btn-sm" aria-label="Next month"><Icon name="chevron_right" className=" text-base" /></Link>
        </div>
      </div>

      {user.role !== "STUDENT" && (
        <CalendarEventForm classes={teacherClasses} />
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-mint-100 bg-mint-50/60 text-center text-xs font-extrabold tracking-wider text-ink-soft">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <div key={d} className="py-3">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday = day !== null && day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <div key={i} className={`min-h-[110px] border-b border-r border-mint-50 p-1.5 ${day === null ? "bg-mint-50/30" : ""}`}>
                {day !== null && (
                  <>
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-forest-800 text-white" : "text-ink"}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {(byDay.get(day) ?? []).slice(0, 3).map((c, j) => (
                        <Link key={j} href={c.href ?? "#"} title={c.title}
                          className={`block truncate rounded-md px-1.5 py-1 text-[10px] font-bold ${c.color === "transparent" ? "border border-[#C8E6C9] text-forest-700" : "text-white"}`}
                          style={{ background: c.color === "transparent" ? undefined : c.color }}>
                          {c.label}
                        </Link>
                      ))}
                      {(byDay.get(day)?.length ?? 0) > 3 && <p className="text-[10px] text-ink-soft">+{byDay.get(day)!.length - 3} more</p>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
