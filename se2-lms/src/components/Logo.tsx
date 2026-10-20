export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-3 group" aria-label="CVSU LMS home">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-forest-800 text-white font-extrabold text-lg shadow-card group-hover:bg-forest-900 transition-colors">
        C
      </span>
      <span className="leading-none">
        <span
          className={`block font-extrabold tracking-tight text-lg ${dark ? "text-white" : "text-forest-900"}`}
        >
          CVSU <span className="text-forest-700">LMS</span>
        </span>
        <span
          className={`block text-[10px] font-medium mt-1 ${dark ? "text-mint-200" : "text-ink-soft"}`}
        >
          Learning Management System
        </span>
      </span>
    </a>
  );
}
