"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import DashboardLogoutButton from './DashboardLogoutButton';

interface MobileMenuButtonProps {
  userName: string;
}

export default function MobileMenuButton({ userName }: MobileMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-[#E5E5E0] z-40 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#171717]">
            반갑습니다, <span className="text-[#1A5D3F]">{userName}</span>님!
          </h2>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-[#171717]"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {isOpen && (
          <div className="mt-4 space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1A5D3F]/10 text-[#1A5D3F] font-medium"
            >
              <Home className="w-5 h-5" />
              <span>홈</span>
            </Link>
            <Link
              href="/dashboard/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#171717] hover:bg-[#F5F5F5]"
            >
              <RefreshCw className="w-5 h-5" />
              <span>주문 동기화</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#171717] hover:bg-[#F5F5F5]"
            >
              <BarChart3 className="w-5 h-5" />
              <span>분석</span>
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#171717] hover:bg-[#F5F5F5]"
            >
              <Settings className="w-5 h-5" />
              <span>설정</span>
            </Link>
            <div className="pt-4 border-t border-[#E5E5E0]">
              <DashboardLogoutButton />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
