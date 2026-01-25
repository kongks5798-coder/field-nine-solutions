'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 68: ENHANCED MOBILE NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 모바일 하단 네비게이션 + 사이드 메뉴 + 개선된 UX
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

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '홈', icon: '🏠', activeIcon: '🏡', href: '/nexus/energy' },
  { id: 'exchange', label: '거래소', icon: '💱', activeIcon: '💹', href: '/nexus/exchange' },
  { id: 'market', label: '마켓', icon: '📊', activeIcon: '📈', href: '/nexus/market' },
  { id: 'profile', label: '프로필', icon: '👤', activeIcon: '👑', href: '/nexus/profile' },
  { id: 'menu', label: '더보기', icon: '☰', activeIcon: '✕', href: '#menu' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (item: NavItem) => {
    if (item.href === '#menu') return showMenu;
    // More precise matching
    const path = pathname.replace(/^\/[a-z]{2}/, ''); // Remove locale prefix
    if (item.href === '/nexus/energy' && path === '/nexus/energy') return true;
    if (item.href === '/nexus/exchange' && path.includes('exchange')) return true;
    if (item.href === '/nexus/market' && path.includes('market')) return true;
    if (item.href === '/nexus/profile' && path.includes('profile')) return true;
    return false;
  };

  // Close menu on route change
  useEffect(() => {
    setShowMenu(false);
  }, [pathname]);

  return (
    <>
      {/* Bottom Navigation Bar - Safe area aware */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#171717]/95 backdrop-blur-lg border-t border-white/10 md:hidden">
        <div className="flex items-center justify-around pb-safe pt-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {item.id === 'menu' ? (
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                      active ? 'text-amber-400' : 'text-white/60'
                    }`}
                  >
                    <span className="text-xl transition-transform duration-200" style={{ transform: showMenu ? 'rotate(90deg)' : 'none' }}>
                      {active ? item.activeIcon : item.icon}
                    </span>
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                      active ? 'text-amber-400' : 'text-white/60'
                    }`}
                  >
                    <span className="text-xl">{active ? item.activeIcon : item.icon}</span>
                    <span className="text-[10px] font-bold">{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full"
                      />
                    )}
                  </Link>
                )}
              </motion.div>
            );
          })}
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
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#171717] z-50 md:hidden overflow-y-auto"
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
  const [kausPrice] = useState(120); // Could fetch from API

  const menuSections = [
    {
      title: 'Trading',
      items: [
        { icon: '⚡', label: 'Energy Dashboard', href: '/nexus/energy', badge: null },
        { icon: '💱', label: 'Exchange', href: '/nexus/exchange', badge: 'HOT' },
        { icon: '📊', label: 'Market', href: '/nexus/market', badge: null },
      ],
    },
    {
      title: 'Finance',
      items: [
        { icon: '💰', label: 'My Wallet', href: '/nexus/profile?tab=wallet', badge: null },
        { icon: '📈', label: 'Staking', href: '/nexus/profile?tab=staking', badge: '25% APY' },
        { icon: '🔗', label: 'Referral', href: '/nexus/profile?tab=referral', badge: null },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', href: '/nexus/profile', badge: null },
        { icon: '👑', label: 'Membership', href: '/nexus/membership', badge: 'UPGRADE' },
        { icon: '⚙️', label: 'Settings', href: '/nexus/profile?tab=settings', badge: null },
      ],
    },
  ];

  return (
    <div className="p-5 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Menu</h2>
          <p className="text-xs text-white/50">Field Nine</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white text-sm"
        >
          ✕
        </button>
      </div>

      {/* Live KAUS Price */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🪙</span>
          <div>
            <div className="text-xs text-white/50">KAUS Price</div>
            <div className="font-bold text-white">₩{kausPrice}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-xs">
          <span>▲</span>
          <span>+2.5%</span>
        </div>
      </div>

      {/* User Quick Info */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">👑</span>
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">Sovereign User</div>
            <div className="text-[10px] text-amber-400">PLATINUM Member</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-amber-400">5,000</div>
            <div className="text-[10px] text-white/50">KAUS</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-emerald-400">12</div>
            <div className="text-[10px] text-white/50">Referrals</div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="mb-5">
          <h3 className="text-[10px] text-white/40 font-bold uppercase mb-2 tracking-wider">{section.title}</h3>
          <div className="space-y-1.5">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-white text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    item.badge === 'HOT' ? 'bg-red-500/20 text-red-400' :
                    item.badge === 'UPGRADE' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Quick Actions */}
      <div className="mt-6 space-y-2">
        <Link
          href="/nexus/exchange"
          onClick={onClose}
          className="block w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl text-center text-sm"
        >
          Buy KAUS
        </Link>
        <Link
          href="/nexus/profile?tab=staking"
          onClick={onClose}
          className="block w-full py-3.5 bg-white/10 text-white font-bold rounded-xl text-center text-sm"
        >
          Start Staking
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-[10px] text-white/30">Field Nine Solutions v1.0</p>
        <p className="text-[10px] text-white/20 mt-0.5">Phase 68</p>
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
  transparent?: boolean;
}

export function MobileHeader({
  title = 'Field Nine',
  showBack,
  onBack,
  rightContent,
  transparent = false
}: MobileHeaderProps) {
  return (
    <header className={`sticky top-0 z-40 md:hidden ${
      transparent
        ? 'bg-transparent'
        : 'bg-[#171717]/95 backdrop-blur-lg border-b border-white/10'
    }`}>
      <div className="flex items-center justify-between px-4 py-2.5 pt-safe">
        <div className="flex items-center gap-3">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white"
            >
              ←
            </motion.button>
          )}
          <div>
            <h1 className="font-bold text-white text-base">{title}</h1>
          </div>
        </div>
        {rightContent || (
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white"
            >
              🔔
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                3
              </span>
            </motion.button>
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
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
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
