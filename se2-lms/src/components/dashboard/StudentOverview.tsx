import Link from "next/link";
import { db } from "@/lib/db";
import Icon from "@/components/ui/Icon";

export default async function StudentOverview({ userId }: { userId: string }) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: { class: { include: { teacher: true } } },
  });
  const classIds = enrollments.map((e) => e.classId);

  const now = new Date();
  const [upcoming, graded, pendingCount] = await Promise.all([
    db.assignment.findMany({
      where: { classId: { in: classIds }, dueAt: { gte: now } },
      include: { class: true },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    db.submission.findMany({
      where: { studentId: userId, status: "GRADED", grade: { not: null } },
      include: { assignment: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    db.submission.count({ where: { studentId: userId, status: "RETURNED" } }),
  ]);

  const submittedAssignmentIds = (
    await db.submission.findMany({ where: { studentId: userId }, select: { assignmentId: true } })
  ).map((s) => s.assignmentId);
  const todo = upcoming.filter((a) => !submittedAssignmentIds.includes(a.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">My classes</h1>
        <p className="text-sm text-ink-soft mt-1">Jump back into your coursework.</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="card p-10 text-center">
          <Icon name="school" className=" text-4xl text-forest-700" />
          <p className="mt-3 font-semibold text-ink">No classes yet</p>
          <p className="text-sm text-ink-soft mt-1">Join a class with a class code from your teacher.</p>
          <Link href="/dashboard/classes" className="btn-primary btn-sm mt-5 inline-flex">Join a class</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <Link key={e.classId} href={`/dashboard/classes/${e.classId}`} className="card p-6 hover:shadow-float hover:-translate-y-0.5 transition-all block">
              <p className="text-xs font-bold text-forest-700">{e.class.section}</p>
              <h3 className="mt-1 font-bold text-forest-900 leading-snug">{e.class.name}</h3>
              <p className="mt-2 text-xs text-ink-soft">{e.class.teacher.firstName} {e.class.teacher.lastName}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-bold text-forest-900 flex items-center gap-2">
            <Icon name="pending_actions" className=" text-forest-700" /> To do
          </h2>
          {todo.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">All caught up. Nothing due.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {todo.map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/classes/${a.classId}/assignments/${a.id}`} className="block rounded-xl border border-mint-100 p-4 hover:border-forest-700/40 transition-colors">
                    <p className="text-sm font-semibold text-ink">{a.title}</p>
                    <p className="text-xs text-ink-soft mt-1">{a.class.name} · due {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : "—"} · {a.points} pts</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-bold text-forest-900 flex items-center gap-2">
            <Icon name="grading" className=" text-forest-700" /> Recent grades
          </h2>
          {graded.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No grades yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {graded.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-mint-100 p-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.assignment.title}</p>
                    {s.feedback && <p className="text-xs text-ink-soft mt-1">{s.feedback}</p>}
                  </div>
                  <span className="rounded-full bg-mint-100 px-3 py-1 text-sm font-bold text-forest-800">{s.grade}</span>
                </li>
              ))}
            </ul>
          )}
          {pendingCount > 0 && (
            <p className="mt-4 text-xs font-semibold text-amber-700">{pendingCount} submission(s) returned for revision — check your assignments.</p>
          )}
        </section>
      </div>
    </div>
  );
}
