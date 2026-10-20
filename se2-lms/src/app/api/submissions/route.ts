import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { notify } from "@/lib/notify";

const schema = z.object({
  assignmentId: z.string().min(1),
  body: z.string().min(1).max(20000),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT")
    return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Write something before submitting." }, { status: 400 });

  const assignment = await db.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { class: true },
  });
  if (!assignment) return Response.json({ error: "Not found." }, { status: 404 });

  const enrolled = await db.enrollment.findUnique({
    where: { classId_userId: { classId: assignment.classId, userId: user.id } },
  });
  if (!enrolled) return Response.json({ error: "Not found." }, { status: 404 });

  const existing = await db.submission.findFirst({
    where: { assignmentId: assignment.id, studentId: user.id },
  });
  const late = assignment.dueAt ? new Date() > assignment.dueAt : false;

  const submission = existing
    ? await db.submission.update({
        where: { id: existing.id },
        data: { body: parsed.data.body, status: late ? "LATE" : "SUBMITTED", submittedAt: new Date() },
      })
    : await db.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: user.id,
          body: parsed.data.body,
          status: late ? "LATE" : "SUBMITTED",
        },
      });

  await notify(assignment.class.teacherId, "Submission received", `${user.firstName} ${user.lastName} submitted "${assignment.title}"`, `/dashboard/classes/${assignment.classId}/assignments/${assignment.id}`);
  return Response.json({ ok: true, id: submission.id }, { status: 201 });
}
