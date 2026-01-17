'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, RefreshCw, TrendingUp, Package, AlertTriangle, Calendar } from 'lucide-react';

interface DashboardData {
  musinsa: {
    urgentShipping: number;
    urgentClaims: number;
    domesticOrders: { total: number; paymentComplete: number; preparing: number; shipping: number };
    products: { onSale: number; soldOut: number; total: number };
    claims: { total: number; refundRequest: number; exchangeRequest: number };
  } | null;
  google: {
    calendar: { eventCount: number; todayEvents: { title: string; time: string }[] };
  } | null;
  sales: {
    today: number;
    thisMonth: number;
    lastMonth: number;
  } | null;
}

export default function PanopticonDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<DashboardData>({ musinsa: null, google: null, sales: null });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/panopticon/auth');
      const data = await res.json();
      if (!data.authenticated) {
        router.replace('/panopticon/login');
      } else {
        setIsAuthenticated(true);
        loadData();
      }
    } catch {
      router.replace('/panopticon/login');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [musinsaRes, googleRes, salesRes] = await Promise.all([
        fetch('/api/panopticon/musinsa').then(r => r.json()).catch(() => ({ data: null })),
        fetch('/api/panopticon/google').then(r => r.json()).catch(() => ({ data: null })),
        fetch('/api/panopticon/sales').then(r => r.json()).catch(() => ({ data: null })),
      ]);
      setData({
        musinsa: musinsaRes.data,
        google: googleRes.data,
        sales: salesRes.data,
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/panopticon/auth', { method: 'DELETE' });
    router.replace('/panopticon/login');
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '40px', height: '40px', color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FAFAFA', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>PANOPTICON</h1>
          <p style={{ fontSize: '13px', color: '#525252', margin: '4px 0 0 0' }}>
            {lastUpdated ? `마지막 업데이트: ${lastUpdated.toLocaleTimeString('ko-KR')}` : '로딩 중...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={loadData} disabled={isLoading} style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#1F1F1F', border: '1px solid #333', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw style={{ width: '16px', height: '16px', animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            새로고침
          </button>
          <button onClick={handleLogout} style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#1F1F1F', border: '1px solid #333', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut style={{ width: '16px', height: '16px' }} />
            로그아웃
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Sales Card */}
        <div style={{ backgroundColor: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #262626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: '20px', height: '20px', color: '#22C55E' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>매출 현황</h2>
          </div>
          {data.sales ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 4px 0' }}>오늘 매출</p>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#22C55E' }}>{formatCurrency(data.sales.today)}</p>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 4px 0' }}>이번 달</p>
                  <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{formatCurrency(data.sales.thisMonth)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 4px 0' }}>지난 달</p>
                  <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{formatCurrency(data.sales.lastMonth)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#525252', fontSize: '14px' }}>데이터 로딩 중...</p>
          )}
        </div>

        {/* Orders Card */}
        <div style={{ backgroundColor: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #262626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: '20px', height: '20px', color: '#3B82F6' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>주문 현황</h2>
          </div>
          {data.musinsa ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#1F1F1F', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 4px 0' }}>결제완료</p>
                <p style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{data.musinsa.domesticOrders.paymentComplete}</p>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#1F1F1F', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 4px 0' }}>상품준비</p>
                <p style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{data.musinsa.domesticOrders.preparing}</p>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#1F1F1F', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 4px 0' }}>배송중</p>
                <p style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{data.musinsa.domesticOrders.shipping}</p>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#1F1F1F', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 4px 0' }}>총 주문</p>
                <p style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{data.musinsa.domesticOrders.total}</p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#525252', fontSize: '14px' }}>데이터 로딩 중...</p>
          )}
        </div>

        {/* Urgent Alerts */}
        <div style={{ backgroundColor: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #262626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>긴급 알림</h2>
          </div>
          {data.musinsa ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: data.musinsa.urgentShipping > 0 ? 'rgba(239,68,68,0.1)' : '#1F1F1F', borderRadius: '8px', border: data.musinsa.urgentShipping > 0 ? '1px solid rgba(239,68,68,0.3)' : 'none' }}>
                <span style={{ fontSize: '14px' }}>긴급 배송</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: data.musinsa.urgentShipping > 0 ? '#EF4444' : '#FAFAFA' }}>{data.musinsa.urgentShipping}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: data.musinsa.urgentClaims > 0 ? 'rgba(239,68,68,0.1)' : '#1F1F1F', borderRadius: '8px', border: data.musinsa.urgentClaims > 0 ? '1px solid rgba(239,68,68,0.3)' : 'none' }}>
                <span style={{ fontSize: '14px' }}>긴급 클레임</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: data.musinsa.urgentClaims > 0 ? '#EF4444' : '#FAFAFA' }}>{data.musinsa.urgentClaims}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#525252', fontSize: '14px' }}>데이터 로딩 중...</p>
          )}
        </div>

        {/* Calendar */}
        <div style={{ backgroundColor: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #262626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar style={{ width: '20px', height: '20px', color: '#A855F7' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>오늘 일정</h2>
          </div>
          {data.google?.calendar ? (
            data.google.calendar.todayEvents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.google.calendar.todayEvents.slice(0, 4).map((event, i) => (
                  <div key={i} style={{ padding: '12px', backgroundColor: '#1F1F1F', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', margin: '0 0 4px 0' }}>{event.title}</p>
                    <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>{event.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#525252', fontSize: '14px' }}>오늘 일정이 없습니다</p>
            )
          ) : (
            <p style={{ color: '#525252', fontSize: '14px' }}>데이터 로딩 중...</p>
          )}
        </div>
      </div>

      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
