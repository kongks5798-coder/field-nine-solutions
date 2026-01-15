'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Mail,
  Server,
  Activity,
  Wifi,
  Wallet,
  TrendingUp,
  Target,
  CreditCard,
  Sparkles as SparklesIcon,
  Calendar,
  Factory,
  Palette,
  BarChart3,
  AlertTriangle,
  Cpu,
  Send,
  Bot,
  User,
  Loader2,
  Bell,
  Settings,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Thermometer,
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

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/* ============================================
   Navigation Data (한글화)
============================================ */
const navItems: NavItem[] = [
  { label: '대시보드', href: '/panopticon', icon: LayoutDashboard },
  { label: '무신사 라이브', href: '/panopticon/musinsa', icon: ShoppingBag },
  { label: '재고/물류', href: '/panopticon/inventory', icon: Package },
  { label: '구글 워크스페이스', href: '/panopticon/workspace', icon: Mail },
  { label: '서버 관리', href: '/panopticon/server', icon: Server },
];

const systemStatuses = [
  { service: 'API 게이트웨이', status: 'online' },
  { service: '데이터베이스', status: 'online' },
  { service: '캐시 서버', status: 'online' },
];

/* ============================================
   Sidebar Component
============================================ */
function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '280px',
        height: '100vh',
        backgroundColor: '#F9F9F7',
        borderRight: '1px solid #E5E5E0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '32px', borderBottom: '1px solid #E5E5E0' }}>
        <Link href="/panopticon" style={{ textDecoration: 'none' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#171717',
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            FIELD NINE<span style={{ color: '#737373' }}>.</span>
          </h1>
          <p
            style={{
              fontSize: '11px',
              color: '#737373',
              margin: '4px 0 0 0',
              letterSpacing: '2px',
            }}
          >
            PANOPTICON
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '24px 16px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href} style={{ marginBottom: '4px' }}>
                <Link
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: isActive ? '#171717' : 'transparent',
                    color: isActive ? '#F9F9F7' : '#737373',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#E5E5E0';
                      e.currentTarget.style.color = '#171717';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#737373';
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* System Status */}
      <div style={{ padding: '24px', borderTop: '1px solid #E5E5E0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <Activity className="w-3.5 h-3.5" style={{ color: '#737373' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#737373',
              letterSpacing: '1px',
            }}
          >
            시스템 상태
          </span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {systemStatuses.map((system) => (
            <li
              key={system.service}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#737373' }}>
                {system.service}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="pulse-dot"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                  }}
                />
                <Wifi className="w-3 h-3" style={{ color: '#10B981' }} />
              </div>
            </li>
          ))}
        </ul>
        <p
          style={{
            fontSize: '10px',
            color: '#A3A3A3',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #E5E5E0',
          }}
        >
          v1.0.0 · 마지막 동기화: 방금 전
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-dot {
          animation: pulse 2s infinite;
        }
      `}</style>
    </aside>
  );
}

/* ============================================
   Header Component
============================================ */
function Header() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const date = new Date();
    setCurrentDate(
      date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    );
  }, []);

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'rgba(249, 249, 247, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #E5E5E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <time style={{ fontSize: '14px', color: '#737373' }}>{currentDate}</time>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconButton icon={Search} label="검색" />
        <IconButton icon={Bell} label="알림" badge />
        <IconButton icon={Settings} label="설정" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginLeft: '16px',
            paddingLeft: '16px',
            borderLeft: '1px solid #E5E5E0',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#171717', margin: 0 }}>
              공경수
            </p>
            <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>대표이사</p>
          </div>
          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#171717',
              color: '#F9F9F7',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  icon: Icon,
  label,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: boolean;
}) {
  return (
    <button
      aria-label={label}
      style={{
        position: 'relative',
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: '#737373',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#E5E5E0';
        e.currentTarget.style.color = '#171717';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#737373';
      }}
    >
      <Icon className="w-5 h-5" />
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#EF4444',
          }}
        />
      )}
    </button>
  );
}

/* ============================================
   Business Metric Card Component
============================================ */
function BusinessCard({
  title,
  value,
  badge,
  badgeType = 'neutral',
  icon: Icon,
  subtitle,
  highlight = false,
}: {
  title: string;
  value: string;
  badge?: string;
  badgeType?: 'positive' | 'negative' | 'warning' | 'neutral';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  subtitle?: React.ReactNode;
  highlight?: boolean;
}) {
  const badgeColors = {
    positive: { bg: '#ECFDF5', text: '#059669', icon: ArrowUpRight },
    negative: { bg: '#FEF2F2', text: '#DC2626', icon: ArrowDownRight },
    warning: { bg: '#FFFBEB', text: '#D97706', icon: AlertTriangle },
    neutral: { bg: '#F5F5F5', text: '#737373', icon: null },
  };

  const colors = badgeColors[badgeType];
  const BadgeIcon = colors.icon;

  return (
    <div
      style={{
        backgroundColor: highlight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(8px)',
        border: highlight ? '1.5px solid #171717' : '1px solid #E5E5E0',
        borderRadius: '16px',
        padding: '24px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: highlight ? '#171717' : 'rgba(229, 229, 224, 0.3)',
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: highlight ? '#F9F9F7' : '#171717' }}
          />
        </div>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '100px',
              backgroundColor: colors.bg,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
            {badge}
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: '13px',
          color: '#737373',
          fontWeight: 500,
          margin: '0 0 6px 0',
          letterSpacing: '-0.2px',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: highlight ? '28px' : '24px',
          fontWeight: 700,
          color: '#171717',
          margin: 0,
          letterSpacing: '-1px',
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          style={{
            fontSize: '12px',
            color: '#737373',
            margin: '10px 0 0 0',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ============================================
   Section Header Component
============================================ */
function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}
    >
      <h2
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#171717',
          letterSpacing: '-0.2px',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            width: '3px',
            height: '16px',
            backgroundColor: '#171717',
            borderRadius: '2px',
          }}
        />
        {title}
      </h2>
      {action && (
        <button
          style={{
            fontSize: '13px',
            color: '#737373',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#171717')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
        >
          {action}
        </button>
      )}
    </div>
  );
}

/* ============================================
   Message Components
============================================ */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: isUser ? '#171717' : '#E5E5E0',
          color: isUser ? '#F9F9F7' : '#171717',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          borderRadius: '16px',
          borderTopRightRadius: isUser ? '4px' : '16px',
          borderTopLeftRadius: isUser ? '16px' : '4px',
          backgroundColor: isUser ? '#171717' : '#FFFFFF',
          color: isUser ? '#F9F9F7' : '#171717',
          border: isUser ? 'none' : '1px solid #E5E5E0',
          boxShadow: isUser ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{message.content}</p>
        <p
          style={{
            fontSize: '10px',
            color: isUser ? 'rgba(249, 249, 247, 0.5)' : '#737373',
            marginTop: '6px',
            marginBottom: 0,
          }}
        >
          {message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#E5E5E0',
          color: '#171717',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Bot className="w-4 h-4" />
      </div>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '16px',
          borderTopLeftRadius: '4px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#171717' }} />
        <span className="animate-pulse" style={{ fontSize: '14px', color: '#171717' }}>
          Field Nine 데이터 분석 중...
        </span>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   Jarvis AI Interface Component
============================================ */
function JarvisInterface() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

    try {
      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Jarvis API Error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '죄송합니다, 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '280px',
        right: 0,
        background: 'linear-gradient(to top, #F9F9F7 85%, transparent)',
        paddingTop: '40px',
        zIndex: 50,
      }}
    >
      {(messages.length > 0 || isLoading) && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 16px' }}>
          <div
            style={{
              backgroundColor: 'rgba(249, 249, 247, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              border: '1px solid #E5E5E0',
              padding: '16px',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 24px 24px' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: `1px solid ${isFocused ? 'rgba(23, 23, 23, 0.3)' : '#E5E5E0'}`,
              boxShadow: isFocused
                ? '0 0 60px rgba(0, 0, 0, 0.1), 0 4px 24px rgba(0, 0, 0, 0.06)'
                : '0 4px 16px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: isLoading
                    ? 'rgba(229, 229, 224, 0.5)'
                    : isFocused
                    ? '#171717'
                    : 'rgba(229, 229, 224, 0.5)',
                  color: isLoading ? '#737373' : isFocused ? '#F9F9F7' : '#737373',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SparklesIcon className="w-5 h-5" />
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={
                  isLoading
                    ? '분석 중...'
                    : "자비스에게 업무 지시 (예: '이번 주 무신사 정산금이랑 생산비 비교 보고서 뽑아줘')"
                }
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: '#171717',
                  fontFamily: 'inherit',
                }}
              />

              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor:
                    query.trim() && !isLoading ? '#171717' : 'rgba(229, 229, 224, 0.5)',
                  color: query.trim() && !isLoading ? '#F9F9F7' : '#737373',
                  cursor: query.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   Main Dashboard Page
============================================ */
export default function PanopticonDashboard() {
  const [greeting, setGreeting] = useState('안녕하세요');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('좋은 아침입니다');
    } else if (hour < 18) {
      setGreeting('좋은 오후입니다');
    } else {
      setGreeting('좋은 저녁입니다');
    }
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9F9F7' }}>
      <Sidebar />

      <div style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <main style={{ flex: 1, padding: '32px', paddingBottom: '200px', overflowY: 'auto' }}>
          {/* Greeting */}
          <section style={{ marginBottom: '40px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 600,
                color: '#171717',
                margin: 0,
                letterSpacing: '-1px',
              }}
            >
              {greeting}, <span style={{ color: '#737373' }}>대표님.</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#737373', margin: '8px 0 0 0' }}>
              Field Nine 비즈니스 현황을 한눈에 확인하세요.
            </p>
          </section>

          {/* Section A: Financial Overview */}
          <section style={{ marginBottom: '32px' }}>
            <SectionHeader title="재무 / 매출 / 지출" action="상세 보기 →" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              <BusinessCard
                title="이번 달 매출"
                value="₩ 124,500,000"
                badge="전월 대비 +15%"
                badgeType="positive"
                icon={Wallet}
                subtitle="목표 대비 103% 달성"
                highlight={true}
              />
              <BusinessCard
                title="영업 이익률"
                value="12.4%"
                badge="목표 달성"
                badgeType="positive"
                icon={Target}
                subtitle="전월 11.2% → 금월 12.4%"
              />
              <BusinessCard
                title="예상 고정 지출"
                value="₩ 45,000,000"
                badge="이번 달 예정"
                badgeType="neutral"
                icon={CreditCard}
                subtitle="인건비 + 임대료 + 물류비"
              />
            </div>
          </section>

          {/* Section B: Operation & Product */}
          <section style={{ marginBottom: '32px' }}>
            <SectionHeader title="생산 / 디자인" action="일정 보기 →" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              <BusinessCard
                title="Aura Sydney 런칭"
                value="D-45"
                badge="진행 중"
                badgeType="neutral"
                icon={Calendar}
                subtitle="S/S 컬렉션 샘플링 80% 완료"
              />
              <BusinessCard
                title="Filluminate 생산"
                value="24FW 리오더"
                badge="출고 대기"
                badgeType="warning"
                icon={Factory}
                subtitle="공장 출고 대기: 1,200장"
              />
              <BusinessCard
                title="디자인 컨펌 대기"
                value="3건"
                badge="확인 필요"
                badgeType="warning"
                icon={Palette}
                subtitle="26 S/S 룩북 시안 포함"
              />
            </div>
          </section>

          {/* Section C: Sales & Support */}
          <section style={{ marginBottom: '32px' }}>
            <SectionHeader title="영업 / 지원 / 특이사항" action="전체 보기 →" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              <BusinessCard
                title="무신사 실시간 랭킹"
                value="전체 8위"
                badge="아우터 2위 ▲"
                badgeType="positive"
                icon={BarChart3}
                subtitle="아우터 부문 TOP 3 유지"
              />
              <BusinessCard
                title="CS / 클레임"
                value="주의 요망"
                badge="급증"
                badgeType="negative"
                icon={AlertTriangle}
                subtitle="배송 지연 문의 15건 급증"
              />
              <BusinessCard
                title="시스템 상태"
                value="RTX 5090 Server"
                badge="정상"
                badgeType="positive"
                icon={Cpu}
                subtitle={
                  <>
                    가동률 45% · 온도 62°C
                  </>
                }
              />
            </div>
          </section>
        </main>

        <JarvisInterface />
      </div>
    </div>
  );
}
