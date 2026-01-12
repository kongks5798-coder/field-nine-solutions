/**
 * Logger - 로깅 시스템
 * 
 * 비즈니스 목적:
 * - 에러 추적 및 디버깅
 * - 사용자 행동 분석
 * - 성능 모니터링
 * - 프로덕션 환경에서 문제 진단
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // 개발 환경: 콘솔 출력
    if (this.isDevelopment) {
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        debug: '🔍',
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, metadata || '');
    }

    // 프로덕션 환경: 외부 로깅 서비스로 전송 (예: Sentry, LogRocket)
    // TODO: 실제 로깅 서비스 통합
    if (!this.isDevelopment && level === 'error') {
      // 에러만 외부 서비스로 전송
      // this.sendToLoggingService(entry);
    }
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log('error', message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('debug', message, metadata);
    }
  }
}

export const logger = new Logger();
