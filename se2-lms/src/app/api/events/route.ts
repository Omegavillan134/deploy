import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

const schema = z.object({
  title: z.string().min(1).max(140),
  kind: z.enum(["CLASS", "HOMEWORK", "EXAM", "ACTIVITY", "PRESENTATION"]).default("ACTIVITY"),
  date: z.string(),
  time: z.string().optional(),
  classId: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role === "STUDENT") return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid event." }, { status: 400 });

  if (parsed.data.classId) {
    const cls = await db.class.findUnique({ where: { id: parsed.data.classId } });
    if (!cls || (cls.teacherId !== user.id && user.role !== "ADMIN"))
      return Response.json({ error: "Not found." }, { status: 404 });
  }

  const startsAt = new Date(parsed.data.date + "T" + (parsed.data.time || "08:00") + ":00");
  const ev = await db.calendarEvent.create({
    data: {
      title: parsed.data.title,
      kind: parsed.data.kind,
      description: parsed.data.description,
      classId: parsed.data.classId ?? null,
      createdById: user.id,
      startsAt,
    },
  });
  return Response.json({ ok: true, id: ev.id }, { status: 201 });
}
