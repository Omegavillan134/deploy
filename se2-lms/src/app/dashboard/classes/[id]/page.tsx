import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";
import PostAnnouncement from "@/components/dashboard/class/PostAnnouncement";
import CreateAssignment from "@/components/dashboard/class/CreateAssignment";
import AddMaterial from "@/components/dashboard/class/AddMaterial";
import Icon from "@/components/ui/Icon";

export default async function ClassPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const { user, cls, isTeacher, isMember } = await getClassAccess(params.id);
  if (!user) redirect("/login");
  if (!cls) notFound();
  if (!isMember) {
    return (
      <div className="card p-10 text-center">
        <Icon name="lock" className=" text-4xl text-amber-600" />
        <p className="mt-3 font-semibold text-ink">You are not enrolled in this class.</p>
        <Link href="/dashboard/classes" className="btn-outline btn-sm mt-5 inline-flex">Back to classes</Link>
      </div>
    );
  }

  const tab = searchParams.tab ?? "stream";
  const [announcements, assignments, materials, enrollments] = await Promise.all([
    db.announcement.findMany({ where: { classId: cls.id }, orderBy: { createdAt: "desc" } }),
    db.assignment.findMany({ where: { classId: cls.id }, orderBy: { createdAt: "desc" } }),
    db.material.findMany({ where: { classId: cls.id }, orderBy: { createdAt: "desc" } }),
    db.enrollment.findMany({ where: { classId: cls.id }, include: { user: true } }),
  ]);

  const tabs = [
    { id: "stream", label: "Stream" },
    { id: "classwork", label: "Classwork" },
    { id: "people", label: "People" },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-white to-mint-50/60">
        <p className="text-xs font-bold text-forest-700">{cls.section} {isTeacher && <>· class code <span className="rounded-lg bg-mint-100 px-2 py-0.5">{cls.code}</span></>}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-forest-900 tracking-tight">{cls.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">{cls.teacher.firstName} {cls.teacher.lastName}</p>
        {cls.description && <p className="mt-3 text-sm text-ink-soft max-w-2xl">{cls.description}</p>}
      </div>

      <div className="flex gap-2 border-b border-mint-100 pb-3" role="tablist" aria-label="Class sections">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/classes/${cls.id}?tab=${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-forest-800 text-white shadow-card" : "text-ink-soft hover:bg-mint-50 hover:text-forest-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "stream" && (
        <div className="max-w-3xl space-y-5">
          {isTeacher && <PostAnnouncement classId={cls.id} />}
          {announcements.length === 0 && <p className="text-sm text-ink-soft">No announcements yet.</p>}
          {announcements.map((a) => (
            <article key={a.id} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-mint-100 text-forest-700">
                  <Icon name="campaign" className="" />
                </span>
                <div>
                  <p className="font-bold text-ink">{a.title}</p>
                  <p className="text-xs text-ink-soft">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-ink leading-relaxed" dangerouslySetInnerHTML={{ __html: a.body }} />
            </article>
          ))}
        </div>
      )}

      {tab === "classwork" && (
        <div className="max-w-3xl space-y-6">
          {isTeacher && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CreateAssignment classId={cls.id} />
              <AddMaterial classId={cls.id} />
            </div>
          )}
          <section>
            <h2 className="mb-3 text-sm font-extrabold tracking-widest text-ink-soft uppercase">Assignments</h2>
            {assignments.length === 0 && <p className="text-sm text-ink-soft">No assignments yet.</p>}
            <div className="space-y-3">
              {assignments.map((a) => (
                <Link key={a.id} href={`/dashboard/classes/${cls.id}/assignments/${a.id}`} className="card flex items-center gap-4 p-5 hover:shadow-float transition-all">
                  <span className="icon-chip bg-sky-50 text-sky-600"><Icon name="assignment" className="" /></span>
                  <div className="flex-1">
                    <p className="font-semibold text-ink">{a.title}</p>
                    <p className="text-xs text-ink-soft mt-0.5">due {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : "—"} · {a.points} pts</p>
                  </div>
                  <Icon name="chevron_right" className=" text-ink-soft" />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-extrabold tracking-widest text-ink-soft uppercase">Materials</h2>
            {materials.length === 0 && <p className="text-sm text-ink-soft">No materials yet.</p>}
            <div className="space-y-3">
              {materials.map((m) => (
                <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-5 hover:shadow-float transition-all">
                  <span className="icon-chip bg-violet-50 text-violet-600"><Icon name={String(m.kind === "link" ? "link" : m.kind === "video" ? "play_circle" : "description")} className="" /></span>
                  <div className="flex-1">
                    <p className="font-semibold text-ink">{m.title}</p>
                    <p className="text-xs text-ink-soft mt-0.5 capitalize">{m.kind}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "people" && (
        <div className="max-w-3xl">
          <section className="card p-6">
            <h2 className="font-bold text-forest-900">Teacher</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-forest-800 text-white font-bold text-sm">
                {cls.teacher.firstName[0]}{cls.teacher.lastName[0]}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{cls.teacher.firstName} {cls.teacher.lastName}</p>
                <p className="text-xs text-ink-soft">{cls.teacher.email}</p>
              </div>
            </div>
          </section>
          <section className="card mt-5 p-6">
            <h2 className="font-bold text-forest-900">Students · {enrollments.length}</h2>
            <ul className="mt-4 divide-y divide-mint-50">
              {enrollments.filter((e) => e.user.id !== cls.teacherId).map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-mint-100 text-forest-800 font-bold text-xs">
                    {e.user.firstName[0]}{e.user.lastName[0]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{e.user.firstName} {e.user.lastName}</p>
                    <p className="text-xs text-ink-soft">{e.user.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
