"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
const STYLE: Record<string, string> = {
  PRESENT: "bg-[#C8E6C9] text-[#2E7D32]", ABSENT: "bg-[#FFCDD2] text-[#C62828]",
  LATE: "bg-[#FFE0B2] text-[#E65100]", EXCUSED: "bg-[#BBDEFB] text-[#1565C0]",
};

type Rec = { id: string; studentId: string; date: string; status: string; name?: string };

export default function AttendancePanel({ classId, isTeacher, students, records }: { classId: string; isTeacher: boolean; students: { id: string; name: string }[]; records: Rec[] }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
    if (!records.length) return;
    setBusy(true); setError(null);
    const res = await fetch(`/api/classes/${classId}/attendance`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, records }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Save failed."); return; }
    setMarks({});
    router.refresh();
  };

  if (!isTeacher) {
    return (
      <div className="card p-6">
        <h2 className="font-bold text-forest-900 mb-4">My attendance</h2>
        {records.length === 0 ? <p className="text-sm text-ink-soft">No records yet.</p> : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${''}" style={{}}>
                <span className="flex-1 rounded-lg px-3 py-2" style={{ background: STYLE[r.status]?.split(" ")[0], color: STYLE[r.status]?.split(" ")[1] }}>{r.status}</span>
                <span className="text-ink-soft font-normal ml-3">{r.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-bold text-forest-900">Take attendance</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field !bg-white !w-auto" />
          <button onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, "PRESENT"])))} className="btn-outline btn-sm !py-1.5">All present</button>
        </div>
        <ul className="mt-4 space-y-2">
          {students.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2">
              <span className="flex-1 min-w-[140px] text-sm font-medium text-ink">{s.name}</span>
              {STATUS.map((st) => (
                <button key={st} onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${marks[s.id] === st ? STYLE[st] : "bg-mint-50 text-ink-soft hover:opacity-80"}`}>
                  {st}
                </button>
              ))}
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
        <button onClick={save} disabled={busy || Object.keys(marks).length === 0} className="btn-primary btn-sm mt-5 disabled:opacity-50">
          {busy ? "Saving…" : `Save ${Object.keys(marks).length || ""} record(s)`}
        </button>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-forest-900">History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-mint-100">
                <th className="pb-2 font-semibold">Student</th>
                <th className="pb-2 font-semibold">Date</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-mint-50 last:border-0">
                  <td className="py-2.5 font-medium text-ink">{r.name}</td>
                  <td className="py-2.5 text-ink-soft">{r.date}</td>
                  <td className="py-2.5"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STYLE[r.status] ?? "bg-mint-50 text-ink-soft"}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
