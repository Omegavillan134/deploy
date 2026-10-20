import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

const schema = z.object({ code: z.string().min(4).max(12) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT")
    return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid class code." }, { status: 400 });

  const cls = await db.class.findUnique({ where: { code: parsed.data.code } });
  if (!cls) return Response.json({ error: "Class code not found." }, { status: 404 });

  await db.enrollment.upsert({
    where: { classId_userId: { classId: cls.id, userId: user.id } },
    update: {},
    create: { classId: cls.id, userId: user.id },
  });
  return Response.json({ ok: true, classId: cls.id });
}
