import { z } from "zod";
import { db } from "@/lib/db";
import { getClassAccess } from "@/lib/class-access";

const schema = z.object({
  title: z.string().min(1).max(140),
  kind: z.enum(["pdf", "link", "video", "doc"]).default("link"),
  url: z.string().url().max(1000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, cls, isTeacher } = await getClassAccess(params.id);
  if (!user || !cls) return Response.json({ error: "Not found." }, { status: 404 });
  if (!isTeacher) return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Title and a valid URL are required." }, { status: 400 });

  const m = await db.material.create({ data: { classId: cls.id, ...parsed.data } });
  return Response.json({ ok: true, id: m.id }, { status: 201 });
}
