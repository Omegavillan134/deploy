import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { getClassAccess } from "@/lib/class-access";

const MAX_SIZE = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const assignmentId = form?.get("assignmentId")?.toString();
  const submissionId = form?.get("submissionId")?.toString();
  const announcementId = form?.get("announcementId")?.toString();
  if (!(file instanceof File) || (!assignmentId && !submissionId && !announcementId))
    return Response.json({ error: "File and a target (assignment/submission/announcement) are required." }, { status: 400 });
  if (file.size > MAX_SIZE) return Response.json({ error: "File exceeds the 8MB limit." }, { status: 413 });

  let classId: string | null = null;
  if (assignmentId) {
    const a = await db.assignment.findUnique({ where: { id: assignmentId }, include: { class: true } });
    if (!a) return Response.json({ error: "Not found." }, { status: 404 });
    if (a.class.teacherId !== user.id && user.role !== "ADMIN")
      return Response.json({ error: "Not found." }, { status: 404 });
    classId = a.classId;
  } else if (submissionId) {
    const s = await db.submission.findUnique({ where: { id: submissionId }, include: { assignment: true } });
    if (!s || s.studentId !== user.id) return Response.json({ error: "Not found." }, { status: 404 });
    classId = s.assignment.classId;
  } else if (announcementId) {
    const an = await db.announcement.findUnique({ where: { id: announcementId }, include: { class: true } });
    if (!an) return Response.json({ error: "Not found." }, { status: 404 });
    if (an.class.teacherId !== user.id && user.role !== "ADMIN")
      return Response.json({ error: "Not found." }, { status: 404 });
    classId = an.classId;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const BLOCKED_EXT = new Set(["exe", "bat", "cmd", "com", "msi", "scr", "ps1", "vbs", "js", "jar", "app"]);
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (BLOCKED_EXT.has(ext))
    return Response.json({ error: "This file type is not allowed." }, { status: 422 });
  const sniff = (b: Buffer): string =>
    b.subarray(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46])) ? "pdf"
    : b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? "png"
    : b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "jpg"
    : b.subarray(0, 2).equals(Buffer.from([0x50, 0x4b])) ? "zip"
    : "text";
  const kind = sniff(buffer);
  if (kind === "pdf" && ext !== "pdf") return Response.json({ error: "File content does not match its extension." }, { status: 422 });
  if (kind === "png" && !["png"].includes(ext)) return Response.json({ error: "File content does not match its extension." }, { status: 422 });
  if (kind === "jpg" && !["jpg", "jpeg"].includes(ext)) return Response.json({ error: "File content does not match its extension." }, { status: 422 });
  if (kind === "zip" && !["docx", "xlsx", "pptx", "zip"].includes(ext)) return Response.json({ error: "File content does not match its extension." }, { status: 422 });

  const att = await db.attachment.create({
    data: {
      fileUrl: "db://",
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      data: buffer.toString("base64"),
      assignmentId: assignmentId ?? null,
      submissionId: submissionId ?? null,
      announcementId: announcementId ?? null,
    },
  });
  return Response.json({ ok: true, id: att.id, fileName: att.fileName, sizeBytes: att.sizeBytes, classId }, { status: 201 });
}
