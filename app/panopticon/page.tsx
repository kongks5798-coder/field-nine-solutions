'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Mail,
  Activity,
  Wifi,
  TrendingUp,
  Trophy,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Send,
  Bot,
  User,
  Loader2,
  Bell,
  Settings,
  Search,
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
   Navigation Data
============================================ */
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/panopticon', icon: LayoutDashboard },
  { label: 'Musinsa Live', href: '/panopticon/musinsa', icon: ShoppingBag },
  { label: 'Inventory', href: '/panopticon/inventory', icon: Package },
  { label: 'Google Workspace', href: '/panopticon/workspace', icon: Mail },
];

const systemStatuses = [
  { service: 'API Gateway', status: 'online' },
  { service: 'Database', status: 'online' },
  { service: 'Cache', status: 'online' },
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
          <Activity style={{ width: '14px', height: '14px', color: '#737373' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#737373',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            System Status
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
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    animation: 'pulse 2s infinite',
                  }}
                />
                <Wifi style={{ width: '12px', height: '12px', color: '#10B981' }} />
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
          v1.0.0 · Last sync: Just now
        </p>
      </div>

      {/* Pulse Animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
      date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
      {/* Date */}
      <time style={{ fontSize: '14px', color: '#737373' }}>{currentDate}</time>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconButton icon={Search} label="Search" />
        <IconButton icon={Bell} label="Notifications" badge />
        <IconButton icon={Settings} label="Settings" />

        {/* User Profile */}
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
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#171717', margin: 0 }}>
              Boss
            </p>
            <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>CEO</p>
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
            <User style={{ width: '20px', height: '20px' }} />
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
   Metric Card Component
============================================ */
function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  subtitle?: string;
}) {
  const changeColors = {
    positive: { bg: '#ECFDF5', text: '#059669' },
    negative: { bg: '#FEF2F2', text: '#DC2626' },
    neutral: { bg: '#F5F5F5', text: '#737373' },
  };

  const colors = changeColors[changeType || 'neutral'];

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #E5E5E0',
        borderRadius: '16px',
        padding: '24px',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
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
            backgroundColor: 'rgba(229, 229, 224, 0.3)',
          }}
        >
          <Icon style={{ width: '20px', height: '20px', color: '#171717' }} />
        </div>
        {change && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: '100px',
              backgroundColor: colors.bg,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {changeType === 'positive' && (
              <ArrowUpRight style={{ width: '12px', height: '12px' }} />
            )}
            {change}
          </span>
        )}
      </div>
      <p style={{ fontSize: '14px', color: '#737373', fontWeight: 500, margin: '0 0 4px 0' }}>
        {title}
      </p>
      <p
        style={{
          fontSize: '32px',
          fontWeight: 600,
          color: '#171717',
          margin: 0,
          letterSpacing: '-1px',
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#737373', margin: '8px 0 0 0' }}>{subtitle}</p>
      )}
    </div>
  );
}

/* ============================================
   Message Bubble Component
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
      {/* Avatar */}
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
        {isUser ? (
          <User style={{ width: '16px', height: '16px' }} />
        ) : (
          <Bot style={{ width: '16px', height: '16px' }} />
        )}
      </div>

      {/* Message */}
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

/* ============================================
   Loading Indicator Component
============================================ */
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
        <Bot style={{ width: '16px', height: '16px' }} />
      </div>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '16px',
          borderTopLeftRadius: '4px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Loader2
          style={{
            width: '16px',
            height: '16px',
            color: '#171717',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            color: '#171717',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          Analyzing Field Nine Data...
        </span>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
        background: 'linear-gradient(to top, #F9F9F7 80%, transparent)',
        paddingTop: '40px',
      }}
    >
      {/* Messages Area */}
      {(messages.length > 0 || isLoading) && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 16px' }}>
          <div
            style={{
              backgroundColor: 'rgba(249, 249, 247, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              border: '1px solid #E5E5E0',
              padding: '16px',
              maxHeight: '280px',
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

      {/* Input Area */}
      <div style={{ padding: '8px 24px 24px' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: `1px solid ${isFocused ? 'rgba(23, 23, 23, 0.2)' : '#E5E5E0'}`,
              boxShadow: isFocused
                ? '0 0 60px rgba(0, 0, 0, 0.08), 0 4px 24px rgba(0, 0, 0, 0.04)'
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
              {/* Icon */}
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
                  <Loader2
                    style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}
                  />
                ) : (
                  <Sparkles style={{ width: '20px', height: '20px' }} />
                )}
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isLoading ? 'Analyzing...' : 'Ask Jarvis...'}
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#171717',
                  fontFamily: 'inherit',
                }}
              />

              {/* Submit Button */}
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
                {isLoading ? (
                  <Loader2
                    style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}
                  />
                ) : (
                  <Send style={{ width: '20px', height: '20px' }} />
                )}
              </button>
            </div>

            {/* Hint */}
            {messages.length === 0 && (
              <div
                style={{
                  padding: '4px 24px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '12px',
                  color: 'rgba(115, 115, 115, 0.6)',
                }}
              >
                <span>Try: &quot;Show me this week&apos;s sales summary&quot;</span>
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(115, 115, 115, 0.3)',
                  }}
                />
                <span>&quot;Compare revenue with last month&quot;</span>
              </div>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ============================================
   Quick Action Button Component
============================================ */
function QuickAction({ label, emoji }: { label: string; emoji: string }) {
  return (
    <button
      style={{
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        border: '1px solid #E5E5E0',
        borderRadius: '12px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.borderColor = 'rgba(115, 115, 115, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        e.currentTarget.style.borderColor = '#E5E5E0';
      }}
    >
      <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>{emoji}</span>
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#171717' }}>{label}</span>
    </button>
  );
}

/* ============================================
   Main Dashboard Page
============================================ */
export default function PanopticonDashboard() {
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const metrics = [
    {
      title: 'Total Revenue',
      value: '₩847.2M',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      subtitle: 'vs. last month',
    },
    {
      title: 'Best Product Rank',
      value: '#3',
      change: '▲ 2 ranks',
      changeType: 'positive' as const,
      icon: Trophy,
      subtitle: 'Musinsa Category',
    },
    {
      title: 'Pending Issues',
      value: '7',
      change: '3 urgent',
      changeType: 'negative' as const,
      icon: AlertCircle,
      subtitle: 'Requires attention',
    },
  ];

  const quickActions = [
    { label: 'View Sales Report', emoji: '📊' },
    { label: 'Check Inventory', emoji: '📦' },
    { label: 'Review Orders', emoji: '🛒' },
    { label: 'Team Messages', emoji: '💬' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Header />

        {/* Content */}
        <main style={{ flex: 1, padding: '32px', paddingBottom: '200px', overflowY: 'auto' }}>
          {/* Greeting */}
          <section style={{ marginBottom: '40px' }}>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 600,
                color: '#171717',
                margin: 0,
                letterSpacing: '-1px',
              }}
            >
              {greeting}, <span style={{ color: '#737373' }}>Boss.</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#737373', margin: '8px 0 0 0' }}>
              Here&apos;s what&apos;s happening with Field Nine today.
            </p>
          </section>

          {/* Key Metrics */}
          <section style={{ marginBottom: '40px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#737373',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: 0,
                }}
              >
                Key Metrics
              </h2>
              <button
                style={{
                  fontSize: '14px',
                  color: '#171717',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View all →
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {metrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#737373',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 24px 0',
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
              }}
            >
              {quickActions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </div>
          </section>
        </main>

        {/* Jarvis Interface */}
        <JarvisInterface />
      </div>
    </div>
  );
}
