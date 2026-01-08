/**
 * 에러 복구 메커니즘: 재시도 로직
 * 지수 백오프(Exponential Backoff)를 사용한 재시도
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1초
  maxDelay: 10000, // 10초
  backoffMultiplier: 2,
};

/**
 * 재시도 가능한 함수 실행
 * @param fn 실행할 함수
 * @param options 재시도 옵션
 * @returns 함수 실행 결과
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 마지막 시도가 아니면 재시도
      if (attempt < opts.maxRetries) {
        const delay = Math.min(
          opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // 모든 재시도 실패 시 에러 throw
      throw error;
    }
  }

  throw lastError;
}

/**
 * 네트워크 오류인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    );
  }
  return false;
}
