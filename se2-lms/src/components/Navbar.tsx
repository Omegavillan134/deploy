"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Logo from "./Logo";
import Icon from "@/components/ui/Icon";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
] as const;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const headerOffset = 80;
  const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  return true;
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const [mounted, setMounted] = useState(false);
  const onHome = pathname === "/" || pathname === "";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!onHome || !mounted) return;

    const sectionIds = SECTIONS.map((s) => s.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { root: null, rootMargin: "-25% 0px -50% 0px", threshold: [0, 0.15, 0.4, 0.7] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onHome, mounted]);

  const goSection = useCallback(
    (id: string) => {
      setActiveId(id);
      setOpen(false);

      if (onHome) {
        if (!scrollToId(id)) {
          requestAnimationFrame(() => scrollToId(id));
        }
        return;
      }

      sessionStorage.setItem("scrollTo", id);
      window.location.assign("/");
    },
    [onHome]
  );

  useEffect(() => {
    if (!onHome || !mounted) return;
    const id = sessionStorage.getItem("scrollTo");
    if (!id) return;
    sessionStorage.removeItem("scrollTo");
    setActiveId(id);
    requestAnimationFrame(() => {
      scrollToId(id);
      setTimeout(() => scrollToId(id), 100);
    });
  }, [onHome, mounted]);

  const isActive = (id: string) => mounted && onHome && activeId === id;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-xl shadow-card" : "bg-white/60 backdrop-blur-sm"
      }`}
    >
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 h-[72px] flex items-center justify-between"
        aria-label="Main"
      >
        <Logo />
        <div className="hidden md:flex items-center gap-10">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goSection(s.id)}
              className={`relative pb-1 text-sm font-semibold transition-colors ${
                isActive(s.id) ? "text-forest-800" : "text-ink-soft hover:text-forest-800"
              }`}
            >
              {s.label}
              {isActive(s.id) ? (
                <span
                  className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full bg-forest-700"
                  aria-hidden
                />
              ) : null}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="btn-outline btn-sm !rounded-xl bg-white">
            Log in
          </a>
          <a href="/register" className="btn-primary btn-sm !rounded-xl">
            Register
          </a>
        </div>
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-forest-800 hover:bg-mint-50"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </nav>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 top-[72px] z-50 max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-mint-100 bg-white/95 px-4 py-4 shadow-card backdrop-blur-xl md:hidden">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goSection(s.id)}
                className={`block w-full text-left rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint-50 hover:text-forest-800 ${
                  isActive(s.id) ? "text-forest-800 bg-mint-50" : "text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
            <div className="flex gap-3 pt-3">
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-outline btn-sm flex-1 !rounded-xl"
              >
                Log in
              </a>
              <a
                href="/register"
                onClick={() => setOpen(false)}
                className="btn-primary btn-sm flex-1 !rounded-xl"
              >
                Register
              </a>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
