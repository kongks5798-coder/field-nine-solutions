'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HealthData {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  latencyMs: number;
  components: Record<string, { status: string; latencyMs?: number }>;
}

const STATUS_COLORS = {
  ok:           { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e', label: '정상' },
  configured:   { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e', label: '설정됨' },
  degraded:     { bg: '#fef9c3', text: '#b45309', dot: '#eab308', label: '일부 저하' },
  unconfigured: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', label: '미설정' },
  error:        { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444', label: '오류' },
  down:         { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444', label: '중단' },
} as const;

function Badge({ status }: { status: string }) {
  const s = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.error;
  return (
    <span
      role="img"
      aria-label={`상태: ${s.label}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: 20,
        background: s.bg, color: s.text, fontSize: 13, fontWeight: 600,
      }}
    >
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

const COMPONENT_LABELS: Record<string, string> = {
  api:      'API 서버',
  database: '데이터베이스',
  env:      '환경변수',
  ai:       'AI 서비스',
  billing:  '결제 시스템',
  email:    '이메일',
};

const OVERALL_STATUS_LABEL: Record<string, string> = {
  ok:      '모든 시스템 정상 운영 중',
  degraded: '일부 서비스 저하',
  down:    '서비스 점검 중',
};

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data: HealthData = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 30_000); // 30초마다 갱신
    return () => clearInterval(id);
  }, []);

  const overallStatus = !health ? 'down' : health.status;
  const overallColors = STATUS_COLORS[overallStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.error;
  const overallLabel  = OVERALL_STATUS_LABEL[overallStatus] ?? '알 수 없음';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      {/* 헤더 */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link
          href="/"
          aria-label="FieldNine 홈으로 이동"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div aria-hidden="true" style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #f97316, #f43f5e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#fff',
          }}>F9</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>FieldNine</span>
        </Link>
        <span aria-hidden="true" style={{ fontSize: 14, color: '#6b7280' }}>시스템 상태</span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        {/* 페이지 제목 (스크린리더용, 시각적으로 숨김) */}
        <h1 style={{
          position: 'absolute',
          width: 1, height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}>
          FieldNine 시스템 상태
        </h1>

        {/* 자동 갱신 영역 — 30초마다 스크린리더에 변경 알림 */}
        <div aria-live="polite" aria-atomic="true">
          {/* 전체 상태 배너 */}
          <div style={{
            borderRadius: 16,
            background: overallColors.bg,
            border: `1.5px solid ${overallColors.dot}33`,
            padding: '28px 32px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div
              role="img"
              aria-label={`전체 시스템 상태: ${overallLabel}`}
              style={{
                width: 16, height: 16, borderRadius: '50%',
                background: overallColors.dot,
                flexShrink: 0,
                boxShadow: `0 0 0 4px ${overallColors.dot}33`,
              }}
            />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: overallColors.text }}>
                {overallLabel}
              </div>
              {health && (
                <div style={{ fontSize: 13, color: overallColors.text, opacity: 0.8, marginTop: 4 }}>
                  버전 {health.version} · 응답시간 {health.latencyMs}ms
                </div>
              )}
            </div>
          </div>

          {/* 컴포넌트별 상태 */}
          <section
            aria-labelledby="components-heading"
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h2 id="components-heading" style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>
                서비스 구성 요소
              </h2>
            </div>

            {loading ? (
              <div
                role="status"
                aria-label="상태 확인 중"
                style={{ padding: '40px 24px', textAlign: 'center', color: '#9ca3af' }}
              >
                상태 확인 중...
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {Object.entries(health?.components ?? {}).map(([key, val], i, arr) => (
                  <li key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : undefined,
                  }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2937' }}>
                        {COMPONENT_LABELS[key] ?? key}
                      </div>
                      {val.latencyMs !== undefined && (
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                          응답시간: {val.latencyMs}ms
                        </div>
                      )}
                    </div>
                    <Badge status={val.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 마지막 확인 */}
          <div
            style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}
            aria-label={lastChecked
              ? `마지막 확인: ${lastChecked.toLocaleTimeString('ko-KR')}, 30초마다 자동 갱신`
              : '확인 중'}
          >
            {lastChecked
              ? `마지막 확인: ${lastChecked.toLocaleTimeString('ko-KR')} · 30초마다 자동 갱신`
              : '확인 중...'}
          </div>
        </div>
      </main>
    </div>
  );
}
