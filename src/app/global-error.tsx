'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 20, color: '#fff',
          marginBottom: 32,
        }}>F9</div>

        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1b1b1f', marginBottom: 12 }}>
          치명적 오류가 발생했습니다
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, maxWidth: 380, lineHeight: 1.7 }}>
          앱을 다시 시작해주세요. 문제가 지속되면 고객 지원에 문의해주세요.
        </p>
        {error.digest && (
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 28 }}>
            오류 코드: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 28px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
          <a href="/" style={{
            padding: '12px 28px', borderRadius: 10, textDecoration: 'none',
            border: '1.5px solid #e5e7eb',
            background: '#fff', color: '#374151', fontSize: 15, fontWeight: 600,
          }}>
            홈으로
          </a>
        </div>
      </body>
    </html>
  );
}
