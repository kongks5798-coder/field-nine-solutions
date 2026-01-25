'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: MOBILE NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 모바일 하단 네비게이션 + 사이드 메뉴
 */

import { useState } from 'react';
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
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '홈', icon: '🏠', href: '/nexus/energy' },
  { id: 'exchange', label: '거래소', icon: '💱', href: '/nexus/exchange' },
  { id: 'staking', label: '스테이킹', icon: '📈', href: '/nexus/profile?tab=staking' },
  { id: 'profile', label: '프로필', icon: '👤', href: '/nexus/profile' },
  { id: 'menu', label: '메뉴', icon: '☰', href: '#menu' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (href: string) => {
    if (href === '#menu') return showMenu;
    return pathname.includes(href.replace('/nexus/', ''));
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#171717] border-t border-white/10 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => (
            <motion.div key={item.id} whileTap={{ scale: 0.9 }}>
              {item.id === 'menu' ? (
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 ${
                    showMenu ? 'text-amber-400' : 'text-white/60'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-4 py-2 ${
                    isActive(item.href) ? 'text-amber-400' : 'text-white/60'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 md:hidden"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#171717] z-50 md:hidden overflow-y-auto"
            >
              <MobileMenuContent onClose={() => setShowMenu(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE MENU CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

interface MobileMenuContentProps {
  onClose: () => void;
}

function MobileMenuContent({ onClose }: MobileMenuContentProps) {
  const menuSections = [
    {
      title: 'Trading',
      items: [
        { icon: '⚡', label: 'Energy Dashboard', href: '/nexus/energy' },
        { icon: '💱', label: 'Exchange', href: '/nexus/exchange' },
        { icon: '📊', label: 'Market', href: '/nexus/market' },
      ],
    },
    {
      title: 'Finance',
      items: [
        { icon: '💰', label: 'My Wallet', href: '/nexus/profile?tab=wallet' },
        { icon: '📈', label: 'Staking', href: '/nexus/profile?tab=staking' },
        { icon: '🔗', label: 'Referral', href: '/nexus/profile?tab=referral' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', href: '/nexus/profile' },
        { icon: '👑', label: 'Membership', href: '/nexus/membership' },
        { icon: '⚙️', label: 'Settings', href: '/nexus/profile?tab=settings' },
      ],
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <p className="text-sm text-white/50">Field Nine</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white"
        >
          ✕
        </button>
      </div>

      {/* User Quick Info */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">👑</span>
          </div>
          <div>
            <div className="font-bold text-white">Sovereign User</div>
            <div className="text-xs text-amber-400">PLATINUM Member</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-amber-400">5,000</div>
            <div className="text-[10px] text-white/50">KAUS</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-emerald-400">12</div>
            <div className="text-[10px] text-white/50">Referrals</div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-xs text-white/40 font-bold uppercase mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-white font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Quick Actions */}
      <div className="mt-8 space-y-3">
        <Link
          href="/nexus/exchange"
          onClick={onClose}
          className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl text-center"
        >
          Buy KAUS
        </Link>
        <Link
          href="/nexus/profile?tab=staking"
          onClick={onClose}
          className="block w-full py-4 bg-white/10 text-white font-bold rounded-xl text-center"
        >
          Start Staking
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-white/30">Field Nine Solutions v1.0</p>
        <p className="text-xs text-white/20 mt-1">Phase 61</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE HEADER
// ═══════════════════════════════════════════════════════════════════════════════

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export function MobileHeader({ title = 'Field Nine', showBack, onBack, rightContent }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#171717] border-b border-white/10 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white"
            >
              ←
            </button>
          )}
          <div>
            <h1 className="font-bold text-white">{title}</h1>
          </div>
        </div>
        {rightContent || (
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              🔔
            </button>
          </div>
        )}
      </div>
    </header>
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
