"use client";

import Icon from "@/components/ui/Icon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-mint-50/40 px-4">
      <div className="card max-w-md p-8 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-600">
          <Icon name="error" className=" text-3xl" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-forest-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-soft">
          An unexpected error occurred while loading this page.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-mint-50 p-3 text-left text-[11px] text-red-700">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-primary btn-sm">Try again</button>
          <a href="/dashboard" className="btn-outline btn-sm">Go to dashboard</a>
        </div>
      </div>
    </main>
  );
}
