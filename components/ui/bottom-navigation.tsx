/**
 * K-Universal Mobile Bottom Navigation
 * 카카오/토스 스타일 하단 탭바
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Home, Wallet, Car, Menu, QrCode } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  labelKo: string;
  href: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home', labelKo: '홈', href: '' },
  { id: 'wallet', icon: Wallet, label: 'Wallet', labelKo: '지갑', href: '/wallet' },
  { id: 'taxi', icon: Car, label: 'Taxi', labelKo: '택시', href: '/dashboard/taxi' },
  { id: 'menu', icon: Menu, label: 'Menu', labelKo: '메뉴', href: '/dashboard' },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const locale = useLocale();

  // Check if current path matches nav item
  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Background with blur */}
        <div className="absolute inset-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10" />

        {/* Safe area padding for iOS */}
        <div className="relative px-2 pt-2 pb-safe">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={`/${locale}${item.href}`}
                  className="relative flex flex-col items-center justify-center py-2 px-4 min-w-[64px]"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative flex flex-col items-center"
                  >
                    {/* Active Indicator */}
                    {active && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -top-1 w-12 h-12 rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Icon */}
                    <motion.div
                      animate={{
                        scale: active ? 1.1 : 1,
                        y: active ? -2 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="relative z-10"
                    >
                      <Icon
                        className={`w-6 h-6 transition-colors duration-200 ${
                          active
                            ? 'text-[#3B82F6]'
                            : 'text-white/50'
                        }`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                    </motion.div>

                    {/* Label */}
                    <span
                      className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                        active ? 'text-[#3B82F6]' : 'text-white/40'
                      }`}
                    >
                      {locale === 'ko' ? item.labelKo : item.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}

            {/* Center QR Button */}
            <Link
              href={`/${locale}/wallet`}
              className="absolute left-1/2 -translate-x-1/2 -top-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-purple-500/30 border-4 border-[#0A0A0F]"
              >
                <QrCode className="w-6 h-6 text-white" />
              </motion.div>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
