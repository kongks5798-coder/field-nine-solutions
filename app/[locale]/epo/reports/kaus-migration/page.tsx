'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * K-AUS MIGRATION PORTAL
 *
 * TMA 유저를 위한 K-AUS 마이그레이션 포털
 * - 기존 TMA 자산 → K-AUS 전환
 * - 보너스 마이그레이션 인센티브
 * - 실시간 전환 계산기
 */

type MigrationStep = 'CONNECT' | 'VERIFY' | 'CONVERT' | 'CONFIRM' | 'COMPLETE';

interface TMAAsset {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  usdValue: number;
  conversionRate: number;
  kausAmount: number;
}

interface MigrationBonus {
  type: string;
  description: string;
  bonus: number;
  requirement: string;
}

// Migration bonuses
const MIGRATION_BONUSES: MigrationBonus[] = [
  {
    type: 'EARLY_BIRD',
    description: '얼리버드 보너스',
    bonus: 0.15,
    requirement: '첫 10,000명 마이그레이션',
  },
  {
    type: 'VOLUME_TIER_1',
    description: '볼륨 보너스 Tier 1',
    bonus: 0.05,
    requirement: '$1,000+ 전환',
  },
  {
    type: 'VOLUME_TIER_2',
    description: '볼륨 보너스 Tier 2',
    bonus: 0.10,
    requirement: '$10,000+ 전환',
  },
  {
    type: 'VOLUME_TIER_3',
    description: '볼륨 보너스 Tier 3',
    bonus: 0.20,
    requirement: '$100,000+ 전환',
  },
  {
    type: 'STAKING_COMMIT',
    description: '스테이킹 약정 보너스',
    bonus: 0.10,
    requirement: '90일 이상 스테이킹 약정',
  },
  {
    type: 'REFERRAL',
    description: '추천인 보너스',
    bonus: 0.05,
    requirement: '3명 이상 추천 마이그레이션',
  },
];

// Simulated TMA assets
const MOCK_TMA_ASSETS: TMAAsset[] = [
  {
    id: 'nxusd',
    name: 'NEXUS USD',
    symbol: 'NXUSD',
    balance: 5000,
    usdValue: 5000,
    conversionRate: 10,
    kausAmount: 50000,
  },
  {
    id: 'nxe',
    name: 'NEXUS Energy',
    symbol: 'NXE',
    balance: 12500,
    usdValue: 3750,
    conversionRate: 8,
    kausAmount: 30000,
  },
  {
    id: 'erc',
    name: 'Energy Credit',
    symbol: 'ERC',
    balance: 850,
    usdValue: 2125,
    conversionRate: 7.5,
    kausAmount: 15937.5,
  },
  {
    id: 'nft-solar',
    name: 'Solar Node NFT',
    symbol: 'NFT',
    balance: 2,
    usdValue: 4000,
    conversionRate: 12,
    kausAmount: 48000,
  },
];

export default function KAUSMigrationPage() {
  const [currentStep, setCurrentStep] = useState<MigrationStep>('CONNECT');
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [stakingCommit, setStakingCommit] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [animatedKaus, setAnimatedKaus] = useState(0);

  // Calculate totals
  const selectedAssetData = MOCK_TMA_ASSETS.filter(a => selectedAssets.includes(a.id));
  const totalUsdValue = selectedAssetData.reduce((sum, a) => sum + a.usdValue, 0);
  const baseKausAmount = selectedAssetData.reduce((sum, a) => sum + a.kausAmount, 0);

  // Calculate applicable bonuses
  const applicableBonuses = MIGRATION_BONUSES.filter(b => {
    if (b.type === 'EARLY_BIRD') return true; // Always show
    if (b.type === 'VOLUME_TIER_1') return totalUsdValue >= 1000;
    if (b.type === 'VOLUME_TIER_2') return totalUsdValue >= 10000;
    if (b.type === 'VOLUME_TIER_3') return totalUsdValue >= 100000;
    if (b.type === 'STAKING_COMMIT') return stakingCommit;
    if (b.type === 'REFERRAL') return referralCode.length > 0;
    return false;
  });

  const totalBonusRate = applicableBonuses.reduce((sum, b) => sum + b.bonus, 0);
  const bonusKausAmount = baseKausAmount * totalBonusRate;
  const finalKausAmount = baseKausAmount + bonusKausAmount;

  // Animate K-AUS counter
  useEffect(() => {
    if (finalKausAmount > 0) {
      const duration = 1000;
      const steps = 60;
      const increment = finalKausAmount / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= finalKausAmount) {
          setAnimatedKaus(finalKausAmount);
          clearInterval(timer);
        } else {
          setAnimatedKaus(current);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [finalKausAmount]);

  // Connect TMA wallet
  const connectWallet = useCallback(() => {
    setIsConnected(true);
    setTimeout(() => setCurrentStep('VERIFY'), 500);
  }, []);

  // Verify identity
  const verifyIdentity = useCallback(() => {
    setIsVerified(true);
    setTimeout(() => setCurrentStep('CONVERT'), 500);
  }, []);

  // Execute migration
  const executeMigration = useCallback(() => {
    setCurrentStep('CONFIRM');
    let progress = 0;
    const timer = setInterval(() => {
      progress += 2;
      setMigrationProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
        setMigrationComplete(true);
        setCurrentStep('COMPLETE');
      }
    }, 100);
  }, []);

  // Toggle asset selection
  const toggleAsset = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Select all assets
  const selectAllAssets = () => {
    setSelectedAssets(MOCK_TMA_ASSETS.map(a => a.id));
  };

  // Migration statistics
  const migrationStats = {
    totalMigrated: 8247,
    totalKausConverted: 847_500_000,
    averageBonus: 0.18,
    remainingEarlyBird: 1753,
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
            🔄
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              K-AUS MIGRATION PORTAL
            </h1>
            <p className="text-gray-400">TMA 자산을 K-AUS로 원클릭 전환</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Report Generated: {new Date().toISOString().split('T')[0]} | Version: 1.0.0
        </div>
      </div>

      {/* Migration Statistics Banner */}
      <div className="bg-gradient-to-r from-amber-900/30 via-orange-900/30 to-amber-900/30 border border-amber-500/30 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-black text-amber-400">
              {migrationStats.totalMigrated.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">마이그레이션 완료</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-green-400">
              {(migrationStats.totalKausConverted / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-400">K-AUS 전환량</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-blue-400">
              +{(migrationStats.averageBonus * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-400">평균 보너스</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-red-400 animate-pulse">
              {migrationStats.remainingEarlyBird.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">얼리버드 잔여석</div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-amber-400 mb-4">📊 마이그레이션 단계</h2>
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{
                width:
                  currentStep === 'CONNECT' ? '0%' :
                  currentStep === 'VERIFY' ? '25%' :
                  currentStep === 'CONVERT' ? '50%' :
                  currentStep === 'CONFIRM' ? '75%' :
                  '100%'
              }}
            />
          </div>

          {/* Steps */}
          {[
            { step: 'CONNECT' as MigrationStep, label: '지갑 연결', icon: '🔗' },
            { step: 'VERIFY' as MigrationStep, label: '본인 인증', icon: '🔐' },
            { step: 'CONVERT' as MigrationStep, label: '자산 선택', icon: '💰' },
            { step: 'CONFIRM' as MigrationStep, label: '전환 실행', icon: '⚡' },
            { step: 'COMPLETE' as MigrationStep, label: '완료', icon: '✅' },
          ].map((item, idx) => {
            const steps: MigrationStep[] = ['CONNECT', 'VERIFY', 'CONVERT', 'CONFIRM', 'COMPLETE'];
            const currentIdx = steps.indexOf(currentStep);
            const isActive = idx <= currentIdx;
            const isCurrent = item.step === currentStep;

            return (
              <div key={item.step} className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30'
                    : 'bg-gray-800 border border-gray-700'
                } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black' : ''}`}>
                  {item.icon}
                </div>
                <div className={`mt-2 text-sm ${isActive ? 'text-amber-400' : 'text-gray-500'}`}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Migration Form */}
        <div className="space-y-6">
          {/* Step 1: Connect Wallet */}
          <div className={`bg-gray-900/50 border rounded-xl p-6 transition-all duration-300 ${
            currentStep === 'CONNECT' ? 'border-amber-500/50' : 'border-gray-800'
          }`}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              🔗 Step 1: TMA 지갑 연결
              {isConnected && <span className="text-green-400 text-sm">✓ 완료</span>}
            </h3>

            {!isConnected ? (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-sm text-blue-400">
                    Telegram Mini App에서 사용 중인 지갑을 연결하세요.
                    연결 시 기존 자산 정보가 자동으로 불러와집니다.
                  </div>
                </div>
                <button
                  onClick={connectWallet}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">📱</span>
                  TMA 지갑 연결
                </button>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">연결된 지갑</div>
                    <div className="font-mono text-green-400">0x7a3...f92b</div>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Verify Identity */}
          <div className={`bg-gray-900/50 border rounded-xl p-6 transition-all duration-300 ${
            currentStep === 'VERIFY' ? 'border-amber-500/50' : 'border-gray-800'
          } ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              🔐 Step 2: 본인 인증
              {isVerified && <span className="text-green-400 text-sm">✓ 완료</span>}
            </h3>

            {!isVerified ? (
              <div className="space-y-4">
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                  <div className="text-sm text-amber-400">
                    KYC 인증이 완료된 사용자만 마이그레이션이 가능합니다.
                    Telegram 계정을 통해 간편 인증됩니다.
                  </div>
                </div>
                <button
                  onClick={verifyIdentity}
                  disabled={!isConnected}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="text-2xl">🔐</span>
                  Telegram KYC 인증
                </button>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">인증된 사용자</div>
                    <div className="font-bold text-green-400">@fieldnine_ceo</div>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Select Assets */}
          <div className={`bg-gray-900/50 border rounded-xl p-6 transition-all duration-300 ${
            currentStep === 'CONVERT' ? 'border-amber-500/50' : 'border-gray-800'
          } ${!isVerified ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              💰 Step 3: 전환할 자산 선택
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">보유 TMA 자산</div>
                <button
                  onClick={selectAllAssets}
                  className="text-sm text-amber-400 hover:text-amber-300"
                >
                  전체 선택
                </button>
              </div>

              <div className="space-y-2">
                {MOCK_TMA_ASSETS.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAssets.includes(asset.id)
                        ? 'bg-amber-900/30 border-amber-500/50'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center ${
                          selectedAssets.includes(asset.id)
                            ? 'bg-amber-500 border-amber-500'
                            : 'border-gray-600'
                        }`}>
                          {selectedAssets.includes(asset.id) && '✓'}
                        </div>
                        <div>
                          <div className="font-bold">{asset.name}</div>
                          <div className="text-sm text-gray-400">
                            {asset.balance.toLocaleString()} {asset.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400">
                          ${asset.usdValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-amber-400">
                          → {asset.kausAmount.toLocaleString()} K-AUS
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bonus Options */}
              <div className="mt-6 pt-4 border-t border-gray-800">
                <div className="text-sm font-bold text-amber-400 mb-3">🎁 추가 보너스</div>

                <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={stakingCommit}
                    onChange={(e) => setStakingCommit(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-medium">90일 스테이킹 약정</div>
                    <div className="text-sm text-green-400">+10% 보너스</div>
                  </div>
                </label>

                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">추천인 코드 (선택)</div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="추천인 코드 입력"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                  {referralCode && (
                    <div className="text-sm text-green-400 mt-1">+5% 추천인 보너스 적용</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Execute Migration Button */}
          {currentStep === 'CONVERT' && selectedAssets.length > 0 && (
            <button
              onClick={executeMigration}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl font-black text-xl text-white transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-3"
            >
              <span className="text-2xl">⚡</span>
              마이그레이션 실행
              <span className="text-2xl">⚡</span>
            </button>
          )}

          {/* Migration Progress */}
          {currentStep === 'CONFIRM' && (
            <div className="bg-gray-900/50 border border-amber-500/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">⏳ 마이그레이션 진행 중...</h3>
              <div className="space-y-4">
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${migrationProgress}%` }}
                  />
                </div>
                <div className="text-center text-2xl font-bold text-amber-400">
                  {migrationProgress}%
                </div>
                <div className="text-center text-sm text-gray-400">
                  {migrationProgress < 30 && '자산 검증 중...'}
                  {migrationProgress >= 30 && migrationProgress < 60 && '스마트 컨트랙트 실행 중...'}
                  {migrationProgress >= 60 && migrationProgress < 90 && 'K-AUS 민팅 중...'}
                  {migrationProgress >= 90 && '최종 확인 중...'}
                </div>
              </div>
            </div>
          )}

          {/* Migration Complete */}
          {currentStep === 'COMPLETE' && (
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-xl p-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h3 className="text-2xl font-black text-green-400">마이그레이션 완료!</h3>
                <div className="text-gray-300">
                  축하합니다! 귀하의 자산이 성공적으로 K-AUS로 전환되었습니다.
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400">전환된 K-AUS</div>
                  <div className="text-4xl font-black text-amber-400">
                    {finalKausAmount.toLocaleString()} K-AUS
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  트랜잭션: 0x7f3a...9c2d
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary & Bonuses */}
        <div className="space-y-6">
          {/* Conversion Summary */}
          <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-400 mb-4">📊 전환 요약</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-amber-500/20">
                <span className="text-gray-400">선택된 자산</span>
                <span className="font-bold">{selectedAssets.length}개</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-amber-500/20">
                <span className="text-gray-400">총 USD 가치</span>
                <span className="font-bold text-green-400">${totalUsdValue.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-amber-500/20">
                <span className="text-gray-400">기본 K-AUS</span>
                <span className="font-bold">{baseKausAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-amber-500/20">
                <span className="text-gray-400">보너스 K-AUS</span>
                <span className="font-bold text-green-400">+{bonusKausAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold">최종 수령량</span>
                <span className="text-2xl font-black text-amber-400">
                  {animatedKaus.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                </span>
              </div>
            </div>
          </div>

          {/* Applicable Bonuses */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-400 mb-4">🎁 적용 보너스</h3>

            <div className="space-y-3">
              {MIGRATION_BONUSES.map(bonus => {
                const isApplicable = applicableBonuses.find(b => b.type === bonus.type);
                return (
                  <div
                    key={bonus.type}
                    className={`p-3 rounded-lg border transition-all ${
                      isApplicable
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-gray-800/30 border-gray-700 opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className={`font-medium ${isApplicable ? 'text-green-400' : 'text-gray-500'}`}>
                          {bonus.description}
                        </div>
                        <div className="text-xs text-gray-500">{bonus.requirement}</div>
                      </div>
                      <div className={`font-bold ${isApplicable ? 'text-green-400' : 'text-gray-600'}`}>
                        +{(bonus.bonus * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-bold">총 보너스율</span>
                  <span className="text-xl font-black text-green-400">
                    +{(totalBonusRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Benefits */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-4">✨ 마이그레이션 혜택</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔥</div>
                <div>
                  <div className="font-bold">디플레이션 참여</div>
                  <div className="text-sm text-gray-400">
                    모든 거래 수수료의 10%가 영구 소각되어 가치 상승에 기여
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <div className="font-bold">PoE 마이닝 참여권</div>
                  <div className="text-sm text-gray-400">
                    에너지 생산 노드 연결 시 K-AUS 채굴 가능
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <div className="font-bold">RWA 우선 투자권</div>
                  <div className="text-sm text-gray-400">
                    스테이킹 티어에 따른 실물자산 투자 우선권 획득
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-2xl">👑</div>
                <div>
                  <div className="font-bold">글로벌 에너지 기축통화</div>
                  <div className="text-sm text-gray-400">
                    전 세계 에너지 거래의 표준 화폐로 성장
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Halving Reminder */}
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl animate-pulse">⏰</div>
              <div>
                <div className="font-bold text-red-400">반감기 임박!</div>
                <div className="text-sm text-gray-400">
                  다음 K-AUS 반감기까지 <span className="text-amber-400 font-bold">847일</span> 남음
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  현재 채굴 보상: 6.25 K-AUS/블록 → 3.125 K-AUS/블록
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-400 mb-4">❓ 자주 묻는 질문</h3>

            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-white">마이그레이션 후 기존 자산은?</div>
                <div className="text-gray-500">TMA 자산은 영구적으로 소각되며, K-AUS로 1:1 전환됩니다.</div>
              </div>
              <div>
                <div className="font-medium text-white">보너스는 언제 지급되나요?</div>
                <div className="text-gray-500">마이그레이션 완료 즉시 보너스 K-AUS가 함께 지급됩니다.</div>
              </div>
              <div>
                <div className="font-medium text-white">스테이킹 약정 해제가 가능한가요?</div>
                <div className="text-gray-500">약정 기간 전 해제 시 보너스 K-AUS가 회수됩니다.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>K-AUS Migration Portal v1.0.0 | Field Nine Solutions</p>
        <p className="text-amber-400/60 mt-2">
          &quot;전 세계 모든 에너지 노드가 카우스를 갈구하게 하라&quot;
        </p>
      </div>
    </div>
  );
}
