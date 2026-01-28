'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 65: CORE ENERGY TRIAD - SIMPLIFIED NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 핵심 3대 기능만 남긴 정예화된 네비게이션
 * 1. Energy Node (Dashboard)
 * 2. Developer API (Docs)
 * 3. Kaus Exchange (Trading)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  label: string;
  icon: string;
  activeIcon: string;
  href: string;
}

// PHASE 65: CORE ENERGY TRIAD ONLY
const NAV_ITEMS: NavItem[] = [
  { id: 'energy', label: 'Energy', icon: '⚡', activeIcon: '⚡', href: '/nexus/energy' },
  { id: 'api', label: 'API', icon: '🔌', activeIcon: '🔌', href: '/nexus/api-docs' },
  { id: 'exchange', label: 'Exchange', icon: '💰', activeIcon: '💰', href: '/nexus/exchange' },
];

// PHASE 65: SIMPLIFIED CORE TRIAD NAVIGATION
export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    const path = pathname.replace(/^\/[a-z]{2}/, '');
    if (item.href === '/nexus/energy' && (path === '/nexus/energy' || path === '/nexus')) return true;
    if (item.href === '/nexus/api-docs' && path.includes('api-docs')) return true;
    if (item.href === '/nexus/exchange' && path.includes('exchange')) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#171717] border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around pb-safe pt-3 pb-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
                active ? 'text-[#00E5FF]' : 'text-white/50'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-bold tracking-wide">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-1 w-8 h-0.5 bg-[#00E5FF] rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 65: MOBILE MENU REMOVED - Core Triad Navigation Only
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE HEADER (Phase 73: Scroll Animation Enhanced)
// ═══════════════════════════════════════════════════════════════════════════════

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  transparent?: boolean;
  subtitle?: string;
}

export function MobileHeader({
  title = 'Field Nine',
  showBack,
  onBack,
  rightContent,
  transparent = false,
  subtitle,
}: MobileHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setScrolled(y > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate dynamic values based on scroll
  const headerOpacity = transparent ? Math.min(scrollY / 100, 0.95) : 0.95;
  const blurAmount = Math.min(scrollY / 10, 12);
  const titleScale = Math.max(1 - scrollY / 500, 0.9);
  const showSubtitle = scrollY < 50;

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: transparent
          ? `rgba(23, 23, 23, ${headerOpacity})`
          : 'rgba(23, 23, 23, 0.95)',
      }}
      transition={{ duration: 0.15 }}
      className="sticky top-0 z-40 md:hidden border-b border-white/10"
      style={{
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 pt-safe">
        <div className="flex items-center gap-3">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={onBack}
              className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white active:bg-white/20 transition-colors"
            >
              ←
            </motion.button>
          )}
          <div>
            <motion.h1
              initial={false}
              animate={{ scale: titleScale }}
              style={{ originX: 0 }}
              className="font-bold text-white text-base"
            >
              {title}
            </motion.h1>
            <AnimatePresence>
              {subtitle && showSubtitle && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[10px] text-white/50"
                >
                  {subtitle}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
        {rightContent || (
          <div className="flex items-center gap-2">
            {/* Live Status Indicator */}
            <motion.div
              animate={{ opacity: scrolled ? 1 : 0.7 }}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
            </motion.div>

            {/* Notification Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              className="relative w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white active:bg-white/20 transition-colors"
            >
              <motion.span
                animate={scrolled ? {} : { y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔔
              </motion.span>
              {/* Notification badge with pulse */}
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center"
              >
                3
              </motion.span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Scroll Progress Indicator */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.min(scrollY / 500, 1) }}
        style={{ originX: 0 }}
        className="h-[2px] bg-gradient-to-r from-[#00E5FF] to-[#00E5FF]/50"
      />
    </motion.header>
  );
}

/**
 * Collapsible Header - 스크롤 시 축소되는 헤더
 */
interface CollapsibleHeaderProps {
  title: string;
  expandedContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function CollapsibleHeader({ title, expandedContent, children }: CollapsibleHeaderProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setExpanded(window.scrollY < 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ height: expanded ? 'auto' : 56 }}
      className="sticky top-0 z-40 bg-[#171717]/95 backdrop-blur-lg overflow-hidden md:hidden"
    >
      <div className="px-4 py-3 pt-safe">
        <motion.h1
          animate={{ fontSize: expanded ? '1.5rem' : '1rem' }}
          className="font-black text-white"
        >
          {title}
        </motion.h1>

        <AnimatePresence>
          {expanded && expandedContent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3"
            >
              {expandedContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

interface MobileWrapperProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
  className?: string;
}

export function MobileWrapper({ children, title, showBottomNav = true, className = '' }: MobileWrapperProps) {
  return (
    <div className={`min-h-screen bg-[#F9F9F7] ${className}`}>
      {/* Mobile Header */}
      <MobileHeader title={title} />

      {/* Content with bottom padding for nav */}
      <main className={`${showBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════

interface ResponsiveContainerProps {
  children: React.ReactNode;
  desktopSidebar?: React.ReactNode;
  mobileTitle?: string;
}

export function ResponsiveContainer({ children, desktopSidebar, mobileTitle }: ResponsiveContainerProps) {
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        {desktopSidebar}
        <div className="ml-56">
          {children}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileWrapper title={mobileTitle}>
          {children}
        </MobileWrapper>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className = '', onClick }: MobileCardProps) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 border border-[#171717]/10 ${
        onClick ? 'cursor-pointer active:bg-gray-50' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface FloatingActionButtonProps {
  icon: string;
  label?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function FloatingActionButton({
  icon,
  label,
  onClick,
  variant = 'primary'
}: FloatingActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed bottom-20 right-4 z-40 md:hidden flex items-center gap-2 px-4 py-3 rounded-full shadow-lg ${
        variant === 'primary'
          ? 'bg-[#00E5FF] text-[#171717] shadow-[0_0_20px_rgba(0,229,255,0.3)]'
          : 'bg-[#171717] text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      {label && <span className="font-bold text-sm">{label}</span>}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULL TO REFRESH
// ═══════════════════════════════════════════════════════════════════════════════

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      (e.currentTarget as HTMLElement).dataset.startY = String(touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const startY = Number((e.currentTarget as HTMLElement).dataset.startY || 0);
    if (startY && window.scrollY === 0) {
      const touch = e.touches[0];
      const diff = touch.clientY - startY;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh Indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: pullDistance || 60 }}
            exit={{ height: 0 }}
            className="flex items-center justify-center bg-gray-100 overflow-hidden"
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 2 }}
              transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
              className="text-2xl"
            >
              {isRefreshing ? '⏳' : pullDistance >= threshold ? '↓' : '↻'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE TAB BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface MobileTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MobileTabBar({ tabs, activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:hidden">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === tab.id
              ? 'bg-[#171717] text-white'
              : 'bg-white border border-[#171717]/10 text-[#171717]'
          }`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 73: MICRO-INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Haptic-style Button - 터치 시 진동 효과
 */
interface HapticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function HapticButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: HapticButtonProps) {
  const handleClick = () => {
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.();
  };

  const variants = {
    primary: 'bg-[#171717] text-white active:bg-[#2d2d2d]',
    secondary: 'bg-white border border-[#171717]/10 text-[#171717] active:bg-gray-50',
    ghost: 'bg-transparent text-[#171717] active:bg-[#171717]/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      disabled={disabled}
      className={`rounded-xl font-bold transition-colors ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

/**
 * Bounce Card - 터치 시 바운스 효과
 */
interface BounceCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function BounceCard({ children, onClick, className = '' }: BounceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#171717]/5 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Ripple Effect Container
 */
interface RippleContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function RippleContainer({ children, className = '' }: RippleContainerProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={handleClick}>
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute w-16 h-16 bg-[#171717]/10 rounded-full pointer-events-none"
          style={{
            left: ripple.x - 32,
            top: ripple.y - 32,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Swipe Action Item
 */
interface SwipeActionProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function SwipeAction({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftContent,
  rightContent,
}: SwipeActionProps) {
  const [x, setX] = useState(0);
  const threshold = 80;

  const handleDragEnd = () => {
    if (x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (x > threshold && onSwipeRight) {
      onSwipeRight();
    }
    setX(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Action */}
      {leftContent && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center px-4 bg-emerald-500"
          style={{ opacity: Math.min(x / threshold, 1) }}
        >
          {leftContent}
        </div>
      )}

      {/* Right Action */}
      {rightContent && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center px-4 bg-red-500"
          style={{ opacity: Math.min(-x / threshold, 1) }}
        >
          {rightContent}
        </div>
      )}

      {/* Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        onDrag={(_, info) => setX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        className="relative bg-white touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
