type WindowEntry = {
  timestamps: number[];
};

const store = new Map<string, WindowEntry>();

const MAX_KEYS = 20_000;

function pruneKey(entry: WindowEntry, windowStart: number) {
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
}

function evictIfNeeded() {
  if (store.size <= MAX_KEYS) return;
  const excess = store.size - MAX_KEYS;
  let i = 0;
  for (const key of store.keys()) {
    store.delete(key);
    i += 1;
    if (i >= excess) break;
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  pruneKey(entry, windowStart);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
      reset: oldest + windowMs,
    };
  }

  entry.timestamps.push(now);
  evictIfNeeded();

  const remaining = Math.max(0, limit - entry.timestamps.length);
  const oldest = entry.timestamps[0] ?? now;

  return {
    ok: true,
    retryAfterSec: 0,
    remaining,
    reset: oldest + windowMs,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > now - 60 * 60_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 60_000).unref?.();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "127.0.0.1";
}