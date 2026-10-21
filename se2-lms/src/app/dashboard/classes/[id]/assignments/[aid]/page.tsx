import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";
import SubmissionForm from "@/components/dashboard/SubmissionForm";
import GradingPanel from "@/components/dashboard/GradingPanel";
import LocalDateTime from "@/components/ui/LocalDateTime";
import Icon from "@/components/ui/Icon";

export default async function AssignmentPage({
  params,
}: {
  params: { id: string; aid: string };
}) {
  const { user, cls, isTeacher, isMember } = await getClassAccess(params.id);
  if (!user) redirect("/login");
  if (!cls || !isMember) notFound();

  const assignment = await db.assignment.findUnique({
    where: { id: params.aid },
    include: {
      attachments: true,
      submissions: {
        include: { student: true, attachments: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!assignment || assignment.classId !== cls.id) notFound();

  const mySubmission = user
    ? assignment.submissions.find((s) => s.studentId === user.id)
    : undefined;
  const overdue = assignment.dueAt && new Date() > assignment.dueAt;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href={`/dashboard/classes/${cls.id}?tab=classwork`} className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:gap-2 transition-all">
        <Icon name="arrow_back" className=" text-base" /> Back to classwork
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="icon-chip bg-sky-50 text-sky-600"><Icon name="assignment" className=" text-[26px]" /></span>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">{assignment.title}</h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              {cls.name} · due {assignment.dueAt ? <LocalDateTime value={assignment.dueAt} /> : "anytime"} · {assignment.points} points
              {overdue && <span className="ml-2 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">past due</span>}
            </p>
          </div>
        </div>
        {assignment.attachments.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-extrabold tracking-widest text-ink-soft">FILES FROM TEACHER</p>
            <ul className="space-y-2">
              {assignment.attachments.map((f) => (
                <li key={f.id}>
                  <a href={`/api/attachments/${f.id}`}
                    className="flex items-center gap-3 rounded-xl border border-mint-100 px-4 py-3 hover:border-forest-700/40 hover:bg-mint-50/50 transition-all">
                    <Icon name="download" className=" text-forest-700" />
                    <span className="flex-1 truncate text-sm font-semibold text-ink">{f.fileName}</span>
                    <span className="text-xs text-ink-soft">{(f.sizeBytes / 1024).toFixed(0)} KB</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {assignment.instructions && (
          <div className="mt-6 rounded-xl bg-mint-50/70 p-5 text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {assignment.instructions}
          </div>
        )}
      </div>

      {isTeacher ? (
        <GradingPanel assignmentId={assignment.id} points={assignment.points} submissions={assignment.submissions.map((s) => ({
          id: s.id,
          studentName: `${s.student.firstName} ${s.student.lastName}`,
          body: s.body,
          status: s.status,
          grade: s.grade,
          feedback: s.feedback,
          submittedAt: s.submittedAt.toISOString(),
          attachments: s.attachments.map((a) => ({ id: a.id, fileName: a.fileName })),
        }))} />
      ) : (
        <section className="card p-6 sm:p-8">
          <h2 className="font-bold text-forest-900">Your submission</h2>
          {mySubmission ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  mySubmission.status === "GRADED" ? "bg-mint-100 text-forest-800"
                  : mySubmission.status === "RETURNED" ? "bg-amber-50 text-amber-700"
                  : "bg-sky-50 text-sky-700"
                }`}>{mySubmission.status.replace("_", " ").toLowerCase()}</span>
                <span className="text-xs text-ink-soft">
                  submitted <LocalDateTime value={mySubmission.submittedAt} />
                </span>
              </div>
              {mySubmission.body && (
                <div className="rounded-xl border border-mint-100 p-4 text-sm text-ink whitespace-pre-wrap">{mySubmission.body}</div>
              )}
              {mySubmission.status === "GRADED" && (
                <div className="rounded-xl bg-mint-50 p-5">
                  <p className="text-3xl font-extrabold text-forest-800">{mySubmission.grade}<span className="text-base text-ink-soft"> / {assignment.points}</span></p>
                  {mySubmission.feedback && <p className="mt-2 text-sm text-ink-soft">{mySubmission.feedback}</p>}
                </div>
              )}
              {mySubmission.status === "RETURNED" && mySubmission.feedback && (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-bold">Returned for revision</p>
                  <p className="mt-1">{mySubmission.feedback}</p>
                </div>
              )}
              <SubmissionForm assignmentId={assignment.id} existing={mySubmission.body ?? ""} resubmit={mySubmission.status === "RETURNED"} />
            </div>
          ) : (
            <SubmissionForm assignmentId={assignment.id} />
          )}
        </section>
      )}
    </div>
  );
}
