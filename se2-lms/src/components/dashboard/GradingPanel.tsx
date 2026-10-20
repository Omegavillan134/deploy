"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

type Row = {
  id: string;
  studentName: string;
  body: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  attachments: { id: string; fileName: string }[];
};

export default function GradingPanel({
  assignmentId,
  points,
  submissions,
}: {
  assignmentId: string;
  points: number;
  submissions: Row[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, payload: Record<string, unknown>) => {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) { setError(data.error ?? "Update failed."); return; }
    router.refresh();
  };

  return (
    <section className="card p-6 sm:p-8">
      <h2 className="font-bold text-forest-900">Submissions · {submissions.length}</h2>
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {submissions.length === 0 && <p className="mt-4 text-sm text-ink-soft">No submissions yet.</p>}
      <div className="mt-5 space-y-5">
        {submissions.map((s) => (
          <div key={s.id} className="rounded-2xl border border-mint-100 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">{s.studentName}</p>
                <p className="text-xs text-ink-soft">{new Date(s.submittedAt).toLocaleString()}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                s.status === "GRADED" ? "bg-mint-100 text-forest-800"
                : s.status === "RETURNED" ? "bg-amber-50 text-amber-700"
                : "bg-sky-50 text-sky-700"
              }`}>{s.status.replace("_", " ").toLowerCase()}</span>
            </div>
            {s.body && <p className="mt-3 rounded-xl bg-mint-50/60 p-4 text-sm text-ink whitespace-pre-wrap">{s.body}</p>}
            {s.attachments.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {s.attachments.map((f) => (
                  <li key={f.id}>
                    <a href={`/api/attachments/${f.id}`} className="inline-flex items-center gap-2 rounded-lg bg-mint-100 px-3 py-1.5 text-xs font-bold text-forest-800 hover:bg-mint-200">
                      <Icon name="download" className=" text-base" /> {f.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr]">
              <label className="text-xs font-bold text-ink">
                Grade (/{points})
                <input
                  id={`grade-${s.id}`}
                  type="number" min={0} max={points} step="0.5" defaultValue={s.grade ?? ""}
                  className="input-field !bg-white mt-1.5"
                />
              </label>
              <label className="text-xs font-bold text-ink">
                Feedback
                <input
                  id={`fb-${s.id}`}
                  defaultValue={s.feedback ?? ""}
                  placeholder="Comments for the student…"
                  className="input-field !bg-white mt-1.5"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={busyId === s.id}
                onClick={() => act(s.id, {
                  grade: Number((document.getElementById(`grade-${s.id}`) as HTMLInputElement).value),
                  feedback: (document.getElementById(`fb-${s.id}`) as HTMLInputElement).value,
                  action: "grade",
                })}
                className="btn-primary btn-sm disabled:opacity-50"
              >
                {busyId === s.id ? "Saving…" : s.status === "GRADED" ? "Update grade" : "Post grade"}
              </button>
              <button
                disabled={busyId === s.id}
                onClick={() => act(s.id, {
                  feedback: (document.getElementById(`fb-${s.id}`) as HTMLInputElement).value,
                  action: "return",
                })}
                className="btn-outline btn-sm"
              >
                Return for revision
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
