import { NextResponse } from "next/server";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessBody<T = unknown> {
  ok: true;
  data: T;
}

/* ── Common error codes ─────────────────────────────────────────────────── */

export const ERR = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL_ERROR",
  VALIDATION: "VALIDATION_ERROR",
} as const;

/* ── Core helpers ───────────────────────────────────────────────────────── */

/** Standardized error response with { ok: false, error: { code, message } } */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    ok: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

/** Standardized success response with { ok: true, data } */
export function apiOk<T>(data: T, status = 200): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ ok: true as const, data }, { status });
}

/* ── Convenience shortcuts ──────────────────────────────────────────────── */

/** 400 Bad Request */
export function apiBadRequest(message: string, details?: unknown) {
  return apiError(400, ERR.BAD_REQUEST, message, details);
}

/** 401 Unauthorized */
export function apiUnauthorized(message = "인증이 필요합니다") {
  return apiError(401, ERR.UNAUTHORIZED, message);
}

/** 403 Forbidden */
export function apiForbidden(message = "접근 권한이 없습니다") {
  return apiError(403, ERR.FORBIDDEN, message);
}

/** 404 Not Found */
export function apiNotFound(message = "리소스를 찾을 수 없습니다") {
  return apiError(404, ERR.NOT_FOUND, message);
}

/** 429 Rate Limited */
export function apiRateLimited(message = "요청이 너무 많습니다") {
  return apiError(429, ERR.RATE_LIMITED, message);
}

/** 500 Internal Server Error */
export function apiServerError(message = "서버 오류가 발생했습니다") {
  return apiError(500, ERR.INTERNAL, message);
}
