import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { notify } from "@/lib/notify";
import { sendMail } from "@/lib/mailer";

const schema = z.object({
  grade: z.coerce.number().min(0).optional(),
  feedback: z.string().max(5000).optional(),
  action: z.enum(["grade", "return"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN"))
    return Response.json({ error: "Only teachers can grade." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid grading payload." }, { status: 400 });

  const submission = await db.submission.findUnique({
    where: { id: params.id },
    include: { assignment: { include: { class: true } }, student: true },
  });
  if (!submission) return Response.json({ error: "Submission not found." }, { status: 404 });
  if (submission.assignment.class.teacherId !== user.id && user.role !== "ADMIN")
    return Response.json({ error: "Not found." }, { status: 404 });

  const { grade, feedback, action } = parsed.data;
  if (action === "grade" && grade === undefined)
    return Response.json({ error: "Enter a grade first." }, { status: 400 });

  const updated = await db.submission.update({
    where: { id: submission.id },
    data: action === "grade"
      ? { grade, feedback: feedback ?? submission.feedback, status: "GRADED" }
      : { feedback: feedback ?? submission.feedback, status: "RETURNED", returnedAt: new Date() },
  });

  const link = `/dashboard/classes/${submission.assignment.classId}/assignments/${submission.assignment.id}`;
  if (action === "grade") {
    await notify(submission.studentId, `Grade posted: ${submission.assignment.title}`, `You scored ${grade} / ${submission.assignment.points}${feedback ? ` — ${feedback}` : ""}`, link);
    try {
      await sendMail(submission.student.email, `Grade posted: ${submission.assignment.title}`, `<p>You scored <b>${grade} / ${submission.assignment.points}</b> on <b>${submission.assignment.title}</b>.</p>${feedback ? `<p>Feedback: ${feedback}</p>` : ""}`);
    } catch {  }
  } else {
    await notify(submission.studentId, `Returned for revision: ${submission.assignment.title}`, feedback ?? "Your teacher returned your work.", link);
  }

  return Response.json({ ok: true, status: updated.status });
}
