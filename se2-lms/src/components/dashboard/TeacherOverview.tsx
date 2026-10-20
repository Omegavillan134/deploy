import Link from "next/link";
import { db } from "@/lib/db";
import CreateClassForm from "@/components/dashboard/CreateClassForm";
import Icon from "@/components/ui/Icon";

export default async function TeacherOverview({ userId }: { userId: string }) {
  const classes = await db.class.findMany({
    where: { teacherId: userId },
    include: { _count: { select: { enrollments: true, assignments: true } } },
  });
  const classIds = classes.map((c) => c.id);
  const toGrade = await db.submission.count({
    where: { assignment: { classId: { in: classIds } }, status: { in: ["SUBMITTED", "LATE"] } },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Teaching</h1>
          <p className="text-sm text-ink-soft mt-1">{toGrade} submission{toGrade === 1 ? "" : "s"} waiting for grades.</p>
        </div>
        <CreateClassForm />
      </div>

      {classes.length === 0 ? (
        <div className="card p-10 text-center">
          <Icon name="school" className=" text-4xl text-forest-700" />
          <p className="mt-3 font-semibold text-ink">No classes yet</p>
          <p className="text-sm text-ink-soft mt-1">Create your first class to get a shareable class code.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Link key={c.id} href={`/dashboard/classes/${c.id}`} className="card p-6 hover:shadow-float hover:-translate-y-0.5 transition-all block">
              <p className="text-xs font-bold text-forest-700">{c.section}</p>
              <h3 className="mt-1 font-bold text-forest-900 leading-snug">{c.name}</h3>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-lg bg-mint-50 px-2.5 py-1 text-[11px] font-bold text-forest-700">code: {c.code}</span>
                <span className="text-[11px] text-ink-soft">{c._count.enrollments} students · {c._count.assignments} assignments</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
