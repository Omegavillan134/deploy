import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { getClassAccess } from "@/lib/class-access";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return new Response("Sign in first.", { status: 404 });

  const att = await db.attachment.findUnique({
    where: { id: params.id },
    include: {
      assignment: true,
      submission: { include: { assignment: true } },
      announcement: true,
    },
  });
  if (!att || !att.data) return new Response("Not found.", { status: 404 });

  const classId = att.assignment?.classId ?? att.announcement?.classId ?? att.submission?.assignment.classId ?? null;
  const isOwner = att.submission?.studentId === user.id;

  let ok = user.role === "ADMIN" || isOwner;
  if (!ok && classId) ok = (await getClassAccess(classId)).isMember;
  if (!ok) return new Response("Forbidden.", { status: 404 });

  const bytes = Buffer.from(att.data, "base64");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(att.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
