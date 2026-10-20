"use client";

import Link from "next/link";
import InstallApp from "@/components/InstallApp";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Icon from "@/components/ui/Icon";

type Role = "STUDENT" | "TEACHER" | "ADMIN";

const nav: Record<Role, { href: string; label: string; icon: string }[]> = {
  STUDENT: [
    { href: "/dashboard", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/classes", label: "My classes", icon: "school" },
    { href: "/dashboard/calendar", label: "Calendar", icon: "calendar_month" },
    { href: "/dashboard/notifications", label: "Notifications", icon: "notifications" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ],
  TEACHER: [
    { href: "/dashboard", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/classes", label: "My classes", icon: "school" },
    { href: "/dashboard/calendar", label: "Calendar", icon: "calendar_month" },
    { href: "/dashboard/notifications", label: "Notifications", icon: "notifications" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/admin/users", label: "Users", icon: "group" },
    { href: "/dashboard/admin/holidays", label: "Holidays", icon: "event" },
    { href: "/dashboard/admin/security", label: "Security", icon: "shield" },
    { href: "/dashboard/classes", label: "All classes", icon: "school" },
    { href: "/dashboard/notifications", label: "Notifications", icon: "notifications" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ],
};

export default function DashboardShell({
  user,
  unread,
  children,
}: {
  user: { id: string; firstName: string; lastName: string; email: string; role: Role };
  unread: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const logout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) console.error("Logout failed:", res.status);
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  const linkCls = (href: string) =>
    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-forest-800 text-white shadow-card"
        : "text-ink-soft hover:bg-mint-50 hover:text-forest-800"
    }`;

  const closeAndNavigate = () => setOpen(false);

  return (
    <div className="min-h-screen bg-mint-50/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-mint-100 bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-mint-100">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-forest-800 text-white font-extrabold">
            C
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold text-forest-900">CVSU LMS</span>
            <span className="block text-[10px] text-ink-soft">Learning Management System</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Dashboard">
          {nav[user.role].map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              <Icon name={String(l.icon)} className=" text-xl" />
              {l.label}
              {l.href === "/dashboard/notifications" && unread > 0 && (
                <span className="ml-auto rounded-full bg-forest-800 text-white text-[10px] font-bold px-2 py-0.5">
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-mint-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-mint-50 px-3 py-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-forest-800 text-white text-sm font-bold">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[11px] text-ink-soft">{user.role.toLowerCase()}</p>
            </div>
            <DropdownMenu
              trigger={<Icon name="more_vert" className="" />}
              items={[
                { kind: "link", href: "/dashboard/settings", label: "Profile & settings", icon: "settings" },
                { kind: "divider" },
                { kind: "action", label: "Log out", icon: "logout", onSelect: logout },
              ]}
            />
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-mint-100 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="font-extrabold text-forest-900">
          CVSU LMS
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notifications" className="relative p-2 text-ink-soft" aria-label="Notifications">
            <Icon name="notifications" className="" />
            {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-forest-700" />}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-2 text-forest-800"
            aria-label="Menu"
            aria-expanded={open}
          >
            <Icon name={String(open ? "close" : "menu")} className="" />
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col border-l border-mint-100 bg-white shadow-float lg:hidden">
            <div className="flex items-center justify-between border-b border-mint-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-forest-800 text-sm font-bold text-white">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-[11px] text-ink-soft">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-forest-800 hover:bg-mint-50"
                aria-label="Close menu"
              >
                <Icon name="close" className="" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Mobile dashboard">
              {nav[user.role].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeAndNavigate}
                  className={linkCls(l.href)}
                >
                  <Icon name={String(l.icon)} className=" text-xl" />
                  {l.label}
                  {l.href === "/dashboard/notifications" && unread > 0 && (
                    <span className="ml-auto rounded-full bg-forest-800 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="border-t border-mint-100 p-3">
              <Link
                href="/dashboard/settings"
                onClick={closeAndNavigate}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-mint-50 hover:text-forest-800"
              >
                <Icon name="settings" className=" text-xl" />
                Profile & settings
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-mint-50"
              >
                <Icon name="logout" className=" text-xl" /> Log out
              </button>
            </div>
          </div>
        </>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t border-mint-100 bg-white/95 backdrop-blur-xl lg:hidden"
        aria-label="Mobile"
      >
        {nav[user.role].slice(0, 3).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${
              pathname === l.href ? "text-forest-800" : "text-ink-soft"
            }`}
          >
            <Icon name={String(l.icon)} className=" text-[22px]" />
            {l.label.split(" ")[0]}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Open profile menu"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${
            open ? "text-forest-800" : "text-ink-soft"
          }`}
        >
          <Icon name="account_circle" className=" text-[22px]" />
          Profile
        </button>
      </nav>

      <main className="lg:pl-64 pb-16 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
      </main>
      <InstallApp />
    </div>
  );
}
