import { NextResponse } from "next/server";
import { type RateLimitResult } from "./rate-limit";

/**
 * Apply rate limit headers to a response.
 */
export function applyRateLimitHeaders(
  res: NextResponse,
  result: RateLimitResult
): NextResponse {
  res.headers.set("X-RateLimit-Limit", String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(Math.max(0, result.remaining)));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return res;
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitExceeded(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  const res = NextResponse.json(
    { error: "Too many requests", retryAfter },
    { status: 429 }
  );
  applyRateLimitHeaders(res, result);
  res.headers.set("Retry-After", String(retryAfter));
  return res;
}
