import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  data: T;
}

/** 표준 에러 응답 생성 */
export function apiError(message: string, status: number, code?: string): NextResponse<ApiError> {
  return NextResponse.json({ error: message, ...(code && { code }) }, { status });
}

/** 표준 성공 응답 생성 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status });
}

/** 403 Forbidden */
export function apiForbidden(message = "접근 권한이 없습니다"): NextResponse<ApiError> {
  return apiError(message, 403, "FORBIDDEN");
}

/** 401 Unauthorized */
export function apiUnauthorized(message = "인증이 필요합니다"): NextResponse<ApiError> {
  return apiError(message, 401, "UNAUTHORIZED");
}

/** 400 Bad Request */
export function apiBadRequest(message: string): NextResponse<ApiError> {
  return apiError(message, 400, "BAD_REQUEST");
}

/** 500 Internal Server Error */
export function apiServerError(message = "서버 오류가 발생했습니다"): NextResponse<ApiError> {
  return apiError(message, 500, "INTERNAL_ERROR");
}
