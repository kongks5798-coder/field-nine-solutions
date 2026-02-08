type Method = "GET" | "POST" | "PATCH" | "DELETE";

const store = new Map<string, number[]>();
const MAX = 50;

function record(key: string, ms: number) {
  const arr = store.get(key) || [];
  arr.push(ms);
  if (arr.length > MAX) arr.shift();
  store.set(key, arr);
}

function avg(key: string) {
  const arr = store.get(key) || [];
  if (arr.length === 0) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function recommendCache(key: string, method: Method) {
  if (method !== "GET") return "no-store, no-cache, must-revalidate";
  const a = avg(key);
  if (a > 200) return "public, max-age=0, s-maxage=60, stale-while-revalidate=30";
  if (a > 120) return "public, max-age=0, s-maxage=30, stale-while-revalidate=30";
  return "no-store";
}

export async function measureSelfHeal<T>(key: string, method: Method, fn: () => Promise<T>) {
  const start = Date.now();
  const result = await fn();
  const latency = Date.now() - start;
  record(key, latency);
  const cache = recommendCache(key, method);
  return { result, cache, latency };
}
