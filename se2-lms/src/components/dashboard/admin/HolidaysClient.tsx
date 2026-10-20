"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function HolidaysClient({ holidays }: { holidays: { id: string; name: string; date: string; recurring: boolean }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/holidays", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), date: fd.get("date"), recurring: fd.get("recurring") === "on" }),
    });
    setBusy(false);
    if (res.ok) { (e.target as HTMLFormElement).reset(); router.refresh(); }
  };

  const remove = async (id: string) => {
    await fetch("/api/admin/holidays", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Holidays</h1>
        <p className="text-sm text-ink-soft mt-1">Shown in purple on every user&apos;s calendar.</p>
      </div>
      <form onSubmit={add} className="card flex flex-wrap items-end gap-3 p-6">
        <label className="flex-1 min-w-[160px] text-xs font-bold text-ink">Name
          <input name="name" required placeholder="e.g. Independence Day" className="input-field !bg-white mt-1.5" /></label>
        <label className="text-xs font-bold text-ink">Date
          <input name="date" type="date" required className="input-field !bg-white mt-1.5" /></label>
        <label className="flex items-center gap-2 text-xs font-bold text-ink pb-2">
          <input name="recurring" type="checkbox" className="rounded border-mint-300 text-forest-800" /> Yearly
        </label>
        <button className="btn-primary btn-sm" disabled={busy}>{busy ? "…" : "Add"}</button>
      </form>
      <div className="card p-6">
        <ul className="space-y-2">
          {holidays.map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-xl border border-mint-100 px-4 py-3">
              <span className="w-3 h-3 rounded-full" style={{ background: "#AB47BC" }} />
              <span className="flex-1 text-sm font-semibold text-ink">{h.name}</span>
              <span className="text-xs text-ink-soft">{h.date}{h.recurring ? " · yearly" : ""}</span>
              <button onClick={() => remove(h.id)} className="text-ink-soft hover:text-red-600" aria-label="Delete"><Icon name="delete" className=" text-lg" /></button>
            </li>
          ))}
          {holidays.length === 0 && <p className="text-sm text-ink-soft">No holidays set.</p>}
        </ul>
      </div>
    </div>
  );
}
