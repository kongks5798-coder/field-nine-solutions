'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 53: DAO GOVERNANCE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * On-chain governance with token-weighted voting
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import {
  ProposalList,
  ProposalCard,
  VotingPanel,
  DelegatesList,
  TreasuryOverview,
  GovernanceStatsWidget,
  CreateProposalForm,
  ActiveProposalsWidget,
  TopDelegatesWidget,
} from '@/components/nexus/governance-dashboard';
import { DAOGovernance, type Proposal, type Delegate, type VoteOption } from '@/lib/governance/dao-engine';

type GovernanceView = 'overview' | 'proposals' | 'delegates' | 'treasury';

export default function GovernancePage() {
  const [activeView, setActiveView] = useState<GovernanceView>('overview');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showVotingPanel, setShowVotingPanel] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const views = [
    { id: 'overview', label: '개요', icon: '🏛️' },
    { id: 'proposals', label: '제안', icon: '📜' },
    { id: 'delegates', label: '대리인', icon: '👥' },
    { id: 'treasury', label: '재무', icon: '💰' },
  ];

  const handleSelectProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    if (proposal.status === 'ACTIVE') {
      setShowVotingPanel(true);
    }
  };

  const handleVote = (option: VoteOption, reason?: string) => {
    if (selectedProposal) {
      DAOGovernance.castVote(
        selectedProposal.id,
        { address: '0xuser...addr', name: 'User' },
        option,
        5000,
        reason
      );
      setShowVotingPanel(false);
      setSelectedProposal(null);
    }
  };

  const handleDelegate = (delegate: Delegate) => {
    // In real implementation, this would trigger wallet transaction
    console.log('Delegating to:', delegate.name);
  };

  const handleCreateProposal = (proposal: Proposal) => {
    setShowCreateForm(false);
    setActiveView('proposals');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="DAO Governance" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl
                    flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <span className="text-3xl">🏛️</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">DAO Governance</h1>
                    <p className="text-neutral-400 text-sm">탈중앙화 자율 조직</p>
                  </div>
                </div>

                {/* Create Proposal Button */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5
                    bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl
                    text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <span>✍️</span>
                  <span>새 제안</span>
                </button>
              </div>

              {/* Governance Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '활성 제안', value: DAOGovernance.getActiveProposals().length, icon: '🗳️', color: 'emerald' },
                  { label: '총 제안', value: DAOGovernance.getProposals().length, icon: '📜', color: 'violet' },
                  { label: '투표권', value: '7,500 KAUS', icon: '👑', color: 'amber' },
                  { label: '참여율', value: '75%', icon: '📊', color: 'blue' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-neutral-900 rounded-xl p-4 border border-neutral-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{stat.icon}</span>
                      <span className="text-xs text-neutral-400">{stat.label}</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* View Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as GovernanceView)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                    whitespace-nowrap transition-all ${
                    activeView === view.id
                      ? 'bg-violet-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <span>{view.icon}</span>
                  <span>{view.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {activeView === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="col-span-8 space-y-6">
                      <ActiveProposalsWidget onSelectProposal={handleSelectProposal} />
                      <ProposalList
                        filter={{ status: 'PASSED' }}
                        onSelectProposal={handleSelectProposal}
                        limit={4}
                      />
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-6">
                      <GovernanceStatsWidget />
                      <TopDelegatesWidget onDelegate={handleDelegate} />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <ActiveProposalsWidget onSelectProposal={handleSelectProposal} />
                    <GovernanceStatsWidget />
                    <TopDelegatesWidget onDelegate={handleDelegate} />
                  </div>
                </motion.div>
              )}

              {activeView === 'proposals' && (
                <motion.div
                  key="proposals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ProposalList onSelectProposal={handleSelectProposal} />
                </motion.div>
              )}

              {activeView === 'delegates' && (
                <motion.div
                  key="delegates"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* My Delegation Status */}
                  <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                    <h3 className="text-lg font-bold text-white mb-4">내 위임 현황</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-neutral-800 rounded-xl p-4">
                        <p className="text-xs text-neutral-400 mb-1">내 투표권</p>
                        <p className="text-xl font-bold text-white">5,000 KAUS</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-4">
                        <p className="text-xs text-neutral-400 mb-1">위임받은 투표권</p>
                        <p className="text-xl font-bold text-violet-400">2,500 KAUS</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-4">
                        <p className="text-xs text-neutral-400 mb-1">총 투표권</p>
                        <p className="text-xl font-bold text-emerald-400">7,500 KAUS</p>
                      </div>
                    </div>
                  </div>

                  <DelegatesList onDelegate={handleDelegate} />
                </motion.div>
              )}

              {activeView === 'treasury' && (
                <motion.div
                  key="treasury"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6">
                    <div className="col-span-7">
                      <TreasuryOverview />
                    </div>
                    <div className="col-span-5 space-y-6">
                      {/* Treasury Proposals */}
                      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                        <h3 className="text-lg font-bold text-white mb-4">재무 관련 제안</h3>
                        <ProposalList
                          filter={{ category: 'TREASURY' }}
                          onSelectProposal={handleSelectProposal}
                          limit={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <TreasuryOverview />
                    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                      <h3 className="text-lg font-bold text-white mb-4">재무 관련 제안</h3>
                      <ProposalList
                        filter={{ category: 'TREASURY' }}
                        onSelectProposal={handleSelectProposal}
                        limit={3}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800"
            >
              <p className="text-neutral-500 text-xs text-center">
                ⚠️ 거버넌스 참여는 KAUS 토큰 보유자에게 제공됩니다.
                모든 투표는 블록체인에 기록되며 변경할 수 없습니다.
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />

      {/* Voting Panel Modal */}
      <AnimatePresence>
        {showVotingPanel && selectedProposal && (
          <VotingPanel
            proposal={selectedProposal}
            onVote={handleVote}
            onClose={() => {
              setShowVotingPanel(false);
              setSelectedProposal(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Proposal Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateProposalForm
            onSubmit={handleCreateProposal}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
