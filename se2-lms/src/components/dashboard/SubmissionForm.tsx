"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function SubmissionForm({
  assignmentId,
  existing = "",
  resubmit = false,
}: {
  assignmentId: string;
  existing?: string;
  resubmit?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState(existing);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Submission failed."); return; }
    if (files.length && data.id) {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("submissionId", data.id);
        await fetch("/api/attachments", { method: "POST", body: fd }).catch(() => {});
      }
    }
    setDone(true);
    router.refresh();
  };

  if (done)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-mint-50 px-4 py-3">
        <Icon name="check_circle" className=" text-forest-700" />
        <p className="text-sm font-semibold text-forest-800">
          {resubmit ? "Resubmitted. Your teacher has been notified." : "Submitted. Good work!"}
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={6}
        placeholder="Write your answer or paste a link to your work (Drive, GitHub, etc.)…"
        className="input-field !bg-white resize-y"
      />
      <div>
        <label className="text-xs font-bold text-ink block mb-1.5">Attach your files (optional)</label>
        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-mint-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-forest-800" />
      </div>
      <button type="submit" disabled={busy || body.trim().length === 0} className="btn-primary btn-sm disabled:opacity-50">
        {busy ? "Submitting…" : resubmit ? "Resubmit" : "Submit"}
      </button>
    </form>
  );
}
