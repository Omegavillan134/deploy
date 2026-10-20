"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApproveButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (!res.ok) console.error("Approve failed:", res.status);
    } catch (e) {
      console.error("Approve error:", e);
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  return (
    <button
      onClick={approve}
      disabled={busy}
      className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 hover:bg-forest-800 hover:text-white transition-colors disabled:opacity-50"
    >
      {busy ? "…" : "Approve"}
    </button>
  );
}
