import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import DashboardStats from './DashboardStats';
import { Home, RefreshCw, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';

// 동적 렌더링 강제 (cookies 사용)
export const dynamic = 'force-dynamic';

/**
 * Dashboard Page (홈)
 * 
 * This is the main dashboard page showing:
 * - Sales overview
 * - Stock status
 * - Quick actions
 * - Business insights
 * 
 * Uses the new SidebarLayout component for consistent navigation.
 */
export default async function DashboardPage() {
  try {
    // 🔒 서버 사이드 세션 확인
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // 세션이 없거나 에러가 발생하면 로그인 페이지로 리다이렉트
    if (!session || sessionError) {
      redirect('/login?redirect=/dashboard');
    }

    const user = session.user;
    const userEmail = user.email || '사용자';
    const userName = userEmail.split('@')[0];

    return (
      <SidebarLayout userName={userName} userEmail={userEmail}>
        {/* Dashboard Stats - Revenue, Orders, etc. */}
        <DashboardStats />

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#171717] mb-4">빠른 액션</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/dashboard/inventory"
                className="flex items-center gap-3 p-4 rounded-lg border border-[#E5E5E0] hover:border-[#1A5D3F] hover:bg-[#1A5D3F]/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1A5D3F]/10 flex items-center justify-center group-hover:bg-[#1A5D3F] transition-colors">
                  <Home className="w-5 h-5 text-[#1A5D3F] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#171717]">재고 관리</p>
                  <p className="text-sm text-[#6B6B6B]">상품 목록 보기</p>
                </div>
              </Link>

              <Link
                href="/dashboard/orders"
                className="flex items-center gap-3 p-4 rounded-lg border border-[#E5E5E0] hover:border-[#1A5D3F] hover:bg-[#1A5D3F]/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-[#1A5D3F] transition-colors">
                  <RefreshCw className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#171717]">주문 동기화</p>
                  <p className="text-sm text-[#6B6B6B]">외부 쇼핑몰 주문 가져오기</p>
                </div>
              </Link>

              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-3 p-4 rounded-lg border border-[#E5E5E0] hover:border-[#1A5D3F] hover:bg-[#1A5D3F]/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-[#1A5D3F] transition-colors">
                  <BarChart3 className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#171717]">분석 및 통계</p>
                  <p className="text-sm text-[#6B6B6B]">비즈니스 인사이트 확인</p>
                </div>
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 p-4 rounded-lg border border-[#E5E5E0] hover:border-[#1A5D3F] hover:bg-[#1A5D3F]/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-[#1A5D3F] transition-colors">
                  <Settings className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#171717]">설정</p>
                  <p className="text-sm text-[#6B6B6B]">계정 및 환경 설정</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* AI Integration Placeholder */}
        <div className="mt-8 bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#171717] mb-2">🤖 AI 자동화 준비 중</h3>
          <p className="text-sm text-[#6B6B6B]">
            재고 예측, 자동 주문, 스마트 분석 기능이 곧 추가됩니다.
            {/* TODO: Add AI Stock Prediction Module Here */}
            {/* TODO: Add Coupang/Naver API Integration Here */}
          </p>
        </div>
      </SidebarLayout>
    );
  } catch (error) {
    // 예상치 못한 오류 발생 시 로그인 페이지로 리다이렉트
    console.error('[Dashboard] 페이지 로드 중 오류:', error);
    redirect('/login?redirect=/dashboard&error=server_error');
  }
}
