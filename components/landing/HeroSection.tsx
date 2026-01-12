import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * HeroSection Component - 랜딩 페이지 메인 섹션
 * 
 * 비즈니스 목적:
 * - 첫 방문자의 즉시 전환을 위한 압도적인 첫인상
 * - 명확한 Value Proposition으로 타겟 고객 공감
 * - Tesla Style 엄격 준수로 전문성 전달
 */
export default function HeroSection() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
      <div className="max-w-4xl mx-auto text-center space-y-10">
        {/* 헤드카피 - 명세서 엄격 준수 */}
        <h1 className="text-6xl md:text-8xl font-semibold tracking-tight text-[#171717] leading-[1.1]">
          TrendStream:
          <br />
          <span className="text-[#C0392B]">Next Week&apos;s Bestsellers, Today.</span>
        </h1>
        
        {/* 서브카피 */}
        <p className="text-xl md:text-2xl text-[#171717]/80 max-w-2xl mx-auto leading-relaxed font-light">
          AI가 인스타그램과 틱톡을 실시간 분석하여,
          <br />
          <span className="font-medium">당장 다음 주에 팔릴 옷을 예측</span>해 드립니다.
        </p>
        
        {/* CTA 버튼 */}
        <div className="pt-6">
          <Link href="/dashboard">
            <Button 
              size="lg" 
              className="bg-[#C0392B] hover:bg-[#A93226] text-white text-lg px-10 py-7 h-auto rounded-sm group transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ borderRadius: '4px' }}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
