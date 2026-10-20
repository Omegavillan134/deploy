import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

const schema = z.object({ name: z.string().min(1).max(120), date: z.string(), recurring: z.boolean().default(false) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Not found." }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid holiday." }, { status: 400 });
  const h = await db.holiday.create({ data: { name: parsed.data.name, date: new Date(parsed.data.date + "T00:00:00.000Z"), recurring: parsed.data.recurring } });
  return Response.json({ ok: true, id: h.id }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Not found." }, { status: 404 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
  await db.holiday.delete({ where: { id } }).catch(() => {});
  return Response.json({ ok: true });
}
