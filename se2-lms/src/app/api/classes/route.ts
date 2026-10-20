import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

const schema = z.object({
  name: z.string().min(3).max(120),
  section: z.string().max(30).optional(),
  description: z.string().max(500).optional(),
});

const genCode = () => crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 6);

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN"))
    return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid class details." }, { status: 400 });

  const cls = await db.class.create({
    data: { ...parsed.data, section: parsed.data.section || undefined, teacherId: user.id, code: genCode() },
  });
  return Response.json({ ok: true, classId: cls.id, code: cls.code }, { status: 201 });
}
