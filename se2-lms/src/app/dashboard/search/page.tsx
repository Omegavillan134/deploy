import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import Icon from "@/components/ui/Icon";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = (await getSessionUser())!;
  const q = (searchParams.q ?? "").trim();
  const term = q.length >= 2 ? q : null;

  let classes: any[] = [], assignments: any[] = [], people: any[] = [];
  if (term) {
    const contains = { contains: term, mode: "insensitive" as const };

    const myClassIds =
      user.role === "ADMIN"
        ? undefined
        : user.role === "TEACHER"
        ? (await db.class.findMany({ where: { teacherId: user.id }, select: { id: true } })).map((c) => c.id)
        : (await db.enrollment.findMany({ where: { userId: user.id }, select: { classId: true } })).map((e) => e.classId);

    const classScope = myClassIds ? { id: { in: myClassIds } } : {};
    const enrollmentScope = myClassIds ? { classId: { in: myClassIds } } : {};

    [classes, assignments, people] = await Promise.all([
      db.class.findMany({ where: { ...classScope, OR: [{ name: contains }, { section: contains }] }, take: 10 }),
      db.assignment.findMany({ where: { ...enrollmentScope, OR: [{ title: contains }, { instructions: contains }] }, include: { class: true }, take: 10 }),
      db.user.findMany({
        where: {
          OR: [{ firstName: contains }, { lastName: contains }, { email: contains }],
          ...(user.role !== "ADMIN" ? { enrollments: { some: { classId: { in: myClassIds ?? [] } } } } : {}),
        },
        take: 10,
      }),
    ]);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Search</h1>
        <p className="text-sm text-ink-soft mt-1">Find classes, assignments, and people.</p>
      </div>

      <form action="/dashboard/search" method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search…"
          className="input-field !bg-white flex-1"
          aria-label="Search query"
        />
        <button className="btn-primary btn-sm !px-5" type="submit">
          <Icon name="search" className=" text-base" />
        </button>
      </form>

      {term && (
        <>
          <section>
            <h2 className="mb-3 text-sm font-extrabold tracking-widest text-ink-soft uppercase">Classes · {classes.length}</h2>
            {classes.length === 0 && <p className="text-sm text-ink-soft">No matches.</p>}
            <div className="space-y-2">
              {classes.map((c) => (
                <Link key={c.id} href={`/dashboard/classes/${c.id}`} className="card block p-4 hover:shadow-float transition-all">
                  <p className="text-sm font-bold text-ink">{c.name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{c.section}</p>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-extrabold tracking-widest text-ink-soft uppercase">Assignments · {assignments.length}</h2>
            {assignments.length === 0 && <p className="text-sm text-ink-soft">No matches.</p>}
            <div className="space-y-2">
              {assignments.map((a) => (
                <Link key={a.id} href={`/dashboard/classes/${a.classId}/assignments/${a.id}`} className="card block p-4 hover:shadow-float transition-all">
                  <p className="text-sm font-bold text-ink">{a.title}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{a.class.name}</p>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-extrabold tracking-widest text-ink-soft uppercase">People · {people.length}</h2>
            {people.length === 0 && <p className="text-sm text-ink-soft">No matches.</p>}
            <div className="space-y-2">
              {people.map((p) => (
                <div key={p.id} className="card flex items-center gap-3 p-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-mint-100 text-forest-800 font-bold text-xs">
                    {p.firstName[0]}{p.lastName[0]}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-ink-soft">{p.email}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-mint-50 px-2.5 py-1 text-[11px] font-bold text-forest-700">{p.role}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {!term && q && <p className="text-sm text-ink-soft">Type at least 2 characters to search.</p>}
    </div>
  );
}
