"use client";

export default function LocalDateTime({
  value,
  fallback = "—",
  dateStyle = "short",
  timeStyle = "short",
  className,
}: {
  value: string | Date | null | undefined;
  fallback?: string;
  dateStyle?: "full" | "long" | "medium" | "short" | undefined;
  timeStyle?: "full" | "long" | "medium" | "short" | undefined;
  className?: string;
}) {
  if (!value) return <span className={className}>{fallback}</span>;

  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return <span className={className}>{fallback}</span>;

  const text = d.toLocaleString(undefined, {
    dateStyle,
    timeStyle,
  });

  return (
    <time dateTime={d.toISOString()} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}