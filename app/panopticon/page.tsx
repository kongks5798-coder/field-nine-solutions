'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Eye,
  ShoppingBag,
  Mail,
  Calendar,
  Activity,
  Send,
  Bot,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  RotateCcw,
  AlertTriangle,
  Zap,
  TrendingUp,
  FileText,
  Inbox,
  ChevronRight,
  LogOut,
} from 'lucide-react';

/* ============================================
   Types
============================================ */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MusinsaData {
  urgentShipping: number;
  urgentClaims: number;
  domesticOrders: {
    paymentComplete: number;
    preparing: number;
    shipping: number;
    delivered: number;
    confirmed: number;
    total: number;
  };
  globalOrders: {
    total: number;
  };
  products: {
    onSale: number;
    soldOut: number;
    suspended: number;
    total: number;
  };
  claims: {
    refundRequest: number;
    exchangeRequest: number;
    total: number;
  };
  sessionValid: boolean;
}

interface GoogleData {
  calendar: {
    todayEvents: Array<{ title: string; time: string; location: string | null }>;
    eventCount: number;
  };
  gmail: {
    unreadCount: number;
  };
  drive?: {
    recentFiles: Array<{ name: string; modifiedTime: string }>;
  };
}

interface SalesData {
  today: {
    grossSales: number;
    netSales: number;
    orders: number;
    byChannel: Record<string, { grossSales: number; netSales: number; orders: number }>;
  };
  week: {
    grossSales: number;
    netSales: number;
    orders: number;
  };
  month: {
    grossSales: number;
    netSales: number;
    orders: number;
    returns: number;
    refunds: number;
    growth: number;
  };
  topProducts: Array<{
    productName: string;
    quantitySold: number;
    grossSales: number;
  }>;
  channelRanking: Array<{
    channel: string;
    grossSales: number;
    netSales: number;
    orders: number;
  }>;
  updatedAt: string;
}

/* ============================================
   Utility Functions
============================================ */
const formatNumber = (n: number) => n.toLocaleString('ko-KR');
const formatCurrency = (n: number) => {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '새벽입니다';
  if (hour < 12) return '좋은 아침입니다';
  if (hour < 18) return '좋은 오후입니다';
  return '좋은 저녁입니다';
};

/* ============================================
   Glassmorphism Card Component
============================================ */
function GlassCard({
  children,
  className = '',
  glow = false,
  glowColor = '#3B82F6',
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px',
        boxShadow: glow
          ? `0 0 60px ${glowColor}15, 0 8px 32px rgba(0,0,0,0.4)`
          : '0 8px 32px rgba(0,0,0,0.3)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}

/* ============================================
   Status Indicator Component
============================================ */
function StatusIndicator({ active, label }: { active: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: active ? '#22C55E' : '#404040',
          boxShadow: active ? '0 0 12px #22C55E' : 'none',
          animation: active ? 'pulse 2s infinite' : 'none',
        }}
      />
      <span style={{ fontSize: '12px', color: active ? '#A3A3A3' : '#525252' }}>{label}</span>
    </div>
  );
}

/* ============================================
   Metric Ring Component (Tesla-style)
============================================ */
function MetricRing({
  value,
  max,
  label,
  color,
  size = 120,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
  size?: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: 0, lineHeight: 1 }}>
            {formatNumber(value)}
          </p>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: '#737373', marginTop: '12px' }}>{label}</p>
    </div>
  );
}

/* ============================================
   Order Status Bar Component
============================================ */
function OrderStatusBar({ data }: { data: MusinsaData['domesticOrders'] }) {
  const total = data.paymentComplete + data.preparing + data.shipping + data.delivered;
  const getWidth = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  const segments = [
    { value: data.paymentComplete, color: '#3B82F6', label: '결제완료' },
    { value: data.preparing, color: '#F59E0B', label: '상품준비' },
    { value: data.shipping, color: '#8B5CF6', label: '배송중' },
    { value: data.delivered, color: '#22C55E', label: '배송완료' },
  ];

  return (
    <div>
      {/* Progress Bar */}
      <div
        style={{
          height: '8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {segments.map((seg, idx) => (
          <div
            key={idx}
            style={{
              width: `${getWidth(seg.value)}%`,
              height: '100%',
              backgroundColor: seg.color,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        {segments.map((seg, idx) => (
          <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: '24px', fontWeight: 700, color: seg.color, margin: 0 }}>
              {formatNumber(seg.value)}
            </p>
            <p style={{ fontSize: '11px', color: '#737373', marginTop: '4px' }}>{seg.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================
   Alert Banner Component
============================================ */
function AlertBanner({
  type,
  icon: Icon,
  title,
  value,
  action,
}: {
  type: 'danger' | 'warning';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  value: number;
  action?: () => void;
}) {
  const colors = {
    danger: {
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#FCA5A5',
      glow: '#EF4444',
    },
    warning: {
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#FCD34D',
      glow: '#F59E0B',
    },
  };
  const c = colors[type];

  return (
    <div
      onClick={action}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: action ? 'pointer' : 'default',
        boxShadow: `0 0 30px ${c.glow}20`,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Icon style={{ width: '20px', height: '20px', color: c.text }} />
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: c.text, margin: 0 }}>
            {title}
          </p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#FAFAFA', margin: '4px 0 0 0' }}>
            {formatNumber(value)}건
          </p>
        </div>
      </div>
      {action && <ChevronRight style={{ width: '20px', height: '20px', color: c.text }} />}
    </div>
  );
}

/* ============================================
   Schedule Card Component
============================================ */
function ScheduleCard({ events }: { events: Array<{ title: string; time: string; location: string | null }> }) {
  if (events.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <Calendar style={{ width: '48px', height: '48px', color: '#262626', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '14px', color: '#525252' }}>오늘 일정이 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      {events.slice(0, 4).map((event, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            padding: '16px 0',
            borderBottom: idx < events.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '40px',
              borderRadius: '2px',
              background: 'linear-gradient(180deg, #3B82F6 0%, #8B5CF6 100%)',
            }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA', margin: 0 }}>{event.title}</p>
            <p style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>
              {event.time}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   Sales Dashboard Card
============================================ */
function SalesCard({ data }: { data: SalesData | null }) {
  if (!data) {
    return (
      <GlassCard glow glowColor="#22C55E">
        <div style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)',
              }}
            >
              <TrendingUp style={{ width: '24px', height: '24px', color: '#22C55E' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>매출 현황</h2>
              <p style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>Google Sheets 연동 대기</p>
            </div>
          </div>
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <TrendingUp style={{ width: '48px', height: '48px', color: '#262626', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '14px', color: '#525252', marginBottom: '8px' }}>
              매출 데이터를 불러올 수 없습니다
            </p>
            <p style={{ fontSize: '12px', color: '#404040' }}>
              GOOGLE_SALES_SPREADSHEET_ID 환경변수를 설정하세요
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const growthColor = data.month.growth >= 0 ? '#22C55E' : '#EF4444';
  const growthIcon = data.month.growth >= 0 ? '↑' : '↓';

  return (
    <GlassCard glow glowColor="#22C55E">
      <div style={{ padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)',
              }}
            >
              <TrendingUp style={{ width: '24px', height: '24px', color: '#22C55E' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>매출 현황</h2>
              <p style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>Google Sheets 실시간 연동</p>
            </div>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: `${growthColor}20`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: growthColor }}>
              {growthIcon} {Math.abs(data.month.growth).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Main Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Today */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 8px 0' }}>오늘 매출</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#3B82F6', margin: 0 }}>
              {formatCurrency(data.today.grossSales)}
            </p>
            <p style={{ fontSize: '11px', color: '#525252', marginTop: '4px' }}>
              {formatNumber(data.today.orders)}건
            </p>
          </div>

          {/* This Week */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)',
              border: '1px solid rgba(139,92,246,0.15)',
            }}
          >
            <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 8px 0' }}>이번 주</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#8B5CF6', margin: 0 }}>
              {formatCurrency(data.week.grossSales)}
            </p>
            <p style={{ fontSize: '11px', color: '#525252', marginTop: '4px' }}>
              {formatNumber(data.week.orders)}건
            </p>
          </div>

          {/* This Month */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)',
              border: '1px solid rgba(34,197,94,0.15)',
            }}
          >
            <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 8px 0' }}>이번 달</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#22C55E', margin: 0 }}>
              {formatCurrency(data.month.grossSales)}
            </p>
            <p style={{ fontSize: '11px', color: '#525252', marginTop: '4px' }}>
              {formatNumber(data.month.orders)}건 · 환불 {formatNumber(data.month.returns)}건
            </p>
          </div>
        </div>

        {/* Channel Ranking */}
        {data.channelRanking && data.channelRanking.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#A3A3A3', margin: '0 0 12px 0' }}>
              채널별 매출 순위
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.channelRanking.slice(0, 4).map((channel, idx) => (
                <div
                  key={channel.channel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#A3A3A3' : idx === 2 ? '#CD7F32' : '#404040',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#FFF',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', color: '#FAFAFA' }}>{channel.channel}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                      {formatCurrency(channel.grossSales)}원
                    </p>
                    <p style={{ fontSize: '11px', color: '#525252', margin: '2px 0 0 0' }}>
                      {formatNumber(channel.orders)}건
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/* ============================================
   JARVIS AI Chat (Premium Style)
============================================ */
function JarvisChat() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { id: `assistant-${Date.now()}`, role: 'assistant', content: data.answer, timestamp: new Date() },
        ]);
      }
    } catch (error) {
      console.error('Jarvis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '420px',
        background: 'linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(10,10,10,0.98) 100%)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.1)',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.4)',
            }}
          >
            <Bot style={{ width: '20px', height: '20px', color: '#FFF' }} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>JARVIS</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22C55E',
                  boxShadow: '0 0 8px #22C55E',
                }}
              />
              <span style={{ fontSize: '11px', color: '#22C55E' }}>Online · GPT-4</span>
            </div>
          </div>
        </div>
        <Zap style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
      </div>

      {/* Messages */}
      {isExpanded && (
        <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '16px 20px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#525252' }}>
                무신사 현황, 일정 등 무엇이든 물어보세요
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                      : 'rgba(255,255,255,0.05)',
                  color: '#FAFAFA',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                <Loader2
                  style={{
                    width: '18px',
                    height: '18px',
                    color: '#3B82F6',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="무엇이든 물어보세요..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#FAFAFA',
            }}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: query.trim() ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : '#262626',
              border: 'none',
              cursor: query.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send style={{ width: '16px', height: '16px', color: '#FFF' }} />
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================
   Main Dashboard
============================================ */
export default function PanopticonDashboard() {
  const [musinsaData, setMusinsaData] = useState<MusinsaData | null>(null);
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [musinsaRes, googleRes, salesRes] = await Promise.all([
        fetch('/api/panopticon/musinsa'),
        fetch('/api/panopticon/google'),
        fetch('/api/panopticon/sales?type=dashboard'),
      ]);
      const musinsaJson = await musinsaRes.json();
      const googleJson = await googleRes.json();
      const salesJson = await salesRes.json();
      if (musinsaJson.success) setMusinsaData(musinsaJson.data);
      if (googleJson.success) setGoogleData(googleJson.data);
      if (salesJson.success) setSalesData(salesJson.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch('/api/panopticon/auth', { method: 'DELETE' });
    window.location.href = '/panopticon/login';
  };

  const totalOrders = musinsaData
    ? musinsaData.domesticOrders.paymentComplete +
      musinsaData.domesticOrders.preparing +
      musinsaData.domesticOrders.shipping +
      musinsaData.domesticOrders.delivered
    : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        background: 'radial-gradient(ellipse at top, #0A0A0A 0%, #000000 100%)',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Gradient Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-200px',
          right: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-300px',
          left: '-200px',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '40px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(59,130,246,0.3)',
            }}
          >
            <Eye style={{ width: '28px', height: '28px', color: '#FFF' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: 0, letterSpacing: '-0.5px' }}>
              {getTimeGreeting()}, <span style={{ color: '#3B82F6' }}>대표님</span>
            </h1>
            <p style={{ fontSize: '14px', color: '#525252', marginTop: '4px' }}>
              PANOPTICON · Field Nine Business Intelligence
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Status Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginRight: '20px' }}>
            <StatusIndicator active={musinsaData?.sessionValid || false} label="무신사" />
            <StatusIndicator active={googleData !== null} label="Google" />
            <StatusIndicator active={salesData !== null} label="매출" />
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#404040', fontSize: '12px' }}>
              <Clock style={{ width: '14px', height: '14px' }} />
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#FAFAFA',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw
              style={{
                width: '16px',
                height: '16px',
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            동기화
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#737373',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </header>

      {/* Alerts */}
      {musinsaData && (musinsaData.urgentShipping > 0 || musinsaData.urgentClaims > 0) && (
        <section style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {musinsaData.urgentShipping > 0 && (
            <AlertBanner
              type="danger"
              icon={AlertTriangle}
              title="긴급 출고 필요"
              value={musinsaData.urgentShipping}
              action={() => window.open('https://partner.musinsa.com', '_blank')}
            />
          )}
          {musinsaData.urgentClaims > 0 && (
            <AlertBanner
              type="warning"
              icon={RotateCcw}
              title="클레임 대응 필요"
              value={musinsaData.urgentClaims}
            />
          )}
        </section>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', position: 'relative', zIndex: 10 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Sales Overview */}
          <SalesCard data={salesData} />

          {/* Musinsa Overview */}
          <GlassCard glow glowColor="#3B82F6">
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)',
                    }}
                  >
                    <ShoppingBag style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>무신사 파트너센터</h2>
                    <p style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>
                      {musinsaData?.sessionValid ? '실시간 연동 중' : '세션 만료 - 재로그인 필요'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/panopticon/musinsa"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#3B82F6',
                    textDecoration: 'none',
                  }}
                >
                  상세보기 <ChevronRight style={{ width: '16px', height: '16px' }} />
                </Link>
              </div>

              {musinsaData?.sessionValid ? (
                <>
                  {/* Order Status Bar */}
                  <OrderStatusBar data={musinsaData.domesticOrders} />

                  {/* Quick Stats */}
                  <div
                    style={{
                      marginTop: '28px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        border: '1px solid rgba(34, 197, 94, 0.15)',
                        textAlign: 'center',
                      }}
                    >
                      <CheckCircle2 style={{ width: '24px', height: '24px', color: '#22C55E', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '28px', fontWeight: 700, color: '#22C55E', margin: 0 }}>
                        {formatNumber(musinsaData.products.onSale)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>판매중</p>
                    </div>
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        textAlign: 'center',
                      }}
                    >
                      <XCircle style={{ width: '24px', height: '24px', color: '#EF4444', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '28px', fontWeight: 700, color: '#EF4444', margin: 0 }}>
                        {formatNumber(musinsaData.products.soldOut)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>품절</p>
                    </div>
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'rgba(139, 92, 246, 0.08)',
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                        textAlign: 'center',
                      }}
                    >
                      <Package style={{ width: '24px', height: '24px', color: '#8B5CF6', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '28px', fontWeight: 700, color: '#8B5CF6', margin: 0 }}>
                        {formatNumber(musinsaData.claims.total)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>클레임</p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <ShoppingBag style={{ width: '48px', height: '48px', color: '#262626', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: '14px', color: '#525252', marginBottom: '16px' }}>
                    무신사 세션이 만료되었습니다
                  </p>
                  <button
                    onClick={() => window.open('https://partner.musinsa.com', '_blank')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      border: 'none',
                      color: '#FFF',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    파트너센터 바로가기
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Metrics Rings */}
          {musinsaData?.sessionValid && (
            <GlassCard>
              <div style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 24px 0' }}>
                  주문 현황 Overview
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <MetricRing
                    value={totalOrders}
                    max={500}
                    label="전체 주문"
                    color="#3B82F6"
                  />
                  <MetricRing
                    value={musinsaData.domesticOrders.preparing}
                    max={100}
                    label="처리 대기"
                    color="#F59E0B"
                  />
                  <MetricRing
                    value={musinsaData.domesticOrders.shipping}
                    max={200}
                    label="배송 중"
                    color="#8B5CF6"
                  />
                  <MetricRing
                    value={musinsaData.products.onSale}
                    max={500}
                    label="판매 상품"
                    color="#22C55E"
                  />
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Today's Schedule */}
          <GlassCard glow glowColor="#8B5CF6">
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)',
                    }}
                  >
                    <Calendar style={{ width: '20px', height: '20px', color: '#8B5CF6' }} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>오늘 일정</h3>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(139,92,246,0.15)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#A78BFA',
                  }}
                >
                  {googleData?.calendar.eventCount || 0}건
                </span>
              </div>
              <ScheduleCard events={googleData?.calendar.todayEvents || []} />
            </div>
          </GlassCard>

          {/* Gmail */}
          <GlassCard>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(234,88,12,0.2) 0%, rgba(234,88,12,0.05) 100%)',
                  }}
                >
                  <Mail style={{ width: '20px', height: '20px', color: '#F97316' }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Gmail</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316', margin: 0 }}>
                    {googleData?.gmail.unreadCount || 0}
                  </p>
                  <p style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>읽지 않은 메일</p>
                </div>
                <Inbox style={{ width: '48px', height: '48px', color: '#262626' }} />
              </div>
            </div>
          </GlassCard>

          {/* System Status */}
          <GlassCard>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)',
                  }}
                >
                  <Activity style={{ width: '20px', height: '20px', color: '#22C55E' }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>시스템 상태</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: '무신사 파트너센터', connected: musinsaData?.sessionValid || false },
                  { name: 'Google Workspace', connected: googleData !== null },
                  { name: 'JARVIS AI (GPT-4)', connected: true },
                  { name: 'Panopticon Server', connected: true },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#A3A3A3' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: item.connected ? '#22C55E' : '#EF4444',
                          boxShadow: item.connected ? '0 0 8px #22C55E' : '0 0 8px #EF4444',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: item.connected ? '#22C55E' : '#EF4444',
                        }}
                      >
                        {item.connected ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* JARVIS Chat */}
      <JarvisChat />

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #262626 transparent;
        }
        *::-webkit-scrollbar {
          width: 6px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
