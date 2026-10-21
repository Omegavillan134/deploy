import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import CreateClassForm from "@/components/dashboard/CreateClassForm";
import JoinClassForm from "@/components/dashboard/JoinClassForm";
import Icon from "@/components/ui/Icon";

export default async function ClassesPage() {
  const user = (await getSessionUser())!;

  const classes = user.role === "TEACHER"
    ? await db.class.findMany({ where: { teacherId: user.id }, include: { _count: { select: { enrollments: true } } } })
    : user.role === "ADMIN"
    ? await db.class.findMany({ include: { teacher: true, _count: { select: { enrollments: true } } } })
    : (await db.enrollment.findMany({
        where: { userId: user.id },
        include: { class: { include: { teacher: true, _count: { select: { enrollments: true } } } } },
      })).map((e) => e.class);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">
            {user.role === "STUDENT" ? "My classes" : user.role === "ADMIN" ? "All classes" : "My classes"}
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            {classes.length} class{classes.length === 1 ? "" : "es"}
          </p>
        </div>
        {user.role === "STUDENT" && <JoinClassForm />}
        {(user.role === "TEACHER" || user.role === "ADMIN") && <CreateClassForm />}
      </div>

      {classes.length === 0 ? (
        <div className="card p-10 text-center">
          <Icon name="school" className=" text-4xl text-forest-700" />
          <p className="mt-3 font-semibold text-ink">Nothing here yet</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c: any) => (
            <Link key={c.id} href={`/dashboard/classes/${c.id}`} className="card p-6 hover:shadow-float hover:-translate-y-0.5 transition-all block">
              <p className="text-xs font-bold text-forest-700">{c.section}</p>
              <h3 className="mt-1 font-bold text-forest-900 leading-snug">{c.name}</h3>
              <p className="mt-2 text-xs text-ink-soft">
                {user.role === "ADMIN" ? `${c.teacher.firstName} ${c.teacher.lastName} · ` : ""}
                {c._count.enrollments} students
              </p>
              {"code" in c && (user.role !== "STUDENT") && (
                <span className="mt-3 inline-block rounded-lg bg-mint-50 px-2.5 py-1 text-[11px] font-bold text-forest-700">code: {c.code}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
