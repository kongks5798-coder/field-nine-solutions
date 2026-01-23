'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// SystemHealth is implemented inline as SystemHealthDark for dark theme consistency

interface SalesData {
  today: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  orders: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
}

interface MusinsaData {
  urgentShipping: number;
  urgentClaims: number;
  pendingOrders: number;
  totalOrders: number;
  revenue: number;
  lastSync: string;
}

interface GoogleData {
  calendar: {
    todayEvents: Array<{ title: string; time: string }>;
    upcomingEvents: Array<{ title: string; date: string }>;
  };
  gmail: {
    unreadCount: number;
    importantEmails: Array<{ subject: string; from: string }>;
  };
}

export default function PanopticonDashboard() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [musinsa, setMusinsa] = useState<MusinsaData | null>(null);
  const [google, setGoogle] = useState<GoogleData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/panopticon/auth').then(r => r.json()).then(d => {
      if (!d.authenticated) router.replace('/panopticon/login');
      else { setIsAuth(true); loadAllData(); }
    }).catch(() => router.replace('/panopticon/login'));
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [salesRes, musinsaRes, googleRes] = await Promise.all([
        fetch('/api/panopticon/sales').then(r => r.json()).catch(() => ({ data: null })),
        fetch('/api/panopticon/musinsa').then(r => r.json()).catch(() => ({ data: null })),
        fetch('/api/panopticon/google').then(r => r.json()).catch(() => ({ data: null })),
      ]);
      setSales(salesRes.data);
      setMusinsa(musinsaRes.data);
      setGoogle(googleRes.data);
    } finally {
      setIsRefreshing(false);
    }
  };

  const logout = async () => {
    await fetch('/api/panopticon/auth', { method: 'DELETE' });
    router.replace('/panopticon/login');
  };

  const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n || 0);
  const fmtNum = (n: number) => new Intl.NumberFormat('ko-KR').format(n || 0);

  if (isAuth === null) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #333', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#666', fontSize: '14px' }}>인증 확인 중...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFF' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid #1F1F1F',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: '#0A0A0A',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '2px' }}>
            <span style={{ color: '#3B82F6' }}>●</span> PANOPTICON
          </h1>
          <span style={{ fontSize: '12px', color: '#525252', padding: '4px 8px', backgroundColor: '#1F1F1F', borderRadius: '4px' }}>
            CEO Dashboard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '20px', fontWeight: 600, margin: 0, fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
              {currentTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
          <button
            onClick={loadAllData}
            disabled={isRefreshing}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: isRefreshing ? '#1F1F1F' : '#3B82F6',
              border: 'none',
              color: '#FFF',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {isRefreshing ? '새로고침 중...' : '🔄 새로고침'}
          </button>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#1F1F1F',
              border: '1px solid #333',
              color: '#FFF',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Alert Banner */}
        {musinsa && (musinsa.urgentShipping > 0 || musinsa.urgentClaims > 0) && (
          <div style={{
            backgroundColor: '#7F1D1D',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #991B1B'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>긴급 처리 필요</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#FCA5A5' }}>
                긴급 배송: {musinsa.urgentShipping}건 | 클레임: {musinsa.urgentClaims}건
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard
            title="오늘 매출"
            value={fmt(sales?.today || 0)}
            icon="💰"
            color="#22C55E"
            subtitle={sales?.growth ? `전일 대비 ${sales.growth > 0 ? '+' : ''}${sales.growth}%` : undefined}
          />
          <StatCard
            title="이번 달 매출"
            value={fmt(sales?.thisMonth || 0)}
            icon="📊"
            color="#3B82F6"
            subtitle={`지난 달: ${fmt(sales?.lastMonth || 0)}`}
          />
          <StatCard
            title="처리 대기"
            value={fmtNum(sales?.orders?.pending || 0) + '건'}
            icon="📦"
            color="#F59E0B"
            subtitle="주문 확인 필요"
          />
          <StatCard
            title="배송 중"
            value={fmtNum(sales?.orders?.processing || 0) + '건'}
            icon="🚚"
            color="#8B5CF6"
            subtitle="출고 완료"
          />
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 무신사 현황 */}
            <Card title="무신사 파트너센터" icon="🛍️">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <MiniStat label="총 주문" value={fmtNum(musinsa?.totalOrders || 0)} unit="건" />
                <MiniStat label="대기 주문" value={fmtNum(musinsa?.pendingOrders || 0)} unit="건" highlight />
                <MiniStat label="누적 매출" value={fmt(musinsa?.revenue || 0)} />
              </div>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#1F1F1F', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  마지막 동기화: {musinsa?.lastSync ? new Date(musinsa.lastSync).toLocaleString('ko-KR') : '-'}
                </p>
              </div>
            </Card>

            {/* 주문 현황 */}
            <Card title="주문 현황" icon="📋">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <OrderStatus label="결제완료" count={sales?.orders?.pending || 0} color="#3B82F6" />
                <OrderStatus label="상품준비" count={sales?.orders?.processing || 0} color="#F59E0B" />
                <OrderStatus label="배송완료" count={sales?.orders?.completed || 0} color="#22C55E" />
                <OrderStatus label="취소/반품" count={sales?.orders?.cancelled || 0} color="#EF4444" />
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 캘린더 */}
            <Card title="오늘 일정" icon="📅">
              {google?.calendar?.todayEvents?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {google.calendar.todayEvents.map((event, i) => (
                    <div key={i} style={{ padding: '12px', backgroundColor: '#1F1F1F', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>{event.title}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>{event.time}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#525252' }}>
                  <p style={{ fontSize: '24px', margin: '0 0 8px' }}>✨</p>
                  <p style={{ margin: 0, fontSize: '14px' }}>오늘 일정이 없습니다</p>
                </div>
              )}
            </Card>

            {/* Gmail */}
            <Card title="이메일" icon="📧">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: google?.gmail?.unreadCount ? '#3B82F6' : '#1F1F1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700
                }}>
                  {google?.gmail?.unreadCount || 0}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>읽지 않은 메일</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>Gmail 연동</p>
                </div>
              </div>
              {google?.gmail?.importantEmails?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {google.gmail.importantEmails.slice(0, 3).map((email, i) => (
                    <div key={i} style={{ padding: '10px', backgroundColor: '#1F1F1F', borderRadius: '6px' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.subject}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#666' }}>{email.from}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#525252', textAlign: 'center', padding: '12px' }}>
                  중요 메일 없음
                </p>
              )}
            </Card>

            {/* Quick Actions */}
            <Card title="빠른 실행" icon="⚡">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <QuickAction label="무신사 열기" href="https://partner.musinsa.com" />
                <QuickAction label="Gmail 열기" href="https://mail.google.com" />
                <QuickAction label="캘린더 열기" href="https://calendar.google.com" />
                <QuickAction label="스프레드시트" href="https://docs.google.com/spreadsheets" />
              </div>
            </Card>
          </div>
        </div>

        {/* System Health Section */}
        <div style={{ marginTop: '24px' }}>
          <SystemHealthDark />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 24px', borderTop: '1px solid #1F1F1F', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#404040' }}>
          © 2026 Field Nine Solutions. PANOPTICON v3.0 | NEXUS AUTONOMOUS
        </p>
      </footer>
    </div>
  );
}

// Components
function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#141414', borderRadius: '16px', padding: '20px', border: '1px solid #262626' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }: { title: string; value: string; icon: string; color: string; subtitle?: string }) {
  return (
    <div style={{ backgroundColor: '#141414', borderRadius: '16px', padding: '20px', border: '1px solid #262626' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', color: '#737373', margin: 0 }}>{title}</p>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <p style={{ fontSize: '24px', fontWeight: 700, margin: 0, color }}>{value}</p>
      {subtitle && <p style={{ fontSize: '11px', color: '#525252', margin: '8px 0 0' }}>{subtitle}</p>}
    </div>
  );
}

function MiniStat({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div style={{ padding: '16px', backgroundColor: highlight ? '#1E3A5F' : '#1F1F1F', borderRadius: '12px', textAlign: 'center' }}>
      <p style={{ fontSize: '11px', color: '#737373', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: highlight ? '#60A5FA' : '#FFF' }}>
        {value}{unit && <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '2px' }}>{unit}</span>}
      </p>
    </div>
  );
}

function OrderStatus({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#1F1F1F', borderRadius: '12px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, margin: '0 auto 8px' }} />
      <p style={{ fontSize: '11px', color: '#737373', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{count}</p>
    </div>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '12px',
        backgroundColor: '#1F1F1F',
        borderRadius: '8px',
        textAlign: 'center',
        textDecoration: 'none',
        color: '#FFF',
        fontSize: '12px',
        fontWeight: 500,
        transition: 'all 0.2s',
        display: 'block'
      }}
    >
      {label}
    </a>
  );
}

// System Health Component (Dark Theme)
function SystemHealthDark() {
  const [health, setHealth] = useState<{
    status: string;
    timestamp: string;
    services: Record<string, {
      name: string;
      status: string;
      lastCheck: string | null;
      responseTime?: number | null;
      processes?: Array<{ name: string; status: string; uptime: number; restarts: number; memory: number; cpu: number }>;
      lastCommit?: { hash: string; message: string; date: string } | null;
    }>;
    version: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/system-health', { cache: 'no-store' });
      if (res.ok) setHealth(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, { bg: string; dot: string; text: string }> = {
    healthy: { bg: '#052E16', dot: '#22C55E', text: '#4ADE80' },
    degraded: { bg: '#422006', dot: '#F59E0B', text: '#FBBF24' },
    offline: { bg: '#450A0A', dot: '#EF4444', text: '#F87171' },
    unknown: { bg: '#1F1F1F', dot: '#525252', text: '#737373' },
  };

  const overallColors: Record<string, { border: string; label: string }> = {
    operational: { border: '#22C55E', label: 'ALL SYSTEMS OPERATIONAL' },
    degraded: { border: '#F59E0B', label: 'PARTIAL OUTAGE' },
    outage: { border: '#EF4444', label: 'SYSTEM OUTAGE' },
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#141414', borderRadius: '16px', padding: '20px', border: '1px solid #262626' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px' }}>🔌</span>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>System Health</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '24px', color: '#525252' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid #333', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '13px' }}>시스템 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const overall = overallColors[health.status] || overallColors.operational;

  return (
    <div style={{
      backgroundColor: '#141414',
      borderRadius: '16px',
      padding: '20px',
      border: `2px solid ${overall.border}`,
      boxShadow: `0 0 20px ${overall.border}20`
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: overall.border,
            boxShadow: `0 0 10px ${overall.border}`,
            animation: 'pulse 2s infinite'
          }} />
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>System Health</h2>
            <p style={{ fontSize: '11px', color: '#525252', margin: '2px 0 0' }}>{overall.label}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '10px', color: '#404040', fontFamily: 'monospace' }}>v{health.version}</span>
          <button
            onClick={fetchHealth}
            style={{
              marginLeft: '12px',
              padding: '4px 10px',
              fontSize: '10px',
              backgroundColor: '#262626',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#999',
              cursor: 'pointer'
            }}
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {Object.entries(health.services).map(([key, service]) => {
          const colors = statusColors[service.status] || statusColors.unknown;
          return (
            <div
              key={key}
              style={{
                backgroundColor: colors.bg,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: colors.dot,
                  boxShadow: `0 0 6px ${colors.dot}`
                }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: colors.text, textTransform: 'uppercase' }}>
                  {service.status}
                </span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#FFF' }}>{service.name}</p>
              {service.responseTime !== undefined && service.responseTime !== null && (
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0' }}>{service.responseTime}ms</p>
              )}
              {service.lastCommit && (
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0', fontFamily: 'monospace' }}>
                  {service.lastCommit.hash}
                </p>
              )}
              {service.processes && service.processes.length > 0 && (
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0' }}>
                  {service.processes.filter(p => p.status === 'online').length}/{service.processes.length} online
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* PM2 Processes */}
      {health.services.pm2?.processes && health.services.pm2.processes.length > 0 && (
        <div style={{ borderTop: '1px solid #262626', paddingTop: '16px' }}>
          <p style={{ fontSize: '10px', color: '#525252', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            PM2 Processes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {health.services.pm2.processes.map((proc, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#1A1A1A',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: proc.status === 'online' ? '#22C55E' : '#EF4444'
                  }} />
                  <span style={{ color: '#CCC' }}>{proc.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', color: '#666' }}>
                  <span>CPU: {proc.cpu?.toFixed(1) || 0}%</span>
                  <span>MEM: {((proc.memory || 0) / 1024 / 1024).toFixed(1)}MB</span>
                  <span>RST: {proc.restarts || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #262626',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '10px', color: '#404040', fontFamily: 'monospace' }}>
          NEXUS AUTONOMOUS v3.0
        </span>
        <span style={{ fontSize: '10px', color: '#404040' }}>
          Last check: {new Date(health.timestamp).toLocaleTimeString('ko-KR')}
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
