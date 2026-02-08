'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 53: DAO GOVERNANCE DASHBOARD COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Proposal cards and lists
 * - Voting interface
 * - Delegate management
 * - Treasury visualization
 * - Governance analytics
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DAOGovernance,
  type Proposal,
  type ProposalStatus,
  type ProposalCategory,
  type VoteOption,
  type Delegate,
  type TreasuryAsset,
  type GovernanceStats,
} from '@/lib/governance/dao-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<ProposalStatus, { label: string; labelKo: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', labelKo: '초안', color: 'text-neutral-400', bgColor: 'bg-neutral-500/20' },
  PENDING: { label: 'Pending', labelKo: '대기중', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  ACTIVE: { label: 'Active', labelKo: '투표중', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  PASSED: { label: 'Passed', labelKo: '통과', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  REJECTED: { label: 'Rejected', labelKo: '부결', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  EXECUTED: { label: 'Executed', labelKo: '실행됨', color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
  CANCELLED: { label: 'Cancelled', labelKo: '취소됨', color: 'text-neutral-400', bgColor: 'bg-neutral-500/20' },
  EXPIRED: { label: 'Expired', labelKo: '만료됨', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
};

const CATEGORY_CONFIG: Record<ProposalCategory, { icon: string; color: string }> = {
  TREASURY: { icon: '💰', color: 'amber' },
  PROTOCOL: { icon: '⚙️', color: 'blue' },
  PARTNERSHIP: { icon: '🤝', color: 'purple' },
  GOVERNANCE: { icon: '🏛️', color: 'emerald' },
  COMMUNITY: { icon: '👥', color: 'cyan' },
  EMERGENCY: { icon: '🚨', color: 'red' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPOSAL CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface ProposalCardProps {
  proposal: Proposal;
  onSelect?: (proposal: Proposal) => void;
  compact?: boolean;
}

export function ProposalCard({ proposal, onSelect, compact = false }: ProposalCardProps) {
  const status = STATUS_CONFIG[proposal.status];
  const category = CATEGORY_CONFIG[proposal.category];
  const percentages = DAOGovernance.calculateVotePercentage(proposal);
  const timeRemaining = DAOGovernance.getTimeRemaining(proposal.timeline.votingEnd);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onSelect?.(proposal)}
      className={`bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden cursor-pointer
        hover:border-neutral-700 transition-all ${compact ? 'p-4' : 'p-5'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <span className="text-xs text-neutral-500 font-mono">{proposal.id}</span>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
          {status.labelKo}
        </div>
      </div>

      {/* Title */}
      <h3 className={`font-bold text-white mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
        {proposal.titleKo}
      </h3>

      {!compact && (
        <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
          {proposal.descriptionKo}
        </p>
      )}

      {/* Voting Progress */}
      {proposal.status === 'ACTIVE' && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400">찬성 {percentages.for}%</span>
            <span className="text-red-400">반대 {percentages.against}%</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${percentages.for}%` }}
            />
            <div
              className="bg-neutral-600 h-full transition-all"
              style={{ width: `${percentages.abstain}%` }}
            />
            <div
              className="bg-red-500 h-full transition-all"
              style={{ width: `${percentages.against}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              정족수: {proposal.votingPower.quorumReached ? '✓ 도달' : '미도달'}
            </span>
            <span className="text-neutral-400">
              {proposal.votingPower.total.toLocaleString()} KAUS
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">{proposal.proposer.avatar}</span>
          <span className="text-xs text-neutral-400">{proposal.proposer.name}</span>
        </div>

        {proposal.status === 'ACTIVE' && !timeRemaining.expired && (
          <div className="text-xs text-neutral-400">
            <span className="text-amber-400">
              {timeRemaining.days > 0 ? `${timeRemaining.days}일 ` : ''}
              {timeRemaining.hours}시간 남음
            </span>
          </div>
        )}

        {proposal.status === 'PASSED' && (
          <div className="text-xs text-blue-400">✓ 통과됨</div>
        )}

        {proposal.status === 'REJECTED' && (
          <div className="text-xs text-red-400">✕ 부결됨</div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPOSAL LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface ProposalListProps {
  filter?: { status?: ProposalStatus; category?: ProposalCategory };
  onSelectProposal?: (proposal: Proposal) => void;
  limit?: number;
}

export function ProposalList({ filter, onSelectProposal, limit }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeFilter, setActiveFilter] = useState<ProposalStatus | 'ALL'>('ALL');

  useEffect(() => {
    const filtered = filter
      ? DAOGovernance.getProposals(filter)
      : activeFilter === 'ALL'
        ? DAOGovernance.getProposals()
        : DAOGovernance.getProposals({ status: activeFilter });

    setProposals(limit ? filtered.slice(0, limit) : filtered);
  }, [filter, activeFilter, limit]);

  const filters: { id: ProposalStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: '전체' },
    { id: 'ACTIVE', label: '투표중' },
    { id: 'PENDING', label: '대기중' },
    { id: 'PASSED', label: '통과' },
    { id: 'REJECTED', label: '부결' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      {!filter && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-violet-500 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Proposal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onSelect={onSelectProposal}
            />
          ))}
        </AnimatePresence>
      </div>

      {proposals.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <span className="text-4xl mb-4 block">📜</span>
          <p>제안이 없습니다</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOTING PANEL
// ═══════════════════════════════════════════════════════════════════════════════

interface VotingPanelProps {
  proposal: Proposal;
  userVotingPower?: number;
  onVote?: (option: VoteOption, reason?: string) => void;
  onClose?: () => void;
}

export function VotingPanel({ proposal, userVotingPower = 5000, onVote, onClose }: VotingPanelProps) {
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const percentages = DAOGovernance.calculateVotePercentage(proposal);
  const timeRemaining = DAOGovernance.getTimeRemaining(proposal.timeline.votingEnd);

  const handleVote = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);

    // Simulate vote submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    onVote?.(selectedOption, reason);
    setIsSubmitting(false);
  };

  const voteOptions: { option: VoteOption; label: string; icon: string; color: string }[] = [
    { option: 'FOR', label: '찬성', icon: '👍', color: 'emerald' },
    { option: 'AGAINST', label: '반대', icon: '👎', color: 'red' },
    { option: 'ABSTAIN', label: '기권', icon: '🤷', color: 'neutral' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-neutral-500 font-mono">{proposal.id}</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <span className="text-neutral-400">✕</span>
            </button>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{proposal.titleKo}</h2>
          <p className="text-neutral-400 text-sm">{proposal.descriptionKo}</p>
        </div>

        {/* Current Results */}
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">현재 투표 현황</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-emerald-400">찬성</span>
                <span className="text-white">{percentages.for}%</span>
              </div>
              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages.for}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">반대</span>
                <span className="text-white">{percentages.against}%</span>
              </div>
              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages.against}%` }}
                  className="h-full bg-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-400">기권</span>
                <span className="text-white">{percentages.abstain}%</span>
              </div>
              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages.abstain}%` }}
                  className="h-full bg-neutral-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4 text-xs text-neutral-500">
            <span>총 투표: {proposal.votingPower.total.toLocaleString()} KAUS</span>
            <span>
              {timeRemaining.expired
                ? '투표 종료'
                : `${timeRemaining.days}일 ${timeRemaining.hours}시간 남음`}
            </span>
          </div>
        </div>

        {/* Vote Options */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">투표하기</h3>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {voteOptions.map(({ option, label, icon, color }) => (
              <button
                key={option}
                onClick={() => setSelectedOption(option)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  selectedOption === option
                    ? `border-${color}-500 bg-${color}-500/20`
                    : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                }`}
              >
                <span className="text-2xl block mb-2">{icon}</span>
                <span className={`text-sm font-medium ${
                  selectedOption === option ? `text-${color}-400` : 'text-neutral-300'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Voting Power Info */}
          <div className="bg-neutral-800 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">내 투표권</span>
              <span className="text-lg font-bold text-white">
                {userVotingPower.toLocaleString()} KAUS
              </span>
            </div>
          </div>

          {/* Reason (Optional) */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="투표 이유 (선택사항)"
            className="w-full p-4 bg-neutral-800 rounded-xl border border-neutral-700 text-white
              placeholder-neutral-500 resize-none focus:outline-none focus:border-violet-500 mb-4"
            rows={3}
          />

          {/* Submit Button */}
          <button
            onClick={handleVote}
            disabled={!selectedOption || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              selectedOption && !isSubmitting
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90'
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block"
              >
                ⏳
              </motion.span>
            ) : (
              '투표 제출'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELEGATE CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface DelegateCardProps {
  delegate: Delegate;
  rank?: number;
  onDelegate?: (delegate: Delegate) => void;
  compact?: boolean;
}

export function DelegateCard({ delegate, rank, onDelegate, compact = false }: DelegateCardProps) {
  const totalVotes = delegate.votingRecord.for + delegate.votingRecord.against + delegate.votingRecord.abstain;
  const forPercentage = totalVotes > 0 ? Math.round((delegate.votingRecord.for / totalVotes) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden
        hover:border-neutral-700 transition-all ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar & Rank */}
        <div className="relative">
          <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center text-2xl">
            {delegate.avatar}
          </div>
          {rank && rank <= 3 && (
            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${rank === 1 ? 'bg-amber-500 text-black' : rank === 2 ? 'bg-neutral-300 text-black' : 'bg-amber-700 text-white'}`}>
              {rank}
            </div>
          )}
          {delegate.isVerified && (
            <div className="absolute -bottom-1 -right-1 text-blue-400">✓</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white truncate">{delegate.name}</h3>
          </div>

          {!compact && (
            <p className="text-neutral-400 text-sm mb-3 line-clamp-2">{delegate.bio}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-amber-400">👑</span>
              <span className="text-neutral-300">{delegate.votingPower.toLocaleString()} KAUS</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-violet-400">👥</span>
              <span className="text-neutral-300">{delegate.delegators} 위임자</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span>
              <span className="text-neutral-300">{forPercentage}% 찬성률</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delegate Button */}
      {onDelegate && (
        <button
          onClick={() => onDelegate(delegate)}
          className="w-full mt-4 py-2.5 bg-violet-500/20 text-violet-400 rounded-xl
            font-medium text-sm hover:bg-violet-500/30 transition-colors"
        >
          위임하기
        </button>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELEGATES LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface DelegatesListProps {
  onDelegate?: (delegate: Delegate) => void;
  limit?: number;
}

export function DelegatesList({ onDelegate, limit }: DelegatesListProps) {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const allDelegates = DAOGovernance.getDelegates();
    const filtered = searchQuery
      ? allDelegates.filter(d =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.bio.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allDelegates;

    setDelegates(limit ? filtered.slice(0, limit) : filtered);
  }, [searchQuery, limit]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="대리인 검색..."
          className="w-full px-4 py-3 pl-10 bg-neutral-800 rounded-xl border border-neutral-700
            text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">🔍</span>
      </div>

      {/* Delegates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {delegates.map((delegate, index) => (
          <DelegateCard
            key={delegate.address}
            delegate={delegate}
            rank={index + 1}
            onDelegate={onDelegate}
          />
        ))}
      </div>

      {delegates.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <span className="text-4xl mb-4 block">👥</span>
          <p>대리인을 찾을 수 없습니다</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREASURY OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

export function TreasuryOverview() {
  const [assets, setAssets] = useState<TreasuryAsset[]>([]);
  const [totalValue, setTotalValue] = useState({ totalKRW: 0, totalUSD: 0 });

  useEffect(() => {
    setAssets(DAOGovernance.getTreasuryAssets());
    setTotalValue(DAOGovernance.getTreasuryTotal());
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl
              flex items-center justify-center">
              <span className="text-xl">🏦</span>
            </div>
            <div>
              <h3 className="font-bold text-white">DAO 재무</h3>
              <p className="text-xs text-neutral-400">Treasury</p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Value */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <p className="text-sm text-neutral-400 mb-1">총 자산 가치</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            ₩{(totalValue.totalKRW / 100000000).toFixed(2)}억
          </span>
          <span className="text-neutral-500 text-sm">
            (${totalValue.totalUSD.toLocaleString()})
          </span>
        </div>
      </div>

      {/* Asset Distribution */}
      <div className="p-5">
        <h4 className="text-sm font-medium text-neutral-400 mb-4">자산 분포</h4>

        {/* Pie Chart Visual */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let cumulativePercent = 0;
                return assets.map((asset, index) => {
                  const percent = asset.percentage;
                  const startAngle = cumulativePercent * 3.6;
                  cumulativePercent += percent;
                  const endAngle = cumulativePercent * 3.6;

                  const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#6b7280'];

                  const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                  const largeArcFlag = percent > 50 ? 1 : 0;

                  return (
                    <path
                      key={asset.id}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={colors[index % colors.length]}
                      className="opacity-80 hover:opacity-100 transition-opacity"
                    />
                  );
                });
              })()}
            </svg>
          </div>

          <div className="flex-1 space-y-2">
            {assets.slice(0, 4).map((asset, index) => {
              const colors = ['bg-amber-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500'];
              return (
                <div key={asset.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                  <span className="text-sm text-neutral-300">{asset.symbol}</span>
                  <span className="text-xs text-neutral-500 ml-auto">{asset.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asset List */}
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 bg-neutral-800 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{asset.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{asset.name}</p>
                  <p className="text-xs text-neutral-400">
                    {asset.balance.toLocaleString()} {asset.symbol}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  ₩{(asset.valueKRW / 100000000).toFixed(2)}억
                </p>
                <p className="text-xs text-neutral-400">{asset.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOVERNANCE STATS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function GovernanceStatsWidget() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);

  useEffect(() => {
    setStats(DAOGovernance.getGovernanceStats());
  }, []);

  if (!stats) return null;

  const statItems = [
    { label: '총 제안', value: stats.totalProposals, icon: '📜', color: 'violet' },
    { label: '활성 투표', value: stats.activeProposals, icon: '🗳️', color: 'emerald' },
    { label: '통과된 제안', value: stats.passedProposals, icon: '✅', color: 'blue' },
    { label: '참여 투표자', value: stats.uniqueVoters, icon: '👥', color: 'amber' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl
          flex items-center justify-center">
          <span className="text-xl">🏛️</span>
        </div>
        <div>
          <h3 className="font-bold text-white">거버넌스 현황</h3>
          <p className="text-xs text-neutral-400">Governance Stats</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-neutral-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs text-neutral-400">{item.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Participation Rate */}
      <div className="mt-4 p-4 bg-neutral-800 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-neutral-400">평균 참여율</span>
          <span className="text-lg font-bold text-emerald-400">{stats.averageParticipation}%</span>
        </div>
        <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.averageParticipation}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </div>
      </div>

      {/* Total Delegated */}
      <div className="mt-4 flex items-center justify-between p-4 bg-violet-500/10 rounded-xl">
        <span className="text-sm text-neutral-400">총 위임량</span>
        <span className="text-lg font-bold text-violet-400">
          {(stats.totalDelegated / 1000000).toFixed(1)}M KAUS
        </span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PROPOSAL FORM
// ═══════════════════════════════════════════════════════════════════════════════

interface CreateProposalFormProps {
  onSubmit?: (proposal: Proposal) => void;
  onClose?: () => void;
}

export function CreateProposalForm({ onSubmit, onClose }: CreateProposalFormProps) {
  const [title, setTitle] = useState('');
  const [titleKo, setTitleKo] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionKo, setDescriptionKo] = useState('');
  const [category, setCategory] = useState<ProposalCategory>('COMMUNITY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { id: ProposalCategory; label: string; icon: string }[] = [
    { id: 'TREASURY', label: '재무', icon: '💰' },
    { id: 'PROTOCOL', label: '프로토콜', icon: '⚙️' },
    { id: 'PARTNERSHIP', label: '파트너십', icon: '🤝' },
    { id: 'GOVERNANCE', label: '거버넌스', icon: '🏛️' },
    { id: 'COMMUNITY', label: '커뮤니티', icon: '👥' },
  ];

  const handleSubmit = async () => {
    if (!title || !titleKo || !description || !descriptionKo) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const proposal = DAOGovernance.createProposal(
      { title, titleKo, description, descriptionKo, category },
      { address: '0xuser...addr', name: 'User', avatar: '👤' }
    );

    onSubmit?.(proposal);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-3xl
          border border-neutral-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 sticky top-0 bg-neutral-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">새 제안 작성</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <span className="text-neutral-400">✕</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-3 block">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    category === cat.id
                      ? 'bg-violet-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title (Korean) */}
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-2 block">제목 (한국어)</label>
            <input
              type="text"
              value={titleKo}
              onChange={(e) => setTitleKo(e.target.value)}
              placeholder="제안 제목을 입력하세요"
              className="w-full px-4 py-3 bg-neutral-800 rounded-xl border border-neutral-700
                text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Title (English) */}
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-2 block">Title (English)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title"
              className="w-full px-4 py-3 bg-neutral-800 rounded-xl border border-neutral-700
                text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Description (Korean) */}
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-2 block">설명 (한국어)</label>
            <textarea
              value={descriptionKo}
              onChange={(e) => setDescriptionKo(e.target.value)}
              placeholder="제안에 대한 상세 설명을 입력하세요"
              rows={4}
              className="w-full px-4 py-3 bg-neutral-800 rounded-xl border border-neutral-700
                text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Description (English) */}
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-2 block">Description (English)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed proposal description"
              rows={4}
              className="w-full px-4 py-3 bg-neutral-800 rounded-xl border border-neutral-700
                text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Requirement Notice */}
          <div className="bg-amber-500/10 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-amber-400 font-medium text-sm">제안 생성 요건</p>
              <p className="text-neutral-400 text-xs mt-1">
                제안을 생성하려면 최소 {DAOGovernance.PROPOSAL_THRESHOLD.toLocaleString()} KAUS가 필요합니다.
                투표 기간은 {DAOGovernance.VOTING_PERIOD_DAYS}일이며, 정족수는 총 투표권의 {DAOGovernance.QUORUM_PERCENTAGE}%입니다.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!title || !titleKo || !description || !descriptionKo || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              title && titleKo && description && descriptionKo && !isSubmitting
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90'
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block"
              >
                ⏳
              </motion.span>
            ) : (
              '제안 제출'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE PROPOSALS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface ActiveProposalsWidgetProps {
  onSelectProposal?: (proposal: Proposal) => void;
}

export function ActiveProposalsWidget({ onSelectProposal }: ActiveProposalsWidgetProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    setProposals(DAOGovernance.getActiveProposals());
  }, []);

  if (proposals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center"
      >
        <span className="text-4xl mb-4 block">🗳️</span>
        <p className="text-neutral-400">현재 진행 중인 투표가 없습니다</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl
              flex items-center justify-center">
              <span className="text-xl">🗳️</span>
            </div>
            <div>
              <h3 className="font-bold text-white">진행 중인 투표</h3>
              <p className="text-xs text-neutral-400">{proposals.length}개 활성</p>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-3 h-3 bg-emerald-500 rounded-full"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onSelect={onSelectProposal}
            compact
          />
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP DELEGATES WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface TopDelegatesWidgetProps {
  onDelegate?: (delegate: Delegate) => void;
  limit?: number;
}

export function TopDelegatesWidget({ onDelegate, limit = 3 }: TopDelegatesWidgetProps) {
  const [delegates, setDelegates] = useState<Delegate[]>([]);

  useEffect(() => {
    setDelegates(DAOGovernance.getDelegates().slice(0, limit));
  }, [limit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl
            flex items-center justify-center">
            <span className="text-xl">👑</span>
          </div>
          <div>
            <h3 className="font-bold text-white">상위 대리인</h3>
            <p className="text-xs text-neutral-400">Top Delegates</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {delegates.map((delegate, index) => (
          <motion.div
            key={delegate.address}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl hover:bg-neutral-750
              transition-colors cursor-pointer"
            onClick={() => onDelegate?.(delegate)}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-neutral-700 rounded-xl flex items-center justify-center text-lg">
                {delegate.avatar}
              </div>
              <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center
                text-[10px] font-bold ${
                  index === 0 ? 'bg-amber-500 text-black' :
                  index === 1 ? 'bg-neutral-300 text-black' :
                  'bg-amber-700 text-white'
                }`}>
                {index + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{delegate.name}</p>
              <p className="text-xs text-neutral-400">
                {delegate.votingPower.toLocaleString()} KAUS
              </p>
            </div>

            <div className="text-xs text-violet-400">
              {delegate.delegators} 위임자
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
