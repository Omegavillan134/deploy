import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-mint-50 border-t border-mint-100 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Logo />
        <p className="text-xs text-ink-soft text-center">
          © 2026 CVSU LMS · Cavite State University – Carmona Campus · Academic Project
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-ink-soft">
          <a href="/#about" className="hover:text-forest-800">
            About
          </a>
          <a href="/#features" className="hover:text-forest-800">
            Features
          </a>
          <a href="/login" className="hover:text-forest-800">
            Log in
          </a>
        </div>
      </div>
    </footer>
  );
}
