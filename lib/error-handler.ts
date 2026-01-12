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

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
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
