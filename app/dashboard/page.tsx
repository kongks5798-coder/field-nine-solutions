import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Home, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import DashboardLogoutButton from './DashboardLogoutButton';
import MobileMenuButton from './MobileMenuButton';
import DashboardStats from './DashboardStats';
import Logo from '@/app/components/Logo';

// 동적 렌더링 강제 (cookies 사용)
export const dynamic = 'force-dynamic';

/**
 * 대시보드 페이지
 * 로그인한 유저만 접근 가능
 * 
 * Next.js 15 + @supabase/ssr 표준
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
      <div className="min-h-screen bg-[#F9F9F7]">
        <div className="flex h-screen">
          {/* 좌측 사이드바 */}
          <aside className="hidden md:flex w-64 bg-white border-r border-[#E5E5E0] flex flex-col">
            {/* 로고 영역 */}
            <div className="p-4 sm:p-6 border-b border-[#E5E5E0]">
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <Logo size="md" animated={true} />
                <div>
                  <h1 className="text-xl font-bold text-[#171717] group-hover:text-[#1A5D3F] transition-colors">Field Nine</h1>
                  <p className="text-sm text-gray-600 mt-0.5">대시보드</p>
                </div>
              </Link>
            </div>

            {/* 메뉴 영역 */}
            <nav className="flex-1 p-3 sm:p-4 space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1A5D3F]/10 text-[#1A5D3F] font-medium transition-colors hover:bg-[#1A5D3F]/20"
              >
                <Home className="w-5 h-5" />
                <span>홈</span>
              </Link>
              <Link
                href="/dashboard/orders"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#171717] transition-colors hover:bg-[#F5F5F5]"
              >
                <RefreshCw className="w-5 h-5" />
                <span>주문 동기화</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#171717] transition-colors hover:bg-[#F5F5F5]"
              >
                <BarChart3 className="w-5 h-5" />
                <span>분석</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#171717] transition-colors hover:bg-[#F5F5F5]"
              >
                <Settings className="w-5 h-5" />
                <span>설정</span>
              </Link>
            </nav>

            {/* 로그아웃 버튼 */}
            <div className="p-3 sm:p-4 border-t border-[#E5E5E0]">
              <DashboardLogoutButton />
            </div>
          </aside>

          {/* 모바일 메뉴 버튼 */}
          <MobileMenuButton userName={userName} />

          {/* 우측 메인 콘텐츠 */}
          <main className="flex-1 overflow-y-auto md:ml-0">
            {/* 상단 헤더 (데스크톱) */}
            <header className="hidden md:block bg-white border-b border-[#E5E5E0] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">
                반갑습니다, <span className="text-[#1A5D3F]">{userName}</span>님!
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{userEmail}</p>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* 대시보드 통계 및 차트 (실제 DB 데이터 연결) */}
              <DashboardStats />

              {/* 빠른 액션 */}
              <div className="mt-6 sm:mt-8">
                <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-[#171717] mb-4">빠른 액션</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                      href="/dashboard/orders"
                      className="flex items-center gap-3 p-4 rounded-lg border border-[#E5E5E0] hover:border-[#1A5D3F] hover:bg-[#1A5D3F]/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#1A5D3F]/10 flex items-center justify-center group-hover:bg-[#1A5D3F] transition-colors">
                        <RefreshCw className="w-5 h-5 text-[#1A5D3F] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#171717]">주문 동기화</p>
                        <p className="text-sm text-gray-600">외부 쇼핑몰 주문 가져오기</p>
                      </div>
                    </Link>
                    <Link
                      href="/dashboard/analytics"
                      className="flex items-center gap-3 p-4 rounded-lg border border-[#E5E5E0] hover:border-[#1A5D3F] hover:bg-[#1A5D3F]/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-[#1A5D3F] transition-colors">
                        <BarChart3 className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#171717]">분석 및 통계</p>
                        <p className="text-sm text-gray-600">비즈니스 인사이트 확인</p>
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
                        <p className="text-sm text-gray-600">계정 및 환경 설정</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    // 예상치 못한 오류 발생 시 로그인 페이지로 리다이렉트
    console.error('[Dashboard] 페이지 로드 중 오류:', error);
    redirect('/login?redirect=/dashboard&error=server_error');
  }
}
