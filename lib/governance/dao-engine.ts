/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 53: DAO GOVERNANCE & VOTING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Proposal creation and management
 * - Token-weighted voting system
 * - Delegation mechanism
 * - Execution queue with timelock
 * - Treasury management proposals
 * - Governance analytics
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ProposalStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED';
export type ProposalCategory = 'TREASURY' | 'PROTOCOL' | 'PARTNERSHIP' | 'GOVERNANCE' | 'COMMUNITY' | 'EMERGENCY';
export type VoteOption = 'FOR' | 'AGAINST' | 'ABSTAIN';

export interface Proposal {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  category: ProposalCategory;
  status: ProposalStatus;
  proposer: {
    address: string;
    name: string;
    avatar: string;
  };
  votingPower: {
    for: number;
    against: number;
    abstain: number;
    total: number;
    quorum: number;
    quorumReached: boolean;
  };
  votes: Vote[];
  timeline: {
    created: Date;
    votingStart: Date;
    votingEnd: Date;
    executionDelay?: number; // hours
    executed?: Date;
  };
  actions?: ProposalAction[];
  discussionUrl?: string;
  snapshotBlock?: number;
}

export interface Vote {
  id: string;
  voter: string;
  voterName: string;
  option: VoteOption;
  votingPower: number;
  reason?: string;
  timestamp: Date;
  delegatedFrom?: string[];
}

export interface ProposalAction {
  id: string;
  type: 'TRANSFER' | 'PARAMETER_CHANGE' | 'CONTRACT_CALL' | 'MINT' | 'BURN';
  target: string;
  value?: number;
  data?: string;
  description: string;
}

export interface Delegate {
  address: string;
  name: string;
  avatar: string;
  bio: string;
  votingPower: number;
  delegators: number;
  proposalsCreated: number;
  votesParticipated: number;
  votingRecord: {
    for: number;
    against: number;
    abstain: number;
  };
  isVerified: boolean;
  socialLinks?: {
    twitter?: string;
    discord?: string;
  };
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  rejectedProposals: number;
  totalVotes: number;
  uniqueVoters: number;
  averageParticipation: number;
  treasuryBalance: number;
  totalDelegated: number;
  topDelegates: Delegate[];
}

export interface UserGovernanceProfile {
  address: string;
  votingPower: number;
  delegatedPower: number;
  totalPower: number;
  delegatedTo?: string;
  delegators: string[];
  proposalsCreated: number;
  votesCount: number;
  participationRate: number;
}

export interface TreasuryAsset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  balance: number;
  valueKRW: number;
  percentage: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORY_INFO: Record<ProposalCategory, { name: string; nameKo: string; icon: string; color: string }> = {
  TREASURY: { name: 'Treasury', nameKo: '재무', icon: '💰', color: 'amber' },
  PROTOCOL: { name: 'Protocol', nameKo: '프로토콜', icon: '⚙️', color: 'blue' },
  PARTNERSHIP: { name: 'Partnership', nameKo: '파트너십', icon: '🤝', color: 'purple' },
  GOVERNANCE: { name: 'Governance', nameKo: '거버넌스', icon: '🏛️', color: 'emerald' },
  COMMUNITY: { name: 'Community', nameKo: '커뮤니티', icon: '👥', color: 'cyan' },
  EMERGENCY: { name: 'Emergency', nameKo: '긴급', icon: '🚨', color: 'red' },
};

const QUORUM_PERCENTAGE = 10; // 10% of total voting power
const PROPOSAL_THRESHOLD = 1000; // 1000 KAUS to create proposal
const VOTING_PERIOD_DAYS = 7;
const EXECUTION_DELAY_HOURS = 48;

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'PROP-001',
    title: 'Increase Staking Rewards APY',
    titleKo: '스테이킹 보상 APY 인상',
    description: 'Proposal to increase the base staking APY from 15% to 20% to attract more stakers and improve network security.',
    descriptionKo: '네트워크 보안 강화와 스테이커 유치를 위해 기본 스테이킹 APY를 15%에서 20%로 인상하는 제안입니다.',
    category: 'PROTOCOL',
    status: 'ACTIVE',
    proposer: {
      address: '0x1234...5678',
      name: 'SovereignDAO',
      avatar: '👑',
    },
    votingPower: {
      for: 2500000,
      against: 800000,
      abstain: 200000,
      total: 3500000,
      quorum: 1000000,
      quorumReached: true,
    },
    votes: [],
    timeline: {
      created: new Date(Date.now() - 86400000 * 3),
      votingStart: new Date(Date.now() - 86400000 * 2),
      votingEnd: new Date(Date.now() + 86400000 * 5),
    },
    discussionUrl: 'https://forum.fieldnine.io/proposals/001',
    snapshotBlock: 18500000,
  },
  {
    id: 'PROP-002',
    title: 'Treasury Allocation for Marketing',
    titleKo: '마케팅을 위한 재무 할당',
    description: 'Allocate 500,000 KAUS from treasury for Q1 2026 marketing campaigns including influencer partnerships and community events.',
    descriptionKo: '2026년 1분기 마케팅 캠페인(인플루언서 파트너십, 커뮤니티 이벤트 포함)을 위해 재무에서 500,000 KAUS를 할당합니다.',
    category: 'TREASURY',
    status: 'PASSED',
    proposer: {
      address: '0xabcd...efgh',
      name: 'MarketingDAO',
      avatar: '📢',
    },
    votingPower: {
      for: 4200000,
      against: 300000,
      abstain: 500000,
      total: 5000000,
      quorum: 1000000,
      quorumReached: true,
    },
    votes: [],
    timeline: {
      created: new Date(Date.now() - 86400000 * 14),
      votingStart: new Date(Date.now() - 86400000 * 12),
      votingEnd: new Date(Date.now() - 86400000 * 5),
      executionDelay: 48,
    },
    actions: [
      {
        id: 'action-1',
        type: 'TRANSFER',
        target: 'Marketing Wallet',
        value: 500000,
        description: 'Transfer 500,000 KAUS to marketing wallet',
      },
    ],
  },
  {
    id: 'PROP-003',
    title: 'Partnership with Solar Energy Provider',
    titleKo: '태양광 에너지 공급업체와 파트너십',
    description: 'Establish strategic partnership with SunPower Corp for renewable energy certificate integration.',
    descriptionKo: '재생에너지 인증서 통합을 위해 SunPower Corp와 전략적 파트너십을 체결합니다.',
    category: 'PARTNERSHIP',
    status: 'PENDING',
    proposer: {
      address: '0x9876...5432',
      name: 'EnergyCouncil',
      avatar: '☀️',
    },
    votingPower: {
      for: 0,
      against: 0,
      abstain: 0,
      total: 0,
      quorum: 1000000,
      quorumReached: false,
    },
    votes: [],
    timeline: {
      created: new Date(),
      votingStart: new Date(Date.now() + 86400000),
      votingEnd: new Date(Date.now() + 86400000 * 8),
    },
  },
  {
    id: 'PROP-004',
    title: 'Reduce Proposal Threshold',
    titleKo: '제안 임계값 인하',
    description: 'Lower the proposal creation threshold from 1000 KAUS to 500 KAUS to encourage more community participation.',
    descriptionKo: '커뮤니티 참여를 장려하기 위해 제안 생성 임계값을 1000 KAUS에서 500 KAUS로 낮춥니다.',
    category: 'GOVERNANCE',
    status: 'REJECTED',
    proposer: {
      address: '0x5555...6666',
      name: 'CommunityVoice',
      avatar: '🗣️',
    },
    votingPower: {
      for: 1200000,
      against: 2800000,
      abstain: 500000,
      total: 4500000,
      quorum: 1000000,
      quorumReached: true,
    },
    votes: [],
    timeline: {
      created: new Date(Date.now() - 86400000 * 21),
      votingStart: new Date(Date.now() - 86400000 * 19),
      votingEnd: new Date(Date.now() - 86400000 * 12),
    },
  },
];

const MOCK_DELEGATES: Delegate[] = [
  {
    address: '0x1234...5678',
    name: 'SovereignDAO',
    avatar: '👑',
    bio: 'Core contributor and long-term KAUS holder. Focused on sustainable growth.',
    votingPower: 2500000,
    delegators: 145,
    proposalsCreated: 12,
    votesParticipated: 47,
    votingRecord: { for: 35, against: 8, abstain: 4 },
    isVerified: true,
    socialLinks: { twitter: '@SovereignDAO' },
  },
  {
    address: '0xabcd...efgh',
    name: 'EnergyCouncil',
    avatar: '⚡',
    bio: 'Renewable energy advocate. Building bridges between DeFi and green energy.',
    votingPower: 1800000,
    delegators: 98,
    proposalsCreated: 8,
    votesParticipated: 42,
    votingRecord: { for: 30, against: 10, abstain: 2 },
    isVerified: true,
    socialLinks: { twitter: '@EnergyDAO', discord: 'EnergyCouncil#1234' },
  },
  {
    address: '0x9876...5432',
    name: 'CommunityFirst',
    avatar: '🌟',
    bio: 'Community-driven governance. Every voice matters.',
    votingPower: 1200000,
    delegators: 234,
    proposalsCreated: 5,
    votesParticipated: 51,
    votingRecord: { for: 40, against: 5, abstain: 6 },
    isVerified: true,
  },
  {
    address: '0x7777...8888',
    name: 'TechBuilder',
    avatar: '🔧',
    bio: 'Protocol developer. Building the future of energy trading.',
    votingPower: 950000,
    delegators: 67,
    proposalsCreated: 15,
    votesParticipated: 38,
    votingRecord: { for: 25, against: 8, abstain: 5 },
    isVerified: false,
  },
];

const MOCK_TREASURY: TreasuryAsset[] = [
  { id: 'KAUS', name: 'KAUS', symbol: 'KAUS', icon: '👑', balance: 5000000, valueKRW: 600000000, percentage: 45 },
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', icon: '💵', balance: 2000000, valueKRW: 280000000, percentage: 21 },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', icon: '⟠', balance: 500, valueKRW: 200000000, percentage: 15 },
  { id: 'ENERGY', name: 'Energy Credit', symbol: 'ENERGY', icon: '⚡', balance: 1000000, valueKRW: 85000000, percentage: 6.4 },
  { id: 'CARBON', name: 'Carbon Credit', symbol: 'CARBON', icon: '🌿', balance: 2000000, valueKRW: 64000000, percentage: 4.8 },
  { id: 'OTHER', name: 'Other Assets', symbol: 'OTHER', icon: '📦', balance: 0, valueKRW: 104000000, percentage: 7.8 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PROPOSAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

let proposals = [...MOCK_PROPOSALS];

export function getProposals(filter?: { status?: ProposalStatus; category?: ProposalCategory }): Proposal[] {
  let result = [...proposals];

  if (filter?.status) {
    result = result.filter(p => p.status === filter.status);
  }
  if (filter?.category) {
    result = result.filter(p => p.category === filter.category);
  }

  return result.sort((a, b) => b.timeline.created.getTime() - a.timeline.created.getTime());
}

export function getProposal(id: string): Proposal | null {
  return proposals.find(p => p.id === id) || null;
}

export function getActiveProposals(): Proposal[] {
  return proposals.filter(p => p.status === 'ACTIVE');
}

export function createProposal(data: {
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  category: ProposalCategory;
  actions?: ProposalAction[];
}, proposer: { address: string; name: string; avatar: string }): Proposal {
  const now = new Date();
  const proposal: Proposal = {
    id: `PROP-${String(proposals.length + 1).padStart(3, '0')}`,
    ...data,
    status: 'PENDING',
    proposer,
    votingPower: {
      for: 0,
      against: 0,
      abstain: 0,
      total: 0,
      quorum: 1000000,
      quorumReached: false,
    },
    votes: [],
    timeline: {
      created: now,
      votingStart: new Date(now.getTime() + 86400000), // 1 day delay
      votingEnd: new Date(now.getTime() + 86400000 * (VOTING_PERIOD_DAYS + 1)),
      executionDelay: EXECUTION_DELAY_HOURS,
    },
  };

  proposals.unshift(proposal);
  return proposal;
}

export function castVote(proposalId: string, voter: { address: string; name: string }, option: VoteOption, votingPower: number, reason?: string): Vote | null {
  const proposal = proposals.find(p => p.id === proposalId);
  if (!proposal || proposal.status !== 'ACTIVE') return null;

  // Check if already voted
  const existingVote = proposal.votes.find(v => v.voter === voter.address);
  if (existingVote) return null;

  const vote: Vote = {
    id: `VOTE-${Date.now()}`,
    voter: voter.address,
    voterName: voter.name,
    option,
    votingPower,
    reason,
    timestamp: new Date(),
  };

  proposal.votes.push(vote);

  // Update voting power
  proposal.votingPower[option.toLowerCase() as 'for' | 'against' | 'abstain'] += votingPower;
  proposal.votingPower.total += votingPower;
  proposal.votingPower.quorumReached = proposal.votingPower.total >= proposal.votingPower.quorum;

  return vote;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELEGATION
// ═══════════════════════════════════════════════════════════════════════════════

export function getDelegates(): Delegate[] {
  return [...MOCK_DELEGATES].sort((a, b) => b.votingPower - a.votingPower);
}

export function getDelegate(address: string): Delegate | null {
  return MOCK_DELEGATES.find(d => d.address === address) || null;
}

export function delegateVotes(fromAddress: string, toAddress: string, amount: number): boolean {
  // In real implementation, this would update blockchain state
  console.log(`Delegating ${amount} votes from ${fromAddress} to ${toAddress}`);
  return true;
}

export function undelegateVotes(fromAddress: string): boolean {
  console.log(`Undelegating votes from ${fromAddress}`);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOVERNANCE STATS
// ═══════════════════════════════════════════════════════════════════════════════

export function getGovernanceStats(): GovernanceStats {
  const totalProposals = proposals.length;
  const activeProposals = proposals.filter(p => p.status === 'ACTIVE').length;
  const passedProposals = proposals.filter(p => p.status === 'PASSED' || p.status === 'EXECUTED').length;
  const rejectedProposals = proposals.filter(p => p.status === 'REJECTED').length;

  return {
    totalProposals,
    activeProposals,
    passedProposals,
    rejectedProposals,
    totalVotes: 12500,
    uniqueVoters: 847,
    averageParticipation: 68.5,
    treasuryBalance: 1333000000, // KRW
    totalDelegated: 8500000, // KAUS
    topDelegates: MOCK_DELEGATES.slice(0, 3),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREASURY
// ═══════════════════════════════════════════════════════════════════════════════

export function getTreasuryAssets(): TreasuryAsset[] {
  return [...MOCK_TREASURY];
}

export function getTreasuryTotal(): { totalKRW: number; totalUSD: number } {
  const totalKRW = MOCK_TREASURY.reduce((sum, asset) => sum + asset.valueKRW, 0);
  return {
    totalKRW,
    totalUSD: Math.round(totalKRW / 1400), // Approximate USD conversion
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER GOVERNANCE PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserGovernanceProfile(address: string): UserGovernanceProfile {
  return {
    address,
    votingPower: 5000,
    delegatedPower: 2500,
    totalPower: 7500,
    delegatedTo: undefined,
    delegators: ['0x1111...2222', '0x3333...4444'],
    proposalsCreated: 2,
    votesCount: 15,
    participationRate: 75,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function getTimeRemaining(endDate: Date): { days: number; hours: number; minutes: number; expired: boolean } {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, expired: false };
}

export function calculateVotePercentage(proposal: Proposal): { for: number; against: number; abstain: number } {
  const total = proposal.votingPower.total;
  if (total === 0) return { for: 0, against: 0, abstain: 0 };

  return {
    for: Math.round((proposal.votingPower.for / total) * 1000) / 10,
    against: Math.round((proposal.votingPower.against / total) * 1000) / 10,
    abstain: Math.round((proposal.votingPower.abstain / total) * 1000) / 10,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const DAOGovernance = {
  getProposals,
  getProposal,
  getActiveProposals,
  createProposal,
  castVote,
  getDelegates,
  getDelegate,
  delegateVotes,
  undelegateVotes,
  getGovernanceStats,
  getTreasuryAssets,
  getTreasuryTotal,
  getUserGovernanceProfile,
  getTimeRemaining,
  calculateVotePercentage,
  CATEGORY_INFO,
  QUORUM_PERCENTAGE,
  PROPOSAL_THRESHOLD,
  VOTING_PERIOD_DAYS,
};

export default DAOGovernance;
