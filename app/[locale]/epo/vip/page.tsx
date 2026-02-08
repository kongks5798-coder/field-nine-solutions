'use client';

/**
 * SOVEREIGN BLACK CARD - VIP ONBOARDING
 *
 * Phase 20 Deliverable 3:
 * 상위 1% 투자자를 위한 Sovereign Card 신청 페이지 및 VIP 라운지 UI
 *
 * "부의 상징, Sovereign Black Card"
 */

import React, { useState, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

type CardTier = 'GOLD' | 'PLATINUM' | 'BLACK' | 'SOVEREIGN';
type ApplicationStep = 'SELECT' | 'VERIFY' | 'CUSTOMIZE' | 'CONFIRM' | 'COMPLETE';

interface CardTierInfo {
  tier: CardTier;
  name: string;
  nameKo: string;
  minStake: number;
  monthlyLimit: number;
  cashbackRate: number;
  annualFee: number;
  color: string;
  gradient: string;
  benefits: string[];
  exclusive: boolean;
}

interface UserAssets {
  kausBalance: number;
  stakedKaus: number;
  energyNodes: number;
  dividendsPending: number;
  cardSpendingPower: number;
  netWorthUsd: number;
}

// ============================================
// CONSTANTS
// ============================================

const KAUS_PRICE = 2.47;

const CARD_TIERS: CardTierInfo[] = [
  {
    tier: 'GOLD',
    name: 'Gold',
    nameKo: '골드',
    minStake: 10000,
    monthlyLimit: 50000,
    cashbackRate: 2,
    annualFee: 0,
    color: 'from-yellow-600 to-amber-500',
    gradient: 'bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-700',
    benefits: ['2% K-AUS 캐시백', '해외 결제 수수료 면제', '공항 라운지 연 2회'],
    exclusive: false,
  },
  {
    tier: 'PLATINUM',
    name: 'Platinum',
    nameKo: '플래티넘',
    minStake: 50000,
    monthlyLimit: 200000,
    cashbackRate: 3,
    annualFee: 0,
    color: 'from-gray-400 to-gray-300',
    gradient: 'bg-gradient-to-br from-gray-400 via-slate-300 to-gray-500',
    benefits: ['3% K-AUS 캐시백', '프리미엄 컨시어지', '공항 라운지 무제한', '여행자 보험'],
    exclusive: false,
  },
  {
    tier: 'BLACK',
    name: 'Black',
    nameKo: '블랙',
    minStake: 250000,
    monthlyLimit: 1000000,
    cashbackRate: 4,
    annualFee: 500,
    color: 'from-gray-900 to-black',
    gradient: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    benefits: [
      '4% K-AUS 캐시백',
      '에코시스템 10% 추가 (Aura Sydney, Nomad Monthly)',
      '전용 프라이빗 뱅커',
      '글로벌 럭셔리 호텔 업그레이드',
      '전용 공항 리무진',
    ],
    exclusive: false,
  },
  {
    tier: 'SOVEREIGN',
    name: 'Sovereign',
    nameKo: '소버린',
    minStake: 1000000,
    monthlyLimit: Infinity,
    cashbackRate: 5,
    annualFee: 2500,
    color: 'from-cyan-500 to-purple-600',
    gradient: 'bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500',
    benefits: [
      '5% K-AUS 캐시백',
      '무제한 월 한도',
      '배당금 가속 (2x)',
      '투자 우선권',
      '연간 리트릿 초청',
      'Field Nine 어드바이저리 보드 참여',
      '전용 메탈 카드 (티타늄)',
    ],
    exclusive: true,
  },
];

const mockUserAssets: UserAssets = {
  kausBalance: 35000,
  stakedKaus: 280000,
  energyNodes: 12,
  dividendsPending: 4250,
  cardSpendingPower: 25000,
  netWorthUsd: 778250,
};

// ============================================
// COMPONENTS
// ============================================

function SovereignCardVisual({ tier, rotating = false }: { tier: CardTierInfo; rotating?: boolean }) {
  return (
    <div
      className={`relative w-full max-w-md aspect-[1.586/1] rounded-2xl ${tier.gradient} shadow-2xl overflow-hidden ${
        rotating ? 'animate-pulse' : ''
      }`}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Card Texture Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[url('/textures/metal-brush.png')] bg-cover" />
      </div>

      {/* Holographic Effect for Sovereign */}
      {tier.tier === 'SOVEREIGN' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
      )}

      {/* Card Content */}
      <div className="relative h-full p-6 flex flex-col justify-between text-white">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-70">Field Nine</div>
            <div className="text-2xl font-black">{tier.name.toUpperCase()}</div>
          </div>
          <div className="text-right">
            {tier.exclusive && (
              <div className="text-xs bg-white/20 px-2 py-1 rounded-full mb-1">INVITATION ONLY</div>
            )}
            <div className="text-xs opacity-70">SOVEREIGN CARD</div>
          </div>
        </div>

        {/* Chip */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center">
            <div className="w-8 h-6 border-2 border-yellow-600 rounded" />
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center">
            <div className="text-xs">NFC</div>
          </div>
        </div>

        {/* Card Number */}
        <div className="font-mono text-xl tracking-widest opacity-90">
          •••• •••• •••• 9999
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs opacity-70 mb-1">CARD HOLDER</div>
            <div className="text-lg font-bold tracking-wide">FIELD NINE VIP</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-70 mb-1">CASHBACK</div>
            <div className="text-2xl font-black">{tier.cashbackRate}%</div>
          </div>
        </div>
      </div>

      {/* Card Edge Effect */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 pointer-events-none" />
    </div>
  );
}

function TierSelector({
  tiers,
  selectedTier,
  userAssets,
  onSelect,
}: {
  tiers: CardTierInfo[];
  selectedTier: CardTier | null;
  userAssets: UserAssets;
  onSelect: (tier: CardTier) => void;
}) {
  const totalStake = userAssets.stakedKaus + userAssets.kausBalance;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map((tier) => {
        const eligible = totalStake >= tier.minStake;
        const isSelected = selectedTier === tier.tier;

        return (
          <button
            key={tier.tier}
            onClick={() => eligible && onSelect(tier.tier)}
            disabled={!eligible}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              isSelected
                ? 'border-cyan-500 bg-cyan-500/10 scale-105'
                : eligible
                ? 'border-white/20 bg-white/5 hover:border-white/40'
                : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className={`w-12 h-8 rounded-lg ${tier.gradient} mb-4`} />
            <div className="text-lg font-bold">{tier.nameKo}</div>
            <div className="text-sm text-gray-400 mb-3">{tier.name} Card</div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">필요 스테이킹</span>
                <span className={eligible ? 'text-green-400' : 'text-red-400'}>
                  {tier.minStake.toLocaleString()} K-AUS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">캐시백</span>
                <span className="text-cyan-400">{tier.cashbackRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">월 한도</span>
                <span>
                  {tier.monthlyLimit === Infinity ? '무제한' : `$${tier.monthlyLimit.toLocaleString()}`}
                </span>
              </div>
            </div>

            {!eligible && (
              <div className="mt-3 text-xs text-red-400">
                {(tier.minStake - totalStake).toLocaleString()} K-AUS 추가 필요
              </div>
            )}

            {tier.exclusive && eligible && (
              <div className="mt-3 text-xs text-purple-400">초청 전용 • 승인 필요</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function BenefitsDisplay({ tier }: { tier: CardTierInfo }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4 text-cyan-400">{tier.nameKo} 카드 혜택</h3>
      <div className="space-y-3">
        {tier.benefits.map((benefit, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyan-400 text-sm">✓</span>
            </div>
            <span className="text-gray-300">{benefit}</span>
          </div>
        ))}
      </div>

      {tier.annualFee > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
          <span className="text-gray-400">연회비</span>
          <span className="text-white">${tier.annualFee.toLocaleString()}/년</span>
        </div>
      )}
    </div>
  );
}

function AssetSummary({ assets }: { assets: UserAssets }) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10">
      <h3 className="text-lg font-bold mb-4">💼 나의 자산 현황</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">총 자산</div>
          <div className="text-2xl font-bold text-green-400">
            ${assets.netWorthUsd.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">스테이킹</div>
          <div className="text-2xl font-bold text-purple-400">
            {assets.stakedKaus.toLocaleString()} K-AUS
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">보유 K-AUS</div>
          <div className="text-xl font-bold">{assets.kausBalance.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">에너지 노드</div>
          <div className="text-xl font-bold">{assets.energyNodes}개</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">대기 배당금</div>
          <div className="text-xl font-bold text-yellow-400">
            {assets.dividendsPending.toLocaleString()} K-AUS
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">카드 결제력</div>
          <div className="text-xl font-bold text-cyan-400">
            ${assets.cardSpendingPower.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-sm text-gray-400 mb-2">등급 자격 (총 스테이킹 + 보유)</div>
        <div className="text-lg font-bold">
          {(assets.stakedKaus + assets.kausBalance).toLocaleString()} K-AUS
        </div>
        <div className="text-sm text-green-400">✓ BLACK 카드 자격 충족</div>
      </div>
    </div>
  );
}

function LiveBalanceWidget() {
  const [balance, setBalance] = useState(15847.32);
  const [transactions, setTransactions] = useState([
    { time: '방금', merchant: 'Aura Sydney', amount: -450, cashback: 45 },
    { time: '2시간 전', merchant: 'Bistro 42', amount: -85, cashback: 3.4 },
    { time: '어제', merchant: 'Apple Store', amount: -1299, cashback: 51.96 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time balance updates
      setBalance((prev) => prev + (Math.random() - 0.5) * 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">💳 실시간 카드 잔액</h3>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      <div className="text-center mb-6">
        <div className="text-sm text-gray-400 mb-1">사용 가능 잔액</div>
        <div className="text-4xl font-black text-white transition-all">
          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          ≈ {(balance / KAUS_PRICE).toFixed(2)} K-AUS
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-400 mb-2">최근 거래</div>
        {transactions.map((tx, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div>
              <div className="font-medium">{tx.merchant}</div>
              <div className="text-xs text-gray-400">{tx.time}</div>
            </div>
            <div className="text-right">
              <div className={tx.amount < 0 ? 'text-red-400' : 'text-green-400'}>
                {tx.amount < 0 ? '' : '+'}${Math.abs(tx.amount).toLocaleString()}
              </div>
              <div className="text-xs text-cyan-400">+{tx.cashback} K-AUS 캐시백</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationForm({ tier, onSubmit }: { tier: CardTierInfo; onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    cardDesign: 'standard',
    deliveryOption: 'express',
    agreeTerms: false,
  });

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">{tier.nameKo} 카드 신청</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-2">성명 (영문)</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-500 outline-none"
            placeholder="HONG GILDONG"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">이메일</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-500 outline-none"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">연락처</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-500 outline-none"
            placeholder="010-0000-0000"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">배송 주소</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-500 outline-none"
            placeholder="서울시 강남구..."
          />
        </div>
      </div>

      {tier.tier === 'SOVEREIGN' && (
        <div>
          <label className="text-sm text-gray-400 block mb-2">카드 디자인</label>
          <div className="grid grid-cols-3 gap-3">
            {['standard', 'titanium', 'custom'].map((design) => (
              <button
                key={design}
                onClick={() => setFormData({ ...formData, cardDesign: design })}
                className={`p-4 rounded-xl border transition-all ${
                  formData.cardDesign === design
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                <div className="text-sm font-medium">
                  {design === 'standard' ? '스탠다드' : design === 'titanium' ? '티타늄' : '커스텀'}
                </div>
                <div className="text-xs text-gray-400">
                  {design === 'standard' ? '무료' : design === 'titanium' ? '+$500' : '+$1,000'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={formData.agreeTerms}
          onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
          className="mt-1"
        />
        <span className="text-sm text-gray-400">
          Sovereign Card 이용약관 및 개인정보 처리방침에 동의합니다.
        </span>
      </div>

      <button
        onClick={onSubmit}
        disabled={!formData.agreeTerms || !formData.fullName || !formData.email}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          formData.agreeTerms && formData.fullName && formData.email
            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90'
            : 'bg-gray-700 cursor-not-allowed'
        }`}
      >
        {tier.exclusive ? '승인 요청' : '카드 신청'}
      </button>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function VIPOnboardingPage() {
  const [selectedTier, setSelectedTier] = useState<CardTier | null>(null);
  const [step, setStep] = useState<ApplicationStep>('SELECT');
  const [userAssets] = useState<UserAssets>(mockUserAssets);

  const selectedTierInfo = CARD_TIERS.find((t) => t.tier === selectedTier);

  const handleTierSelect = (tier: CardTier) => {
    setSelectedTier(tier);
    setStep('VERIFY');
  };

  const handleApplicationSubmit = () => {
    setStep('COMPLETE');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-purple-500/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/textures/grid.svg')] opacity-20" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="text-sm text-cyan-400 mb-4 tracking-widest">FIELD NINE EXCLUSIVE</div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Sovereign Black Card
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            K-AUS로 결제하고, 배당금으로 충당하고, 캐시백으로 부를 쌓으세요
          </p>

          {/* Featured Card */}
          <div className="max-w-md mx-auto">
            <SovereignCardVisual tier={selectedTierInfo || CARD_TIERS[3]} rotating={!selectedTier} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {step === 'SELECT' && (
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">카드 등급 선택</h2>
              <p className="text-gray-400">보유 K-AUS에 따라 신청 가능한 카드가 결정됩니다</p>
            </div>

            <TierSelector
              tiers={CARD_TIERS}
              selectedTier={selectedTier}
              userAssets={userAssets}
              onSelect={handleTierSelect}
            />
          </section>
        )}

        {step === 'VERIFY' && selectedTierInfo && (
          <section className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <button
                  onClick={() => setStep('SELECT')}
                  className="text-sm text-gray-400 hover:text-white mb-4 inline-block"
                >
                  ← 다른 카드 선택
                </button>
                <h2 className="text-2xl font-bold mb-2">{selectedTierInfo.nameKo} 카드 신청</h2>
              </div>

              <SovereignCardVisual tier={selectedTierInfo} />
              <BenefitsDisplay tier={selectedTierInfo} />
            </div>

            <div className="space-y-6">
              <AssetSummary assets={userAssets} />

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <ApplicationForm tier={selectedTierInfo} onSubmit={handleApplicationSubmit} />
              </div>
            </div>
          </section>
        )}

        {step === 'COMPLETE' && selectedTierInfo && (
          <section className="text-center py-16">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-4">
              {selectedTierInfo.exclusive ? '승인 요청 완료!' : '카드 신청 완료!'}
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {selectedTierInfo.exclusive
                ? '소버린 카드 심사 후 결과를 알려드립니다. (영업일 기준 3-5일)'
                : `${selectedTierInfo.nameKo} 카드가 5-7일 내에 배송됩니다.`}
            </p>

            <div className="max-w-sm mx-auto mb-8">
              <SovereignCardVisual tier={selectedTierInfo} />
            </div>

            <button
              onClick={() => setStep('SELECT')}
              className="px-8 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
            >
              처음으로
            </button>
          </section>
        )}

        {/* VIP Lounge Section */}
        <section className="mt-16 grid md:grid-cols-2 gap-8">
          <LiveBalanceWidget />

          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <h3 className="text-lg font-bold mb-4">🏆 VIP 라운지</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5">
                <div className="text-sm text-gray-400 mb-1">전용 컨시어지</div>
                <div className="font-medium">24/7 프라이빗 서비스</div>
                <div className="text-xs text-cyan-400 mt-1">+82-2-XXX-XXXX</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <div className="text-sm text-gray-400 mb-1">파트너 혜택</div>
                <div className="font-medium">Aura Sydney 10% 추가 적립</div>
                <div className="text-xs text-green-400 mt-1">활성화됨</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <div className="text-sm text-gray-400 mb-1">다음 배당일</div>
                <div className="font-medium">2026년 2월 1일</div>
                <div className="text-xs text-yellow-400 mt-1">예상 +4,250 K-AUS</div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 text-center">
          <div className="inline-block p-8 rounded-3xl bg-gradient-to-r from-gray-900 to-black border border-white/10">
            <h2 className="text-2xl font-bold mb-2">부의 상징, Sovereign Black Card</h2>
            <p className="text-gray-400 mb-4">
              당신의 K-AUS가 현실 세계에서 빛나는 순간
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:opacity-90 transition">
                지금 신청하기
              </button>
              <button className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition">
                상담 요청
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Field Nine Solutions • Sovereign Black Card • Phase 20</p>
          <p className="mt-1">이제 우리는 코드를 넘어 '계약서'로 세상을 지배한다</p>
        </div>
      </footer>
    </div>
  );
}
