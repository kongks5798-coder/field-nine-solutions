"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe } from 'lucide-react';

export default function HomePage() {
  const [aiSpeed, setAiSpeed] = useState(0);
  const [waveOffset, setWaveOffset] = useState(0);

  // AI 처리 속도 실시간 업데이트 (0.1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      // O(n log n) 복잡도 시뮬레이션: 1000 ~ 9999 사이 랜덤 값
      const base = Math.floor(Math.random() * 9000) + 1000;
      const logFactor = Math.floor(Math.log2(base) * 100);
      setAiSpeed(base + logFactor);
      
      // 파형 오프셋 업데이트
      setWaveOffset(prev => (prev + 2) % 100);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // 파형 생성 함수
  const generateWavePath = (offset: number) => {
    const points = [];
    const width = 200;
    const height = 20;
    const frequency = 0.1;
    
    for (let i = 0; i <= width; i += 2) {
      const y = height / 2 + Math.sin((i * frequency + offset) * Math.PI / 180) * 3;
      points.push(`${i},${y}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] selection:bg-[#1A5D3F]/30 font-sans flex flex-col">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-gradient-to-r from-[#1A5D3F]/5 to-[#1A5D3F]/5 rounded-full blur-3xl -z-10"
      />

      <main className="max-w-7xl mx-auto px-6 pt-40 pb-20 text-center flex-1">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl font-light tracking-tighter"
        >
          FIELD NINE <span className="font-bold text-[#1A5D3F]">SOLUTIONS</span>
        </motion.h1>
        <p className="mt-6 text-lg text-gray-500 tracking-widest uppercase">2026 AI NEXT-GEN AGENT</p>
      </main>

      {/* AI 에이전트 실시간 상태바 */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border-t border-[#1A5D3F]/10 bg-[#F5F5F0]/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* 시스템 상태 */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#1A5D3F]"
              />
              <span className="text-sm font-medium text-[#1A5D3F] tracking-wider">
                SYSTEM STATUS: OPERATIONAL
              </span>
            </div>

            {/* AI 처리 속도 */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  AI Processing Speed
                </div>
                <div className="text-lg font-mono text-[#1A1A1A]">
                  O(n log n): <span className="text-[#1A5D3F] font-semibold">{aiSpeed.toLocaleString()}</span>
                </div>
              </div>

              {/* 파형 애니메이션 */}
              <div className="relative w-48 h-6 overflow-hidden">
                <svg
                  width="200"
                  height="20"
                  viewBox="0 0 200 20"
                  className="absolute inset-0"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d={generateWavePath(waveOffset)}
                    fill="none"
                    stroke="#1A5D3F"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    animate={{
                      d: [
                        generateWavePath(waveOffset),
                        generateWavePath(waveOffset + 20),
                        generateWavePath(waveOffset + 40),
                      ],
                    }}
                    transition={{
                      duration: 0.1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
