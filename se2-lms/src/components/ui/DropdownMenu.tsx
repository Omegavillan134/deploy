"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "@/components/ui/Icon";

export type MenuEntry =
  | { kind: "link"; href: string; label: string; icon?: string }
  | { kind: "action"; label: string; icon?: string; onSelect: () => void }
  | { kind: "divider" };

export default function DropdownMenu({
  trigger,
  items,
  align = "right",
}: {
  trigger: ReactNode;
  items: MenuEntry[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cls =
    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-mint-50 hover:text-forest-800";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-ink-soft transition-colors hover:text-forest-800"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute bottom-full z-50 mb-2 w-52 overflow-hidden rounded-2xl border border-mint-100 bg-white shadow-float ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((it, i) =>
            it.kind === "divider" ? (
              <div key={i} className="my-1 border-t border-mint-100" />
            ) : it.kind === "link" ? (
              <Link key={i} role="menuitem" href={it.href} onClick={() => setOpen(false)} className={cls}>
                {it.icon && <Icon name={String(it.icon)} className=" text-lg" />}
                {it.label}
              </Link>
            ) : (
              <button
                key={i}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={cls}
              >
                {it.icon && <Icon name={String(it.icon)} className=" text-lg" />}
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
