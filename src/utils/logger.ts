/**
 * Simple Logger Utility
 * 
 * 프로덕션 환경에서도 로깅을 위한 간단한 유틸리티
 */

export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data || '')
    }
  },
  error: (message: string, error?: Error | unknown, context?: any) => {
    console.error(`[ERROR] ${message}`, error || '', context || '')
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },
}
