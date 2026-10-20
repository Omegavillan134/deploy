"use client";

import { useRouter } from "next/navigation";

export default function RoleSelect({ userId, role, disabled }: { userId: string; role: string; disabled?: boolean }) {
  const router = useRouter();

  const change = async (value: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: value }),
      });
      if (!res.ok) console.error("Role update failed:", res.status);
    } catch (e) {
      console.error("Role update error:", e);
    } finally {
      router.refresh();
    }
  };

  return (
    <select
      value={role}
      disabled={disabled}
      onChange={(e) => change(e.target.value)}
      className="rounded-lg border border-mint-200 bg-white px-2.5 py-1.5 text-xs font-bold text-forest-800 disabled:opacity-50"
      aria-label="Change role"
    >
      <option value="STUDENT">STUDENT</option>
      <option value="TEACHER">TEACHER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}
