/**
 * 통합 에러 핸들링 유틸리티
 * 
 * 모든 API에서 일관된 에러 응답을 제공
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 에러 코드 정의
 */
export const ErrorCodes = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // 입력 검증
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  
  // 결제 관련
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  
  // 외부 서비스
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 서버 오류
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * 에러를 API 응답 형식으로 변환
 */
export function formatErrorResponse(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Supabase 에러 처리
    if (error.message.includes('JWT') || error.message.includes('session')) {
      return {
        code: ErrorCodes.SESSION_EXPIRED,
        message: '세션이 만료되었습니다. 다시 로그인해주세요.',
        statusCode: 401,
      };
    }

    if (error.message.includes('Row Level Security')) {
      return {
        code: ErrorCodes.FORBIDDEN,
        message: '접근 권한이 없습니다.',
        statusCode: 403,
      };
    }

    // 데이터베이스 에러
    if (error.message.includes('database') || error.message.includes('connection')) {
      return {
        code: ErrorCodes.DATABASE_ERROR,
        message: '데이터베이스 연결 오류가 발생했습니다.',
        statusCode: 500,
      };
    }

    // 일반 에러
    return {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: error.message || '서버 오류가 발생했습니다.',
      statusCode: 500,
    };
  }

  // 알 수 없는 에러
  return {
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: '예상치 못한 오류가 발생했습니다.',
    statusCode: 500,
  };
}

/**
 * 에러 로깅 (프로덕션에서는 Sentry 등 사용)
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorResponse = formatErrorResponse(error);
  
  console.error('[Error Handler]', {
    code: errorResponse.code,
    message: errorResponse.message,
    statusCode: errorResponse.statusCode,
    details: errorResponse.details,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // 프로덕션에서는 Sentry 등으로 전송
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    // Sentry.captureException(error, { extra: context });
  }
}
