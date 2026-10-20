import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mint-50/40 px-4">
      <div className="card max-w-md p-10 text-center">
        <p className="text-6xl font-extrabold text-forest-800">404</p>
        <h1 className="mt-3 text-xl font-extrabold text-forest-900">Page not found</h1>
        <p className="mt-2 text-sm text-ink-soft">The page you are looking for does not exist or was moved.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-outline btn-sm">Home</Link>
          <Link href="/dashboard" className="btn-primary btn-sm">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
