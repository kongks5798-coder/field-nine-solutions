import { NextResponse } from "next/server";

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Standardized error response */
export function apiError(status: number, code: string, message: string, details?: unknown) {
  const body: { ok: false; error: ApiError } = {
    ok: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

/** Standardized success response */
export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Common error codes */
export const ERR = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL_ERROR",
  VALIDATION: "VALIDATION_ERROR",
} as const;
