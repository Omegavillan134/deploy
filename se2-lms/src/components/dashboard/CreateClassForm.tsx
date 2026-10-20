"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function CreateClassForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), section: fd.get("section"), description: fd.get("description") }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to create class."); return; }
    setOpen(false);
    router.refresh();
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm">
        <Icon name="add" className=" text-base" /> Create class
      </button>
    );

  return (
    <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
      <h3 className="font-bold text-forest-900">Create a class</h3>
      {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <input name="name" required placeholder="Class name (e.g. CS 301 — Software Engineering)" className="input-field !bg-white" />
      <input name="section" placeholder="Section (e.g. BSCS-3A)" className="input-field !bg-white" />
      <input name="description" placeholder="Description (optional)" className="input-field !bg-white" />
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary btn-sm flex-1 disabled:opacity-60">{busy ? "Creating…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button>
      </div>
    </form>
  );
}
