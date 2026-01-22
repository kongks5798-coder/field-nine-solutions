/**
 * VIBE-ID Scanning Animation
 * Tesla FSD 스타일 스캐닝 효과
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScanningAnimationProps {
  imageUrl: string;
  progress: number; // 0-100
}

export function ScanningAnimation({ imageUrl, progress }: ScanningAnimationProps) {
  const [scanLines, setScanLines] = useState<number[]>([]);

  // Generate random scan line positions
  useEffect(() => {
    const lines = Array.from({ length: 8 }, () => Math.random() * 100);
    setScanLines(lines);
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Image Container */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#171717]">
        {/* Selfie Image */}
        <img
          src={imageUrl}
          alt="Analyzing"
          className="w-full h-full object-cover opacity-80"
        />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#171717]/20 via-transparent to-[#171717]/20" />

        {/* Main Scan Line */}
        <motion.div
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00FF88] to-transparent"
          animate={{
            top: ['0%', '100%', '0%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            boxShadow: '0 0 20px 5px rgba(0, 255, 136, 0.5)',
          }}
        />

        {/* Secondary Scan Lines */}
        {scanLines.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-px bg-[#00FF88]/30"
            initial={{ top: `${pos}%`, opacity: 0 }}
            animate={{
              opacity: [0, 0.5, 0],
              scaleX: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Corner Brackets */}
        <div className="absolute inset-4 pointer-events-none">
          {/* Top Left */}
          <motion.div
            className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#00FF88]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          {/* Top Right */}
          <motion.div
            className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#00FF88]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.25 }}
          />
          {/* Bottom Left */}
          <motion.div
            className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#00FF88]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          />
          {/* Bottom Right */}
          <motion.div
            className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#00FF88]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.75 }}
          />
        </div>

        {/* Data Points Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { x: 30, y: 25 },
            { x: 70, y: 25 },
            { x: 50, y: 45 },
            { x: 35, y: 60 },
            { x: 65, y: 60 },
            { x: 50, y: 75 },
          ].map((point, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              <div className="w-full h-full rounded-full bg-[#00FF88]/50 border border-[#00FF88]" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-8 text-center">
        {/* Status Text */}
        <motion.p
          className="text-[#171717] font-semibold text-lg mb-4"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {progress < 30 && '스타일 분석 중...'}
          {progress >= 30 && progress < 60 && '분위기 감지 중...'}
          {progress >= 60 && progress < 90 && '여행지 매칭 중...'}
          {progress >= 90 && '완료 준비 중...'}
        </motion.p>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mx-auto h-1 bg-[#171717]/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#171717] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Percentage */}
        <p className="text-[#171717]/50 text-sm mt-2">{progress}%</p>
      </div>
    </div>
  );
}
