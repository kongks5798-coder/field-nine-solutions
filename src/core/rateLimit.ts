type LimitResult = {
  ok: boolean;
  remaining: number;
  reset: number;
  limit: number;
};

const store = new Map<string, number[]>();

function now() {
  return Date.now();
}

function parseForwardedFor(h: string | null | undefined): string {
  if (!h) return "";
  const first = h.split(",")[0]?.trim();
  return first || "";
}

export function ipFromHeaders(headers: Headers): string {
  const xf = headers.get("x-forwarded-for");
  const xr = headers.get("x-real-ip");
  const cf = headers.get("cf-connecting-ip");
  const ip = parseForwardedFor(xf) || xr || cf || "";
  return ip || "unknown";
}

export function checkLimit(key: string): LimitResult {
  const windowMs = Number(process.env.RL_WINDOW_MS || 60000);
  const max = Number(process.env.RL_MAX || 60);
  const nowMs = now();
  const bucket = store.get(key) || [];
  const filtered = bucket.filter((t) => nowMs - t < windowMs);
  filtered.push(nowMs);
  store.set(key, filtered);
  const remaining = Math.max(0, max - filtered.length);
  const reset = filtered.length ? filtered[0] + windowMs : nowMs + windowMs;
  const ok = filtered.length <= max;
  return { ok, remaining, reset, limit: max };
}

export function headersFor(result: LimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
