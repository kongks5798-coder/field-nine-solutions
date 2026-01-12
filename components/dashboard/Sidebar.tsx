'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, BarChart3, Settings } from 'lucide-react';
import UserMenu from './UserMenu';

/**
 * Sidebar Component - 대시보드 네비게이션
 * 
 * 비즈니스 목적:
 * - 주요 기능으로 빠른 접근 제공 (사용자 효율성 향상)
 * - 현재 페이지 표시로 사용자 위치 명확화
 * - Tesla Style 엄격 준수
 */
export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Trends', icon: TrendingUp },
    { href: '/dashboard/analysis', label: 'Analysis', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[#E5E5E5] p-6 flex flex-col">
      <div className="space-y-1 flex-1">
        <h2 className="text-xl font-semibold text-[#171717] mb-8">TrendStream</h2>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-[#C0392B] text-white'
                    : 'text-[#171717] hover:bg-[#F9F9F7]'
                }`}
                style={{ borderRadius: '4px' }}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User Menu at bottom */}
      <div className="mt-auto pt-6 border-t border-[#E5E5E5]">
        <UserMenu />
      </div>
    </aside>
  );
}
