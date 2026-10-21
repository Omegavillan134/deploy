import Image from "next/image";

export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-3 group" aria-label="CVSU LMS home">
      <Image
        src="/logo.png"
        alt="CVSU LMS"
        width={40}
        height={40}
        className="rounded-xl shadow-card"
        priority
      />
      <span className="leading-none">
        <span
          className={`block font-extrabold tracking-tight text-lg ${
            dark ? "text-white" : "text-forest-900"
          }`}
        >
          CVSU <span className="text-forest-700">LMS</span>
        </span>
        <span
          className={`block text-[10px] font-medium mt-1 ${
            dark ? "text-mint-200" : "text-ink-soft"
          }`}
        >
          Learning Management System
        </span>
      </span>
    </a>
  );
}