"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import ApproveButton from "./ApproveButton";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  approved: boolean;
  createdAt: string;
};

type Props = {
  users: UserRow[];
  currentUserId: string;
};

const ROLE_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "ADMIN", label: "Admin" },
  { id: "TEACHER", label: "Teacher" },
  { id: "STUDENT", label: "Student" },
] as const;

const roleBadge = (role: string) => {
  const styles: Record<string, string> = {
    ADMIN: "bg-forest-800 text-white",
    TEACHER: "bg-sky-100 text-sky-800",
    STUDENT: "bg-mint-100 text-forest-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${styles[role] ?? "bg-gray-100 text-gray-700"}`}>
      {role}
    </span>
  );
};

export default function UsersClient({ users, currentUserId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      return name.includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, query, roleFilter]);

  const openChangeRole = (u: UserRow) => {
    setModalUser(u);
    setNewRole(u.role);
    setPassword("");
    setError(null);
    setSuccess(null);
  };

  const closeModal = () => {
    setModalUser(null);
    setPassword("");
    setError(null);
    setSuccess(null);
  };

  const submitRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUser) return;
    if (newRole === modalUser.role) {
      setError("Select a different role.");
      return;
    }
    if (!password) {
      setError("Admin password is required to confirm.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${modalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to update role.");
        setBusy(false);
        return;
      }
      setSuccess(`Role updated to ${newRole}.`);
      setBusy(false);
      setTimeout(() => {
        closeModal();
        router.refresh();
      }, 800);
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft text-lg pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="input-field !bg-white pl-10 py-2.5 text-sm"
            aria-label="Search users"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRoleFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                roleFilter === f.id
                  ? "bg-forest-800 text-white shadow-sm"
                  : "bg-white border border-mint-200 text-ink-soft hover:bg-mint-50 hover:text-forest-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        Showing {filtered.length} of {users.length} accounts
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-mint-100 text-left text-xs text-ink-soft">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-soft">
                  No users match your search or filter.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-mint-50 last:border-0 hover:bg-mint-50/40">
                <td className="px-4 py-3 font-medium text-ink">
                  {u.firstName} {u.lastName}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-[10px] font-bold text-forest-700">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                <td className="px-4 py-3">{roleBadge(u.role)}</td>
                <td className="px-4 py-3">
                  {u.role === "TEACHER" && !u.approved ? (
                    <ApproveButton userId={u.id} />
                  ) : (
                    <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-[11px] font-bold text-forest-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => openChangeRole(u)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-mint-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-forest-800 hover:bg-mint-50 transition"
                    >
                      <Icon name="manage_accounts" className="text-sm" />
                      Change role
                    </button>
                  ) : (
                    <span className="text-[11px] text-ink-soft">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={closeModal} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-role-title"
            className="relative w-full max-w-md card p-6 shadow-float"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="change-role-title" className="text-lg font-bold text-forest-900">
                  Change role
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {modalUser.firstName} {modalUser.lastName} · {modalUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-mint-50 hover:text-ink"
                aria-label="Close"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <form onSubmit={submitRoleChange} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">New role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input-field !bg-white"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Your admin password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Confirm with your password"
                  className="input-field !bg-white"
                />
                <p className="mt-1 text-[11px] text-ink-soft">
                  Required to verify you authorize this role change.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs font-semibold text-forest-800 bg-mint-100 rounded-lg px-3 py-2">
                  {success}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary btn-sm flex-1 disabled:opacity-60"
                >
                  {busy ? "Updating…" : "Confirm change"}
                </button>
                <button type="button" onClick={closeModal} className="btn-outline btn-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}