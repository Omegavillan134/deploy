"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function PostAnnouncement({ classId }: { classId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/classes/${classId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: fd.get("title"), body: fd.get("body") }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(data.error ?? "Failed to post."); return; }
    const list = files;
    setFiles([]);
    (e.target as HTMLFormElement).reset();
    setOpen(false);
    for (const f of list) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("announcementId", data.id);
      await fetch("/api/attachments", { method: "POST", body: fd }).catch(() => {});
    }
    setBusy(false);
    router.refresh();
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm w-full justify-center">
        <Icon name="campaign" className=" text-base" /> Announce something
      </button>
    );

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h3 className="font-bold text-forest-900">Post an announcement</h3>
      {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <input name="title" required placeholder="Title" className="input-field !bg-white" />
      <textarea name="body" required rows={4} placeholder="Write your message… (basic HTML allowed)" className="input-field !bg-white resize-y" />
      <div>
        <label className="text-xs font-bold text-ink block mb-1.5">Attach files (optional)</label>
        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-mint-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-forest-800" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary btn-sm flex-1 disabled:opacity-60">{busy ? "Posting…" : "Post"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button>
      </div>
    </form>
  );
}
