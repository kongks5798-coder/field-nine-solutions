"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function IntroPage() {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Hero section initial animation
    const heroContent = document.querySelector(".hero-content");
    if (heroContent) {
      setTimeout(() => {
        heroContent.classList.add("opacity-100", "translate-y-0");
        heroContent.classList.remove("opacity-0", "translate-y-10");
      }, 100);
    }

    // Scroll animations for other sections
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="bg-[#000000] text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop)",
          }}
        >
          <div className="absolute inset-0 bg-black/80"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="hero-content opacity-0 translate-y-10 transition-all duration-1000 ease-out">
            <div className="inline-block px-6 py-2 border border-[#00ff00]/30 rounded-full text-[#00ff00] text-sm font-medium mb-8 backdrop-blur-sm bg-black/20">
              THE FUTURE IS NOW
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 leading-[1.1] tracking-tight">
              비즈니스의<br />
              <span className="text-[#00ff00]">운영체제를</span><br />
              재정의하다
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto mb-16 font-light leading-relaxed">
              더 이상 기다리지 마세요.<br />
              경쟁자들은 이미 앞서 나가고 있습니다.
            </p>
            <Link 
              href="/login"
              className="inline-block px-12 py-5 bg-[#00ff00] text-black font-bold text-lg rounded-lg hover:bg-[#00cc00] transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(0,255,0,0.3)]"
            >
              지금 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* Core Value 1: Speed/Efficiency - Zig-zag Layout */}
      <section className="py-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Image Left */}
            <div 
              ref={(el) => { sectionsRef.current[0] = el; }}
              className="opacity-0 translate-y-10 transition-all duration-1000 ease-out"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                  alt="High-speed technology"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            </div>

            {/* Content Right */}
            <div 
              ref={(el) => { sectionsRef.current[1] = el; }}
              className="opacity-0 translate-y-10 transition-all duration-1000 ease-out lg:pl-12"
            >
              <div className="inline-block px-4 py-1 border border-[#00ff00]/30 rounded-full text-[#00ff00] text-xs font-medium mb-6">
                01. SPEED
              </div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                광속의<br />
                <span className="text-[#00ff00]">업무 처리</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                기존 방식보다 <span className="text-white font-semibold">10배 빠른</span> 속도로 경쟁자를 따돌리세요. 
                수시간 걸리던 작업이 몇 분 만에 완료됩니다. 시간은 곧 돈입니다. 
                그리고 당신은 이미 시간을 앞서가고 있습니다.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-[#00ff00] mr-4 text-2xl">→</span>
                  <div>
                    <div className="text-white font-semibold mb-1">실시간 처리 엔진</div>
                    <div className="text-gray-500 text-sm">마이크로초 단위의 응답 시간</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[#00ff00] mr-4 text-2xl">→</span>
                  <div>
                    <div className="text-white font-semibold mb-1">병렬 처리 아키텍처</div>
                    <div className="text-gray-500 text-sm">동시에 수천 개의 작업 처리</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value 2: AI/Automation - Zig-zag Layout (Reversed) */}
      <section className="py-40 px-4 sm:px-6 lg:px-8 bg-[#000000]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Content Left */}
            <div 
              ref={(el) => { sectionsRef.current[2] = el; }}
              className="opacity-0 translate-y-10 transition-all duration-1000 ease-out lg:pr-12 order-2 lg:order-1"
            >
              <div className="inline-block px-4 py-1 border border-[#00ff00]/30 rounded-full text-[#00ff00] text-xs font-medium mb-6">
                02. AUTOMATION
              </div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                당신을 위한<br />
                <span className="text-[#00ff00]">24시간 AI 파트너</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                단순 반복 업무는 기계에 맡기고, <span className="text-white font-semibold">창조적인 일에 집중</span>하세요. 
                AI가 당신의 업무를 학습하고, 예측하고, 자동으로 처리합니다. 
                당신은 전략을 세우고, 팀은 혁신에 집중합니다.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-[#00ff00] mr-4 text-2xl">→</span>
                  <div>
                    <div className="text-white font-semibold mb-1">자율 학습 AI 시스템</div>
                    <div className="text-gray-500 text-sm">시간이 지날수록 더 똑똑해집니다</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[#00ff00] mr-4 text-2xl">→</span>
                  <div>
                    <div className="text-white font-semibold mb-1">예측형 자동화</div>
                    <div className="text-gray-500 text-sm">당신이 필요하기 전에 미리 준비합니다</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Right */}
            <div 
              ref={(el) => { sectionsRef.current[3] = el; }}
              className="opacity-0 translate-y-10 transition-all duration-1000 ease-out order-1 lg:order-2"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop"
                  alt="AI and automation"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value 3: Security/Trust - Zig-zag Layout */}
      <section className="py-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Image Left */}
            <div 
              ref={(el) => { sectionsRef.current[4] = el; }}
              className="opacity-0 translate-y-10 transition-all duration-1000 ease-out"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2070&auto=format&fit=crop"
                  alt="Secure data center"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            </div>

            {/* Content Right */}
            <div 
              ref={(el) => { sectionsRef.current[5] = el; }}
              className="opacity-0 translate-y-10 transition-all duration-1000 ease-out lg:pl-12"
            >
              <div className="inline-block px-4 py-1 border border-[#00ff00]/30 rounded-full text-[#00ff00] text-xs font-medium mb-6">
                03. SECURITY
              </div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                타협 없는 보안,<br />
                <span className="text-[#00ff00]">강철 같은 신뢰</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                <span className="text-white font-semibold">금융권 수준의 보안</span>으로 데이터를 완벽하게 지킵니다. 
                엔드투엔드 암호화, 다중 인증, 실시간 위협 탐지. 
                당신의 데이터는 우리의 최우선 과제입니다.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-[#00ff00] mr-4 text-2xl">→</span>
                  <div>
                    <div className="text-white font-semibold mb-1">군사급 암호화</div>
                    <div className="text-gray-500 text-sm">AES-256 표준 이상의 보안</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[#00ff00] mr-4 text-2xl">→</span>
                  <div>
                    <div className="text-white font-semibold mb-1">SOC 2 Type II 인증</div>
                    <div className="text-gray-500 text-sm">정기적인 보안 감사 및 검증</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-4 sm:px-6 lg:px-8 bg-[#000000]">
        <div className="max-w-5xl mx-auto text-center">
          <div 
            ref={(el) => { sectionsRef.current[6] = el; }}
            className="opacity-0 translate-y-10 transition-all duration-1000 ease-out"
          >
            <div className="inline-block px-6 py-2 border border-[#00ff00]/30 rounded-full text-[#00ff00] text-sm font-medium mb-8 backdrop-blur-sm bg-black/20">
              THE FUTURE AWAITS
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-12 leading-tight">
              미래에 오신 것을<br />
              <span className="text-[#00ff00]">환영합니다</span>
            </h2>
            <p className="text-2xl sm:text-3xl text-gray-400 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
              지금 탑승하세요.<br />
              경쟁자들은 이미 뒤에 남겨졌습니다.
            </p>
            <Link 
              href="/login"
              className="inline-block px-16 py-6 bg-[#00ff00] text-black font-bold text-xl rounded-lg hover:bg-[#00cc00] transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(0,255,0,0.4)]"
            >
              지금 시작하기
            </Link>
            <p className="mt-8 text-sm text-gray-600">
              14일 무료 체험 · 신용카드 불필요 · 언제든지 취소 가능
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
