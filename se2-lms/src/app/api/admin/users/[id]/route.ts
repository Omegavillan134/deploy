import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { notify } from "@/lib/notify";

const schema = z
  .object({
    role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
    approved: z.boolean().optional(),
  })
  .refine((d) => d.role !== undefined || d.approved !== undefined, { message: "Nothing to update." });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") return Response.json({ error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid update." }, { status: 400 });
  if (me.id === params.id && parsed.data.role) return Response.json({ error: "Not found." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.approved !== undefined) data.approved = parsed.data.approved;

  const updated = await db.user.update({ where: { id: params.id }, data });

  if (parsed.data.approved === true)
    await notify(updated.id, "Account approved", "Your teacher account has been approved. You can now sign in.", "/login");

  return Response.json({ ok: true });
}
