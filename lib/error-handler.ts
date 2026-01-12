/**
 * Error Handler - 통합 에러 처리
 * 
 * 비즈니스 목적:
 * - 에러를 Sentry로 전송
 * - 사용자 친화적 에러 메시지 제공
 * - 에러 로깅 및 추적
 */
import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(code: ErrorCodes, message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 에러를 Sentry로 전송
 */
export function captureError(error: Error | AppError, context?: Record<string, any>) {
  // 로컬 로깅
  logger.error('Error captured', {
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // Sentry로 전송 (프로덕션만)
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }
}

/**
 * 사용자 친화적 에러 메시지 생성
 */
export function getUserFriendlyError(error: Error | AppError): string {
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return '네트워크 연결을 확인해주세요.';
  }

  if (error.message.includes('timeout')) {
    return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
  }

  if (error.message.includes('unauthorized') || error.message.includes('인증')) {
    return '로그인이 필요합니다.';
  }

  if (error.message.includes('limit') || error.message.includes('한도')) {
    return '사용량 한도에 도달했습니다. 플랜을 업그레이드해주세요.';
  }

  // 기본 메시지
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * 에러 로깅 (기존 코드 호환성)
 */
export function logError(error: Error | AppError, context?: Record<string, any>) {
  captureError(error, context);
}

/**
 * 에러 응답 포맷팅 (기존 코드 호환성)
 */
export function formatErrorResponse(error: Error | AppError): { error: string; code?: string } {
  const message = getUserFriendlyError(error);
  const code = error instanceof AppError ? error.code : undefined;
  return { error: message, code };
}
