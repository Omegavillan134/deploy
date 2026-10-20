"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function AddMaterial({ classId }: { classId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/classes/${classId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: fd.get("title"), kind: fd.get("kind"), url: fd.get("url") }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to add."); return; }
    (e.target as HTMLFormElement).reset();
    setOpen(false);
    router.refresh();
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-outline btn-sm w-full justify-center">
        <Icon name="upload_file" className=" text-base" /> Add material
      </button>
    );

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h3 className="font-bold text-forest-900">Add material</h3>
      {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <input name="title" required placeholder="Title (e.g. Week 4 slides)" className="input-field" />
      <div className="grid grid-cols-2 gap-4">
        <select name="kind" className="select-field">
          <option value="link">Link</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="doc">Document</option>
        </select>
        <input name="url" type="url" required placeholder="https://…" className="input-field" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary btn-sm flex-1 disabled:opacity-60">{busy ? "Adding…" : "Add"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button>
      </div>
    </form>
  );
}
