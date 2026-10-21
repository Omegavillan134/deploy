"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function CreateAssignment({ classId }: { classId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (assignmentId: string, list: File[]) => {
    setUploading(true);
    for (const f of list) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("assignmentId", assignmentId);
      await fetch("/api/attachments", { method: "POST", body: fd }).catch(() => {});
    }
    setUploading(false);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const due = fd.get("dueAt") ? new Date(String(fd.get("dueAt"))).toISOString() : null;
    const res = await fetch(`/api/classes/${classId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        instructions: fd.get("instructions"),
        points: Number(fd.get("points") || 100),
        dueAt: due,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(data.error ?? "Failed to create."); return; }
    const list = files;
    setFiles([]);
    (e.target as HTMLFormElement).reset();
    setOpen(false);
    if (list.length) await uploadFiles(data.id, list);
    setBusy(false);
    router.refresh();
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm w-full justify-center">
        <Icon name="assignment_add" className=" text-base" /> Create assignment
      </button>
    );

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h3 className="font-bold text-forest-900">Create assignment</h3>
      {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <input name="title" required placeholder="Title" className="input-field !bg-white" />
      <textarea name="instructions" rows={4} placeholder="Instructions (optional)" className="input-field !bg-white resize-y" />
      <div className="grid grid-cols-3 gap-4">
        <label className="text-xs font-bold text-ink">Points
          <input name="points" type="number" min={0} defaultValue={100} className="input-field !bg-white mt-1.5" />
        </label>
        <label className="text-xs col-span-2 font-bold text-ink">Due date
          <input name="dueAt" type="datetime-local" className="input-field !bg-white mt-1.5" />
        </label>
      </div>
      <div>
        <label className="text-xs font-bold text-ink block mb-1.5">Files for students (optional)</label>
        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-mint-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-forest-800" />
        {files.length > 0 && <p className="mt-1 text-[11px] text-ink-soft">{files.length} file(s) selected — uploaded when you click Create</p>}
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy || uploading} className="btn-primary btn-sm flex-1 disabled:opacity-60">{busy || uploading ? (uploading ? "Uploading files…" : "Creating…") : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button>
      </div>
    </form>
  );
}
