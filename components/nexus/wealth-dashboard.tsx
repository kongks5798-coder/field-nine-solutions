/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: HYPER-PERSONALIZED WEALTH DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 * 투자 성향 기반 테마 자동 변환 + Empire Growth Projection
 * "당신의 제국은 어떻게 성장할 것인가"
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserProfile,
  InvestmentStyle,
  ThemeMode,
  GovernanceRecommendation,
  GrowthProjection,
  fetchUserProfile,
  analyzeInvestmentStyle,
  getThemeForStyle,
  generateGovernanceRecommendation,
  calculateEmpireGrowth,
  executeJarvisAction,
  generateJarvisSalesRecommendations,
  JarvisSalesRecommendation,
  getDefaultUserProfile,
} from '@/lib/ai/governance';

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const THEME_COLORS: Record<ThemeMode, { primary: string; secondary: string; gradient: string; glow: string }> = {
  emerald: {
    primary: 'emerald-500',
    secondary: 'emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/20',
  },
  cyan: {
    primary: 'cyan-500',
    secondary: 'cyan-400',
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/20',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTMENT STYLE BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function StyleBadge({ style, theme }: { style: InvestmentStyle; theme: ThemeMode }) {
  const styleInfo: Record<InvestmentStyle, { label: string; icon: string; description: string }> = {
    CONSERVATIVE: {
      label: 'Steady Shield',
      icon: '🛡️',
      description: '안정적 수익 추구',
    },
    BALANCED: {
      label: 'Dynamic Growth',
      icon: '⚖️',
      description: '균형잡힌 성장',
    },
    AGGRESSIVE: {
      label: 'Alpha Hunter',
      icon: '🚀',
      description: '공격적 수익 추구',
    },
  };

  const info = styleInfo[style];
  const colors = THEME_COLORS[theme];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${colors.gradient} bg-opacity-20 border border-white/10`}
    >
      <span className="text-2xl">{info.icon}</span>
      <div>
        <div className="text-sm font-bold text-white">{info.label}</div>
        <div className="text-xs text-white/60">{info.description}</div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPIRE GROWTH PROJECTION WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

function EmpireGrowthProjection({
  projections,
  theme,
  totalAssets,
}: {
  projections: GrowthProjection[];
  theme: ThemeMode;
  totalAssets: number;
}) {
  const colors = THEME_COLORS[theme];
  const finalProjection = projections[projections.length - 1];
  const growthPercent = ((finalProjection.projectedValue - totalAssets) / totalAssets * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#171717] rounded-2xl p-6 border border-white/10 ${colors.glow} shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
            <span className="text-white text-xl">👑</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Empire Growth Projection</h3>
            <p className="text-xs text-white/50">12개월 자산 성장 예측</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${colors.gradient} bg-opacity-20`}>
          <span className={`text-sm font-bold text-${colors.secondary}`}>+{growthPercent}%</span>
        </div>
      </div>

      {/* Growth Chart (Simplified Bar Chart) */}
      <div className="relative h-40 mb-6">
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {projections.map((proj, index) => {
            const height = ((proj.projectedValue - totalAssets) / (finalProjection.projectedValue - totalAssets)) * 100;
            const isHighlight = index === projections.length - 1;

            return (
              <motion.div
                key={proj.month}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 10)}%` }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className={`flex-1 rounded-t-lg ${
                  isHighlight
                    ? `bg-gradient-to-t ${colors.gradient}`
                    : `bg-gradient-to-t ${colors.gradient} opacity-40`
                }`}
              />
            );
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="border-t border-white/5" />
          ))}
        </div>
      </div>

      {/* Month Labels */}
      <div className="flex justify-between text-xs text-white/40 mb-6">
        <span>Now</span>
        <span>3M</span>
        <span>6M</span>
        <span>9M</span>
        <span>12M</span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className={`text-lg font-bold text-${colors.secondary}`}>
            {totalAssets.toLocaleString()}
          </div>
          <div className="text-xs text-white/50">현재 KAUS</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className={`text-lg font-bold text-${colors.secondary}`}>
            {finalProjection.projectedValue.toLocaleString()}
          </div>
          <div className="text-xs text-white/50">예상 KAUS</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className={`text-lg font-bold text-${colors.secondary}`}>
            ${finalProjection.projectedValueUsd.toLocaleString()}
          </div>
          <div className="text-xs text-white/50">예상 USD</div>
        </div>
      </div>

      {/* Milestones */}
      {finalProjection.milestones.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {finalProjection.milestones.map((milestone, i) => (
              <span
                key={i}
                className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${colors.gradient} bg-opacity-20 text-white/80`}
              >
                {milestone}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI REBALANCE RECOMMENDATION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function RebalanceRecommendation({
  recommendation,
  theme,
  onAutoRebalance,
  isRebalancing = false,
}: {
  recommendation: GovernanceRecommendation;
  theme: ThemeMode;
  onAutoRebalance: () => void;
  isRebalancing?: boolean;
}) {
  const colors = THEME_COLORS[theme];
  const highPriorityActions = recommendation.allocations.filter(a => a.priority === 'HIGH');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`bg-[#171717] rounded-2xl p-6 border border-white/10 ${colors.glow} shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Governance</h3>
            <p className="text-xs text-white/50">자동 자산 재배치 추천</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50">Confidence</div>
          <div className={`text-sm font-bold text-${colors.secondary}`}>
            {(recommendation.confidenceScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Strategy Info */}
      <div className="p-4 bg-white/5 rounded-xl mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">{recommendation.strategyName}</span>
          <span className={`text-sm font-bold text-${colors.secondary}`}>
            +{recommendation.apyImprovement}% APY
          </span>
        </div>
        <p className="text-xs text-white/60">{recommendation.strategyDescription}</p>
      </div>

      {/* APY Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className="text-xs text-white/50 mb-1">현재 APY</div>
          <div className="text-xl font-bold text-white/80">
            {recommendation.currentPortfolioApy}%
          </div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl border border-emerald-500/30">
          <div className="text-xs text-white/50 mb-1">최적화 APY</div>
          <div className={`text-xl font-bold text-${colors.secondary}`}>
            {recommendation.optimizedPortfolioApy}%
          </div>
        </div>
      </div>

      {/* High Priority Actions */}
      {highPriorityActions.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-white/50 mb-2">우선 조치 필요</div>
          <div className="space-y-2">
            {highPriorityActions.slice(0, 2).map((action, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="text-xs text-white/80">{action.poolName}</span>
                <span className={`text-xs font-bold ${
                  action.reallocationAction === 'INCREASE' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {action.reallocationAction === 'INCREASE' ? '+' : '-'}
                  {Math.abs(action.recommendedAmount - action.currentAmount).toLocaleString()} KAUS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimated Gain */}
      <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">예상 연간 추가 수익</span>
          <span className={`text-lg font-bold text-${colors.secondary}`}>
            +${recommendation.estimatedAnnualGain.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Auto Rebalance Button */}
      <motion.button
        whileHover={{ scale: isRebalancing ? 1 : 1.02 }}
        whileTap={{ scale: isRebalancing ? 1 : 0.98 }}
        onClick={onAutoRebalance}
        disabled={isRebalancing}
        className={`w-full py-3 rounded-xl bg-[#171717] text-[#F9F9F7] font-bold text-sm hover:bg-[#171717]/90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="flex items-center justify-center gap-2">
          {isRebalancing ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⏳
              </motion.span>
              <span>재배치 진행 중...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>자동 재배치 실행</span>
            </>
          )}
        </span>
      </motion.button>

      {recommendation.autoExecute && (
        <p className="text-center text-xs text-white/40 mt-2">
          Emperor 등급: 자동 실행 활성화됨
        </p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WEALTH DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export function WealthDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('emerald');
  const [recommendation, setRecommendation] = useState<GovernanceRecommendation | null>(null);
  const [projections, setProjections] = useState<GrowthProjection[]>([]);
  const [salesRecommendations, setSalesRecommendations] = useState<JarvisSalesRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize data from real API
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // PRODUCTION: Fetch real user profile from API
        const userProfile = await fetchUserProfile();

        if (!userProfile) {
          // User not authenticated - show guest state
          const guestProfile = getDefaultUserProfile();
          setProfile(guestProfile);
          setTheme('emerald');
          setRecommendation(null);
          setProjections([]);
          setError('로그인이 필요합니다. 전체 기능을 이용하려면 로그인하세요.');
          setIsLoading(false);
          return;
        }

        const style = analyzeInvestmentStyle(userProfile);
        const themeMode = getThemeForStyle(style);
        const governanceRec = generateGovernanceRecommendation(userProfile);

        setProfile(userProfile);
        setTheme(themeMode);
        setRecommendation(governanceRec);
        setProjections(calculateEmpireGrowth(userProfile.totalAssets, governanceRec.optimizedPortfolioApy, 12));
        setSalesRecommendations(generateJarvisSalesRecommendations(userProfile, governanceRec));

      } catch (err) {
        console.error('[WealthDashboard] Init error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const handleAutoRebalance = async () => {
    if (!recommendation || !profile) return;

    setIsRebalancing(true);

    try {
      // PRODUCTION: Execute real rebalance via API
      const result = await executeJarvisAction('REBALANCE', undefined, profile.id);

      if (result.success) {
        // Refresh data after successful rebalance
        const updatedProfile = await fetchUserProfile();
        if (updatedProfile) {
          setProfile(updatedProfile);
          const newRecommendation = generateGovernanceRecommendation(updatedProfile);
          setRecommendation(newRecommendation);
          setProjections(calculateEmpireGrowth(updatedProfile.totalAssets, newRecommendation.optimizedPortfolioApy, 12));
          setSalesRecommendations(generateJarvisSalesRecommendations(updatedProfile, newRecommendation));
        }
      } else {
        setError(result.message || '재배치 실행 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('[WealthDashboard] Rebalance error:', err);
      setError('재배치 실행 중 네트워크 오류가 발생했습니다.');
    }

    setIsRebalancing(false);
  };

  const colors = THEME_COLORS[theme];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#F9F9F7]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated state
  if (!profile || error === '로그인이 필요합니다. 전체 기능을 이용하려면 로그인하세요.') {
    return (
      <div className="bg-[#F9F9F7] rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-bold text-[#171717] mb-2">로그인이 필요합니다</h3>
        <p className="text-[#171717]/60 mb-6">
          AI 자산 관리 및 최적화 기능을 이용하려면 로그인하세요.
        </p>
        <a
          href="/auth/login"
          className="inline-block px-6 py-3 bg-[#171717] text-[#F9F9F7] font-bold rounded-xl hover:bg-[#171717]/90 transition-colors"
        >
          로그인하기
        </a>
      </div>
    );
  }

  // No recommendation state (user has no assets)
  if (!recommendation && profile.totalAssets === 0) {
    return (
      <div className="bg-[#F9F9F7] rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-xl font-bold text-[#171717] mb-2">자산을 시작하세요</h3>
        <p className="text-[#171717]/60 mb-6">
          KAUS 코인을 구매하여 AI 자산 최적화 기능을 활성화하세요.
        </p>
        <a
          href="/nexus/exchange"
          className="inline-block px-6 py-3 bg-[#171717] text-[#F9F9F7] font-bold rounded-xl hover:bg-[#171717]/90 transition-colors"
        >
          KAUS 구매하기
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F9F9F7] p-6 rounded-2xl">
      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
        >
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">✕</button>
        </motion.div>
      )}

      {/* Header with Style Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#171717] mb-1">Wealth Dashboard</h2>
          <p className="text-sm text-[#171717]/50">AI 기반 자산 최적화</p>
        </div>
        <StyleBadge style={profile.investmentStyle} theme={theme} />
      </div>

      {/* Portfolio Summary - Tesla Minimalism */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 자산', value: profile.totalAssets.toLocaleString(), unit: 'KAUS', icon: '💎' },
          { label: '스테이킹', value: profile.stakedAssets.toLocaleString(), unit: 'KAUS', icon: '🔒' },
          { label: '유동성', value: profile.liquidAssets.toLocaleString(), unit: 'KAUS', icon: '💧' },
          { label: '등급', value: profile.tier, unit: '', icon: '👑' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl p-4 border border-[#171717]/10 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-[#171717]/50">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-[#171717]">
              {stat.value}
              {stat.unit && <span className="text-xs text-[#171717]/40 ml-1">{stat.unit}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empire Growth Projection */}
        {projections.length > 0 && (
          <EmpireGrowthProjection
            projections={projections}
            theme={theme}
            totalAssets={profile.totalAssets}
          />
        )}

        {/* AI Rebalance Recommendation */}
        {recommendation && (
          <RebalanceRecommendation
            recommendation={recommendation}
            theme={theme}
            onAutoRebalance={handleAutoRebalance}
            isRebalancing={isRebalancing}
          />
        )}
      </div>
    </div>
  );
}

export default WealthDashboard;
