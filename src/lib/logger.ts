/**
 * FieldNine — Structured Server Logger (pino 기반)
 * 서버 사이드 전용. 클라이언트 컴포넌트에서 import 금지.
 */
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

const baseLogger = pino({
  level: isDev ? 'debug' : 'info',
  base: {
    app: 'fieldfine',
    env: process.env.NODE_ENV ?? 'unknown',
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }
    : {}),
});

type LogContext = Record<string, unknown>;

export const log = {
  debug: (msg: string, ctx?: LogContext) => baseLogger.debug(ctx ?? {}, msg),
  info:  (msg: string, ctx?: LogContext) => baseLogger.info(ctx ?? {}, msg),
  warn:  (msg: string, ctx?: LogContext) => baseLogger.warn(ctx ?? {}, msg),
  error: (msg: string, ctx?: LogContext) => baseLogger.error(ctx ?? {}, msg),

  /** API route 성공 로그 */
  api: (method: string, path: string, status: number, ms: number, ctx?: LogContext) =>
    baseLogger.info({ method, path, status, ms, ...ctx }, `${method} ${path} ${status} ${ms}ms`),

  /** 보안 이벤트 로그 */
  security: (event: string, ctx?: LogContext) =>
    baseLogger.warn({ security: true, event, ...ctx }, `[SECURITY] ${event}`),

  /** 결제 이벤트 로그 */
  billing: (event: string, ctx?: LogContext) =>
    baseLogger.info({ billing: true, event, ...ctx }, `[BILLING] ${event}`),

  /** 인증 이벤트 로그 */
  auth: (event: string, ctx?: LogContext) =>
    baseLogger.info({ auth: true, event, ...ctx }, `[AUTH] ${event}`),
};

export default log;
