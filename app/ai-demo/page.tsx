'use client';

// Removed 'next/link' due to preview environment limitations
// Replaced with standard <a> tags for immediate rendering
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Zap, Shield, Globe, Cpu, ChevronRight, Play } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <span className="text-xl font-bold tracking-tighter">FIELD NINE</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">솔루션</a>
            <a href="#" className="hover:text-white transition-colors">테크놀로지</a>
            <a href="#" className="hover:text-white transition-colors">구독 요금제</a>
            <a href="#" className="hover:text-white transition-colors">고객지원</a>
          </div>
          <div className="flex gap-4">
            <a href="/login" className="text-sm font-medium hover:text-white text-gray-400 py-2 transition-colors">
              로그인
            </a>
            <a href="/signup" className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1">
              시작하기 <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-36 pb-20 md:pt-52 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-8 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            업데이트 완료: Neural Engine v2.5 한국 서버 가동 중
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400">
              비즈니스의 미래를<br className="md:hidden"/> 운영하다.
            </span>
            <br />
            <span className="text-4xl md:text-6xl text-gray-500 font-medium mt-2 block">
              The OS for Your Business.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed break-keep">
            AI 에이전트, 실시간 소싱, 그리고 자율 물류 시스템을 하나의 완벽한 플랫폼에서.<br/>
            필드나인은 1인 기업가를 위한 가장 진보된 운영체제입니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <a href="/agent" className="group flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
              무료로 시작하기
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#demo" className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-lg text-white border border-white/20 hover:bg-white/10 transition-all">
              <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
              데모 영상 보기
            </a>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            * RTX 5090 기반 로컬 추론 엔진 탑재. 별도 설치 불필요.
          </p>
        </motion.div>

        {/* --- Live Dashboard Mockup --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-24 w-full max-w-6xl aspect-[16/9] bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative group"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-emerald-900/10" />
          
          {/* Mock UI Header */}
          <div className="h-10 border-b border-white/10 flex items-center px-4 justify-between bg-black/60 backdrop-blur-md sticky top-0 z-10">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <div className="text-[10px] text-gray-500 font-mono tracking-widest">FIELD NINE /// CENTRAL COMMAND /// SEOUL_NODE</div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] text-green-500 font-bold">ONLINE</span>
            </div>
          </div>

          {/* Mock UI Grid */}
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-[calc(100%-2.5rem)]">
            
            {/* Main Graph Area */}
            <div className="md:col-span-8 bg-white/5 rounded-xl p-5 border border-white/5 relative flex flex-col">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-sm text-gray-400 font-medium">실시간 매출 추이 (Revenue Velocity)</h3>
                   <div className="text-3xl font-bold text-white mt-1">₩ 124,500,000</div>
                   <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                     <ArrowRight className="w-3 h-3 -rotate-45" /> 전주 대비 +18.4% 성장
                   </div>
                 </div>
                 <div className="flex gap-2">
                    {['1H', '1D', '1W', '1M'].map(t => (
                      <span key={t} className={`text-xs px-2 py-1 rounded cursor-pointer ${t === '1W' ? 'bg-white/20 text-white' : 'text-gray-600 hover:text-white'}`}>{t}</span>
                    ))}
                 </div>
               </div>
               
               {/* Graph Bars */}
               <div className="flex-1 flex items-end gap-2 md:gap-3 px-2">
                  {[40, 55, 45, 70, 60, 85, 95, 80, 110, 100, 130, 150, 140, 160, 180].map((h, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h / 2.5}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-blue-600/80 to-blue-400/80 rounded-t-sm hover:from-blue-500 hover:to-blue-300 transition-colors relative group/bar"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap font-bold">
                        ₩ {h * 10000}
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* Side Panel Area */}
            <div className="md:col-span-4 flex flex-col gap-4 md:gap-6">
               {/* AI Agent Status */}
               <div className="flex-1 bg-white/5 rounded-xl p-5 border border-white/5 relative overflow-hidden group/card hover:bg-white/10 transition-colors">
                  <div className="absolute top-0 right-0 p-4">
                    <Cpu className="w-5 h-5 text-purple-400 animate-spin-slow" />
                  </div>
                  <h3 className="text-sm text-gray-400 mb-4">AI 에이전트 상태</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-400">R1</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">DeepSeek-R1 (추론)</div>
                        <div className="text-xs text-gray-500">복합 공급망 최적화 계산 중...</div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                    </div>
                    
                    <div className="h-px bg-white/5" />
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-400">VT</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">VTON (가상피팅)</div>
                        <div className="text-xs text-gray-500">신상품 24종 렌더링 완료</div>
                      </div>
                      <div className="text-xs text-gray-400">2m ago</div>
                    </div>
                  </div>
               </div>

               {/* Active Sourcing */}
               <div className="h-32 bg-white/5 rounded-xl p-5 border border-white/5 flex flex-col justify-center hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <span className="text-xs text-yellow-500 font-bold">NEGOTIATION ACTIVE</span>
                  </div>
                  <div className="text-lg font-bold">광저우 A공장</div>
                  <div className="text-sm text-gray-400">단가 5% 인하 제안 발송됨</div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- Features Grid (Bento Box Style) --- */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">압도적인 기능. 무한한 확장성.</h2>
          <p className="text-gray-400">필드나인은 단순한 툴이 아닙니다. 당신의 사업을 위한 완벽한 파트너입니다.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-[#111] border border-white/5 hover:border-white/20 transition-all group hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
               <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Hyper-Speed Sourcing</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              AI 에이전트가 전 세계 시장을 0.1초 만에 스캔합니다. 자율 협상 프로토콜로 리드타임을 90% 단축하세요.
            </p>
            <a href="#" className="text-yellow-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
              더 알아보기 <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-[#111] border border-white/5 hover:border-white/20 transition-all group hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
               <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Private Security</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              당신의 데이터는 절대 외부로 유출되지 않습니다. 로컬 RTX 5090 클러스터와 암호화 터널로 완벽하게 보호됩니다.
            </p>
            <a href="#" className="text-blue-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
              보안 백서 보기 <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-[#111] border border-white/5 hover:border-white/20 transition-all group hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
               <Globe className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Global Logistics OS</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              공장 출고부터 고객 문 앞까지. 전체 공급망을 하나의 살아있는 대시보드에서 시각화하고 제어하세요.
            </p>
            <a href="#" className="text-emerald-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
              기능 상세 보기 <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* --- Social Proof / Stats --- */}
      <section className="py-20 border-y border-white/5 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-around gap-8 text-center">
           <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">98.4%</div>
              <div className="text-gray-400 text-sm">AI 예측 정확도</div>
           </div>
           <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">0.1s</div>
              <div className="text-gray-400 text-sm">평균 응답 속도</div>
           </div>
           <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400 text-sm">무중단 자율 운영</div>
           </div>
        </div>
      </section>

      {/* --- Subscription CTA --- */}
      <section className="py-32 px-6 bg-gradient-to-b from-black to-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            지금, 비즈니스의 차원을 높이세요.
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
            자동화된 기업의 엘리트 네트워크에 합류하십시오.<br/>
            지속적인 업데이트. 제로 유지보수. 무한한 확장성.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 items-center">
             <div className="p-0.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/20">
                <button className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#111] transition-colors w-full sm:w-auto">
                  무료 체험 시작하기
                </button>
             </div>
             <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-gray-700 underline-offset-4">
               엔터프라이즈 문의하기
             </a>
          </div>
          <p className="mt-8 text-xs text-gray-500">
            * 14일 무료 체험 기간 동안 카드 결제 없이 모든 기능을 이용할 수 있습니다.
          </p>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black text-gray-600 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded-full" />
            <span className="font-bold text-gray-400">FIELD NINE</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-white transition-colors">서비스 상태</a>
          </div>
          <p>&copy; 2026 Field Nine Solutions. Seoul, Korea.</p>
        </div>
      </footer>
    </div>
  );
}