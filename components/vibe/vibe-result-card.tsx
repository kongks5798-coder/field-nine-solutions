/**
 * VIBE-ID Result Card
 * 분석 결과를 Tesla 스타일로 표시하는 카드 컴포넌트
 */

'use client';

import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { VibeAnalysis, VIBE_LABELS } from '@/lib/vibe/types';

interface VibeResultCardProps {
  analysis: VibeAnalysis;
  onRetry?: () => void;
}

export function VibeResultCard({ analysis, onRetry }: VibeResultCardProps) {
  const primaryLabel = VIBE_LABELS[analysis.primary];
  const secondaryLabel = VIBE_LABELS[analysis.secondary];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Main Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#171717]/5">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#171717]/5 mb-4"
          >
            <Sparkles className="w-4 h-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">
              AI 분석 완료
            </span>
          </motion.div>

          <h2 className="text-3xl font-bold text-[#171717] mb-2">
            {primaryLabel.en.toUpperCase()}
          </h2>
          <p className="text-xl text-[#171717]/70">
            {primaryLabel.ko}
          </p>
        </div>

        {/* Color Palette */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-3 mb-8"
        >
          {analysis.colorPalette.map((color, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
              className="w-12 h-12 rounded-full shadow-md border-2 border-white"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <p className="text-[#171717]/80 leading-relaxed">
            {analysis.koreanDescription}
          </p>
        </motion.div>

        {/* Traits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {analysis.traits.map((trait, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="px-4 py-2 rounded-full bg-[#171717]/5 text-[#171717] text-sm font-medium"
            >
              #{trait}
            </motion.span>
          ))}
        </motion.div>

        {/* Confidence & Secondary Vibe */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pt-6 border-t border-[#171717]/10"
        >
          <div className="flex justify-between items-center text-sm">
            <div className="text-[#171717]/50">
              서브 분위기: <span className="text-[#171717] font-medium">{secondaryLabel.ko}</span>
            </div>
            <div className="text-[#171717]/50">
              신뢰도: <span className="text-[#171717] font-medium">{Math.round(analysis.confidence * 100)}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Retry Button */}
      {onRetry && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onRetry}
          className="w-full mt-4 py-3 rounded-2xl bg-transparent border border-[#171717]/20 text-[#171717] font-medium flex items-center justify-center gap-2 hover:bg-[#171717]/5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 분석하기
        </motion.button>
      )}
    </motion.div>
  );
}
