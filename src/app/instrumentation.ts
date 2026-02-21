/**
 * Next.js Instrumentation Hook
 * Sentry를 Node.js(서버)와 Edge 런타임 모두에서 초기화
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../../sentry.edge.config');
  }
}
