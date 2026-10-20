"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinClassForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/classes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Could not join class."); return; }
    setCode("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Class code"
        aria-label="Class code"
        className="input-field !bg-white !w-36 uppercase tracking-widest text-center font-bold"
        maxLength={8}
      />
      <button type="submit" disabled={busy || code.trim().length < 4} className="btn-primary btn-sm disabled:opacity-50">
        {busy ? "…" : "Join"}
      </button>
      {error && <span role="alert" className="text-xs font-semibold text-red-700">{error}</span>}
    </form>
  );
}
