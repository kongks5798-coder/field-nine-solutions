import Link from 'next/link';
import HeroSection from '@/components/landing/HeroSection';
import TrustIndicators from '@/components/landing/TrustIndicators';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

/**
 * Landing Page - TrendStream 첫인상 결정
 * 
 * 비즈니스 목적: 
 * - 방문자를 즉시 전환시키는 압도적인 첫인상 (Conversion Rate 최대화)
 * - Tesla Style 미니멀 디자인으로 전문성과 신뢰감 전달
 * - 명확한 Value Proposition으로 타겟 고객(1인 셀러, 동대문 업자) 즉시 공감
 * - 로그인된 사용자는 대시보드로 자동 리다이렉트
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인된 사용자는 대시보드로 리다이렉트
  if (user) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#171717]">대시보드로 이동 중...</p>
          <Link href="/dashboard">
            <Button className="bg-[#C0392B] hover:bg-[#A93226] text-white" style={{ borderRadius: '4px' }}>
              대시보드로 이동
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <HeroSection />
      <TrustIndicators />
    </div>
  );
}
