"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function CalendarEventForm({ classes }: { classes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        kind: fd.get("kind"),
        date: fd.get("date"),
        time: fd.get("time"),
        classId: fd.get("classId") || undefined,
        description: fd.get("description"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Could not add event."); return; }
    (e.target as HTMLFormElement).reset();
    setOpen(false);
    router.refresh();
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-outline btn-sm">
        <Icon name="add" className=" text-base" /> Add event
      </button>
    );

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-end gap-3 p-5">
      <input name="title" required placeholder="Event title" className="input-field !bg-white flex-1 min-w-[180px]" />
      <select name="kind" className="select-field !w-auto">
        <option value="ACTIVITY">Activity</option>
        <option value="CLASS">Class session</option>
        <option value="HOMEWORK">Homework</option>
        <option value="EXAM">Exam</option>
        <option value="PRESENTATION">Presentation</option>
      </select>
      <input name="date" type="date" required className="input-field !w-auto" />
      <input name="time" type="time" className="input-field !w-auto" />
      <select name="classId" className="select-field !w-auto">
        <option value="">All my classes</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {error && <span role="alert" className="w-full text-xs font-semibold text-red-700">{error}</span>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary btn-sm disabled:opacity-50">{busy ? "…" : "Add"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button>
      </div>
    </form>
  );
}
