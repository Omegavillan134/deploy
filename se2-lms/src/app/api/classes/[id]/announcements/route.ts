import { z } from "zod";
import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";
import { notifyMany } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ title: z.string().min(1).max(140), body: z.string().min(1).max(10000) });

function sanitize(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/on\w+="[^"]*"/gi, "");
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!rateLimit("announce", 30, 60_000).ok) return Response.json({ error: "Slow down." }, { status: 429 });
  const { user, cls, isTeacher } = await getClassAccess(params.id);
  if (!user || !cls) return Response.json({ error: "Not found." }, { status: 404 });
  if (!isTeacher) return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Title and message are required." }, { status: 400 });

  const ann = await db.announcement.create({
    data: { classId: cls.id, authorId: user.id, title: parsed.data.title, body: sanitize(parsed.data.body) },
  });

  const students = await db.enrollment.findMany({ where: { classId: cls.id }, select: { userId: true } });
  await notifyMany(
    students.map((s) => s.userId),
    `New announcement in ${cls.name}`,
    parsed.data.title,
    `/dashboard/classes/${cls.id}`
  );
  return Response.json({ ok: true, id: ann.id }, { status: 201 });
}
