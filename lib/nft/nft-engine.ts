/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT MARKETPLACE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * - NFT Collections
 * - Marketplace listings
 * - Minting & Trading
 * - User Gallery
 * - Energy NFTs & Utility NFTs
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type NFTRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export type NFTCategory = 'ENERGY' | 'AVATAR' | 'BADGE' | 'LAND' | 'UTILITY' | 'COLLECTIBLE';
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'EXPIRED';
export type AuctionType = 'FIXED' | 'AUCTION' | 'DUTCH';

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
}

export interface NFT {
  id: string;
  tokenId: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  // Metadata
  category: NFTCategory;
  rarity: NFTRarity;
  attributes: NFTAttribute[];
  // Collection
  collectionId: string;
  collectionName: string;
  // Ownership
  owner: string;
  ownerName: string;
  creator: string;
  creatorName: string;
  royaltyPercent: number;
  // Stats
  mintedAt: Date;
  lastTransferAt?: Date;
  viewCount: number;
  favoriteCount: number;
  // Utility
  utility?: NFTUtility;
}

export interface NFTUtility {
  type: 'STAKING_BOOST' | 'FEE_DISCOUNT' | 'ACCESS_PASS' | 'ENERGY_CREDIT' | 'GOVERNANCE_POWER';
  value: number;
  description: string;
  descriptionKo: string;
  expiresAt?: Date;
}

export interface NFTCollection {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  image: string;
  bannerImage: string;
  creator: string;
  creatorName: string;
  // Stats
  totalSupply: number;
  mintedCount: number;
  ownerCount: number;
  floorPrice: number;
  volumeTotal: number;
  volume24h: number;
  // Settings
  royaltyPercent: number;
  category: NFTCategory;
  isVerified: boolean;
  isFeatured: boolean;
  // Dates
  createdAt: Date;
  mintStartAt?: Date;
  mintEndAt?: Date;
}

export interface NFTListing {
  id: string;
  nft: NFT;
  seller: string;
  sellerName: string;
  // Pricing
  price: number;
  currency: 'KAUS' | 'KRW';
  auctionType: AuctionType;
  // Auction details (if applicable)
  startPrice?: number;
  endPrice?: number;
  highestBid?: number;
  highestBidder?: string;
  bidCount?: number;
  // Status
  status: ListingStatus;
  listedAt: Date;
  expiresAt?: Date;
  soldAt?: Date;
}

export interface NFTBid {
  id: string;
  listingId: string;
  bidder: string;
  bidderName: string;
  amount: number;
  currency: string;
  createdAt: Date;
  isWinning: boolean;
}

export interface NFTActivity {
  id: string;
  nftId: string;
  type: 'MINT' | 'LIST' | 'SALE' | 'TRANSFER' | 'BID' | 'CANCEL' | 'BURN';
  from: string;
  fromName: string;
  to?: string;
  toName?: string;
  price?: number;
  currency?: string;
  timestamp: Date;
  txHash?: string;
}

export interface UserNFTStats {
  totalOwned: number;
  totalCreated: number;
  totalSold: number;
  totalVolume: number;
  favoriteCategory: NFTCategory;
  rarityBreakdown: Record<NFTRarity, number>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const RARITY_CONFIG: Record<NFTRarity, { color: string; gradient: string; multiplier: number }> = {
  COMMON: { color: 'neutral', gradient: 'from-neutral-400 to-neutral-600', multiplier: 1 },
  UNCOMMON: { color: 'green', gradient: 'from-green-400 to-green-600', multiplier: 1.5 },
  RARE: { color: 'blue', gradient: 'from-blue-400 to-blue-600', multiplier: 2 },
  EPIC: { color: 'violet', gradient: 'from-violet-400 to-purple-600', multiplier: 3 },
  LEGENDARY: { color: 'amber', gradient: 'from-amber-400 to-orange-600', multiplier: 5 },
  MYTHIC: { color: 'rose', gradient: 'from-rose-400 to-pink-600', multiplier: 10 },
};

export const CATEGORY_CONFIG: Record<NFTCategory, { icon: string; label: string; labelKo: string }> = {
  ENERGY: { icon: '⚡', label: 'Energy', labelKo: '에너지' },
  AVATAR: { icon: '👤', label: 'Avatar', labelKo: '아바타' },
  BADGE: { icon: '🏅', label: 'Badge', labelKo: '뱃지' },
  LAND: { icon: '🏝️', label: 'Land', labelKo: '랜드' },
  UTILITY: { icon: '🔧', label: 'Utility', labelKo: '유틸리티' },
  COLLECTIBLE: { icon: '💎', label: 'Collectible', labelKo: '수집품' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_COLLECTIONS: NFTCollection[] = [
  {
    id: 'col-energy-genesis',
    name: 'Energy Genesis',
    nameKo: '에너지 제네시스',
    description: 'The first energy NFT collection on Field Nine',
    descriptionKo: 'Field Nine의 첫 번째 에너지 NFT 컬렉션',
    image: '⚡',
    bannerImage: '',
    creator: '0xFieldNine',
    creatorName: 'Field Nine',
    totalSupply: 10000,
    mintedCount: 4521,
    ownerCount: 2341,
    floorPrice: 500,
    volumeTotal: 15000000,
    volume24h: 250000,
    royaltyPercent: 5,
    category: 'ENERGY',
    isVerified: true,
    isFeatured: true,
    createdAt: new Date('2025-06-01'),
  },
  {
    id: 'col-power-guardians',
    name: 'Power Guardians',
    nameKo: '파워 가디언즈',
    description: 'Legendary guardians protecting the energy grid',
    descriptionKo: '에너지 그리드를 지키는 전설의 가디언',
    image: '🦸',
    bannerImage: '',
    creator: '0xArtist1',
    creatorName: 'CryptoArtist',
    totalSupply: 5000,
    mintedCount: 3200,
    ownerCount: 1890,
    floorPrice: 1200,
    volumeTotal: 8500000,
    volume24h: 180000,
    royaltyPercent: 7.5,
    category: 'AVATAR',
    isVerified: true,
    isFeatured: true,
    createdAt: new Date('2025-08-15'),
  },
  {
    id: 'col-solar-lands',
    name: 'Solar Lands',
    nameKo: '솔라 랜드',
    description: 'Virtual solar farm lands with real yield',
    descriptionKo: '실제 수익을 창출하는 가상 태양광 농장',
    image: '🌞',
    bannerImage: '',
    creator: '0xFieldNine',
    creatorName: 'Field Nine',
    totalSupply: 2500,
    mintedCount: 1800,
    ownerCount: 980,
    floorPrice: 5000,
    volumeTotal: 25000000,
    volume24h: 520000,
    royaltyPercent: 10,
    category: 'LAND',
    isVerified: true,
    isFeatured: true,
    createdAt: new Date('2025-10-01'),
  },
  {
    id: 'col-achievement-badges',
    name: 'Achievement Badges',
    nameKo: '업적 뱃지',
    description: 'Special badges earned through platform achievements',
    descriptionKo: '플랫폼 업적을 통해 획득하는 특별 뱃지',
    image: '🏆',
    bannerImage: '',
    creator: '0xFieldNine',
    creatorName: 'Field Nine',
    totalSupply: 0, // Unlimited
    mintedCount: 12500,
    ownerCount: 8900,
    floorPrice: 100,
    volumeTotal: 3500000,
    volume24h: 45000,
    royaltyPercent: 2.5,
    category: 'BADGE',
    isVerified: true,
    isFeatured: false,
    createdAt: new Date('2025-05-01'),
  },
];

const MOCK_NFTS: NFT[] = [
  {
    id: 'nft-001',
    tokenId: '1',
    name: 'Genesis Energy Cell #001',
    nameKo: '제네시스 에너지 셀 #001',
    description: 'The first energy NFT ever minted',
    descriptionKo: '최초로 민팅된 에너지 NFT',
    image: '⚡',
    category: 'ENERGY',
    rarity: 'LEGENDARY',
    attributes: [
      { trait_type: 'Power Output', value: 500, display_type: 'number' },
      { trait_type: 'Efficiency', value: 98, display_type: 'boost_percentage' },
      { trait_type: 'Type', value: 'Solar' },
      { trait_type: 'Generation', value: 'Genesis' },
    ],
    collectionId: 'col-energy-genesis',
    collectionName: 'Energy Genesis',
    owner: 'user-001',
    ownerName: 'Field Nine User',
    creator: '0xFieldNine',
    creatorName: 'Field Nine',
    royaltyPercent: 5,
    mintedAt: new Date('2025-06-01'),
    viewCount: 15420,
    favoriteCount: 892,
    utility: {
      type: 'STAKING_BOOST',
      value: 25,
      description: '25% staking APY boost',
      descriptionKo: '스테이킹 APY 25% 부스트',
    },
  },
  {
    id: 'nft-002',
    tokenId: '156',
    name: 'Thunder Guardian',
    nameKo: '썬더 가디언',
    description: 'A powerful guardian of the electric grid',
    descriptionKo: '전력망의 강력한 수호자',
    image: '🦸‍♂️',
    category: 'AVATAR',
    rarity: 'EPIC',
    attributes: [
      { trait_type: 'Power Level', value: 8500, display_type: 'number' },
      { trait_type: 'Element', value: 'Electric' },
      { trait_type: 'Class', value: 'Guardian' },
      { trait_type: 'Special Ability', value: 'Grid Shield' },
    ],
    collectionId: 'col-power-guardians',
    collectionName: 'Power Guardians',
    owner: 'user-001',
    ownerName: 'Field Nine User',
    creator: '0xArtist1',
    creatorName: 'CryptoArtist',
    royaltyPercent: 7.5,
    mintedAt: new Date('2025-08-20'),
    viewCount: 5230,
    favoriteCount: 421,
    utility: {
      type: 'FEE_DISCOUNT',
      value: 10,
      description: '10% trading fee discount',
      descriptionKo: '거래 수수료 10% 할인',
    },
  },
  {
    id: 'nft-003',
    tokenId: '42',
    name: 'Sunny Valley Farm',
    nameKo: '써니 밸리 농장',
    description: 'A prime solar farm location with high yield potential',
    descriptionKo: '높은 수익 잠재력을 가진 프리미엄 태양광 농장',
    image: '🌅',
    category: 'LAND',
    rarity: 'RARE',
    attributes: [
      { trait_type: 'Size', value: '2.5 Acres' },
      { trait_type: 'Daily Output', value: 150, display_type: 'number' },
      { trait_type: 'Location', value: 'Zone A' },
      { trait_type: 'Terrain', value: 'Valley' },
    ],
    collectionId: 'col-solar-lands',
    collectionName: 'Solar Lands',
    owner: 'user-002',
    ownerName: 'SolarKing',
    creator: '0xFieldNine',
    creatorName: 'Field Nine',
    royaltyPercent: 10,
    mintedAt: new Date('2025-10-05'),
    viewCount: 8920,
    favoriteCount: 567,
    utility: {
      type: 'ENERGY_CREDIT',
      value: 150,
      description: '150 KAUS daily energy credit',
      descriptionKo: '일일 150 KAUS 에너지 크레딧',
    },
  },
  {
    id: 'nft-004',
    tokenId: '789',
    name: 'Trading Master Badge',
    nameKo: '거래 마스터 뱃지',
    description: 'Awarded for completing 1000 trades',
    descriptionKo: '1000회 거래 달성 시 수여',
    image: '🏅',
    category: 'BADGE',
    rarity: 'EPIC',
    attributes: [
      { trait_type: 'Achievement', value: 'Trading Master' },
      { trait_type: 'Trades Completed', value: 1000, display_type: 'number' },
      { trait_type: 'Tier', value: 'Gold' },
    ],
    collectionId: 'col-achievement-badges',
    collectionName: 'Achievement Badges',
    owner: 'user-001',
    ownerName: 'Field Nine User',
    creator: '0xFieldNine',
    creatorName: 'Field Nine',
    royaltyPercent: 2.5,
    mintedAt: new Date('2025-12-15'),
    viewCount: 1250,
    favoriteCount: 89,
  },
  {
    id: 'nft-005',
    tokenId: '2048',
    name: 'Wind Turbine Alpha',
    nameKo: '윈드 터빈 알파',
    description: 'High-efficiency wind energy NFT',
    descriptionKo: '고효율 풍력 에너지 NFT',
    image: '🌀',
    category: 'ENERGY',
    rarity: 'RARE',
    attributes: [
      { trait_type: 'Power Output', value: 320, display_type: 'number' },
      { trait_type: 'Efficiency', value: 85, display_type: 'boost_percentage' },
      { trait_type: 'Type', value: 'Wind' },
      { trait_type: 'Generation', value: 'Alpha' },
    ],
    collectionId: 'col-energy-genesis',
    collectionName: 'Energy Genesis',
    owner: 'user-003',
    ownerName: 'WindMaster',
    creator: '0xFieldNine',
    creatorName: 'Field Nine',
    royaltyPercent: 5,
    mintedAt: new Date('2025-07-10'),
    viewCount: 3450,
    favoriteCount: 234,
    utility: {
      type: 'STAKING_BOOST',
      value: 15,
      description: '15% staking APY boost',
      descriptionKo: '스테이킹 APY 15% 부스트',
    },
  },
];

const MOCK_LISTINGS: NFTListing[] = [
  {
    id: 'listing-001',
    nft: MOCK_NFTS[2], // Sunny Valley Farm
    seller: 'user-002',
    sellerName: 'SolarKing',
    price: 8500,
    currency: 'KAUS',
    auctionType: 'FIXED',
    status: 'ACTIVE',
    listedAt: new Date(Date.now() - 86400000 * 2),
    expiresAt: new Date(Date.now() + 86400000 * 5),
  },
  {
    id: 'listing-002',
    nft: MOCK_NFTS[4], // Wind Turbine Alpha
    seller: 'user-003',
    sellerName: 'WindMaster',
    price: 2500,
    currency: 'KAUS',
    auctionType: 'AUCTION',
    startPrice: 1000,
    highestBid: 2500,
    highestBidder: 'user-005',
    bidCount: 12,
    status: 'ACTIVE',
    listedAt: new Date(Date.now() - 86400000 * 1),
    expiresAt: new Date(Date.now() + 86400000 * 2),
  },
];

const MOCK_ACTIVITIES: NFTActivity[] = [
  { id: 'act-1', nftId: 'nft-001', type: 'SALE', from: 'user-100', fromName: 'Collector1', to: 'user-001', toName: 'Field Nine User', price: 25000, currency: 'KAUS', timestamp: new Date(Date.now() - 3600000 * 2), txHash: '0xabc123' },
  { id: 'act-2', nftId: 'nft-002', type: 'MINT', from: '0xArtist1', fromName: 'CryptoArtist', to: 'user-001', toName: 'Field Nine User', timestamp: new Date(Date.now() - 86400000 * 30), txHash: '0xdef456' },
  { id: 'act-3', nftId: 'nft-003', type: 'LIST', from: 'user-002', fromName: 'SolarKing', price: 8500, currency: 'KAUS', timestamp: new Date(Date.now() - 86400000 * 2), txHash: '0xghi789' },
  { id: 'act-4', nftId: 'nft-004', type: 'MINT', from: '0xFieldNine', fromName: 'Field Nine', to: 'user-001', toName: 'Field Nine User', timestamp: new Date(Date.now() - 86400000 * 10), txHash: '0xjkl012' },
  { id: 'act-5', nftId: 'nft-005', type: 'BID', from: 'user-005', fromName: 'BidKing', price: 2500, currency: 'KAUS', timestamp: new Date(Date.now() - 3600000), txHash: '0xmno345' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getAllCollections(): NFTCollection[] {
  return MOCK_COLLECTIONS;
}

export function getFeaturedCollections(): NFTCollection[] {
  return MOCK_COLLECTIONS.filter(c => c.isFeatured);
}

export function getCollectionById(id: string): NFTCollection | null {
  return MOCK_COLLECTIONS.find(c => c.id === id) || null;
}

export function getCollectionsByCategory(category: NFTCategory): NFTCollection[] {
  return MOCK_COLLECTIONS.filter(c => c.category === category);
}

export function getTrendingCollections(limit: number = 5): NFTCollection[] {
  return [...MOCK_COLLECTIONS]
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getAllNFTs(): NFT[] {
  return MOCK_NFTS;
}

export function getNFTById(id: string): NFT | null {
  return MOCK_NFTS.find(n => n.id === id) || null;
}

export function getNFTsByCollection(collectionId: string): NFT[] {
  return MOCK_NFTS.filter(n => n.collectionId === collectionId);
}

export function getNFTsByOwner(owner: string): NFT[] {
  return MOCK_NFTS.filter(n => n.owner === owner);
}

export function getNFTsByRarity(rarity: NFTRarity): NFT[] {
  return MOCK_NFTS.filter(n => n.rarity === rarity);
}

export function getNFTsByCategory(category: NFTCategory): NFT[] {
  return MOCK_NFTS.filter(n => n.category === category);
}

export function getUserNFTs(userId: string): NFT[] {
  return MOCK_NFTS.filter(n => n.owner === userId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getActiveListings(): NFTListing[] {
  return MOCK_LISTINGS.filter(l => l.status === 'ACTIVE');
}

export function getListingById(id: string): NFTListing | null {
  return MOCK_LISTINGS.find(l => l.id === id) || null;
}

export function getListingsByCollection(collectionId: string): NFTListing[] {
  return MOCK_LISTINGS.filter(l => l.nft.collectionId === collectionId && l.status === 'ACTIVE');
}

export function getAuctions(): NFTListing[] {
  return MOCK_LISTINGS.filter(l => l.auctionType === 'AUCTION' && l.status === 'ACTIVE');
}

export function getRecentSales(limit: number = 10): NFTActivity[] {
  return MOCK_ACTIVITIES
    .filter(a => a.type === 'SALE')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getNFTActivity(nftId: string): NFTActivity[] {
  return MOCK_ACTIVITIES.filter(a => a.nftId === nftId);
}

export function getRecentActivity(limit: number = 20): NFTActivity[] {
  return [...MOCK_ACTIVITIES]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getUserActivity(userId: string): NFTActivity[] {
  return MOCK_ACTIVITIES.filter(a => a.from === userId || a.to === userId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER STATS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserNFTStats(userId: string): UserNFTStats {
  const owned = MOCK_NFTS.filter(n => n.owner === userId);
  const created = MOCK_NFTS.filter(n => n.creator === userId);
  const sales = MOCK_ACTIVITIES.filter(a => a.type === 'SALE' && a.from === userId);

  const rarityBreakdown: Record<NFTRarity, number> = {
    COMMON: 0,
    UNCOMMON: 0,
    RARE: 0,
    EPIC: 0,
    LEGENDARY: 0,
    MYTHIC: 0,
  };

  owned.forEach(n => {
    rarityBreakdown[n.rarity]++;
  });

  const categoryCount: Record<NFTCategory, number> = {
    ENERGY: 0,
    AVATAR: 0,
    BADGE: 0,
    LAND: 0,
    UTILITY: 0,
    COLLECTIBLE: 0,
  };

  owned.forEach(n => {
    categoryCount[n.category]++;
  });

  const favoriteCategory = (Object.entries(categoryCount) as [NFTCategory, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    totalOwned: owned.length,
    totalCreated: created.length,
    totalSold: sales.length,
    totalVolume: sales.reduce((sum, s) => sum + (s.price || 0), 0),
    favoriteCategory,
    rarityBreakdown,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE STATS
// ═══════════════════════════════════════════════════════════════════════════════

export interface MarketplaceStats {
  totalVolume: number;
  volume24h: number;
  totalNFTs: number;
  totalCollections: number;
  totalOwners: number;
  floorPrice: number;
  averagePrice: number;
}

export function getMarketplaceStats(): MarketplaceStats {
  const totalVolume = MOCK_COLLECTIONS.reduce((sum, c) => sum + c.volumeTotal, 0);
  const volume24h = MOCK_COLLECTIONS.reduce((sum, c) => sum + c.volume24h, 0);
  const totalNFTs = MOCK_COLLECTIONS.reduce((sum, c) => sum + c.mintedCount, 0);
  const totalOwners = new Set(MOCK_NFTS.map(n => n.owner)).size;
  const floorPrice = Math.min(...MOCK_COLLECTIONS.map(c => c.floorPrice));
  const averagePrice = totalVolume / totalNFTs;

  return {
    totalVolume,
    volume24h,
    totalNFTs,
    totalCollections: MOCK_COLLECTIONS.length,
    totalOwners,
    floorPrice,
    averagePrice,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getRarityLabel(rarity: NFTRarity): { en: string; ko: string } {
  const labels: Record<NFTRarity, { en: string; ko: string }> = {
    COMMON: { en: 'Common', ko: '일반' },
    UNCOMMON: { en: 'Uncommon', ko: '비일반' },
    RARE: { en: 'Rare', ko: '희귀' },
    EPIC: { en: 'Epic', ko: '에픽' },
    LEGENDARY: { en: 'Legendary', ko: '전설' },
    MYTHIC: { en: 'Mythic', ko: '신화' },
  };
  return labels[rarity];
}

export function getActivityLabel(type: NFTActivity['type']): { en: string; ko: string; icon: string } {
  const labels: Record<NFTActivity['type'], { en: string; ko: string; icon: string }> = {
    MINT: { en: 'Minted', ko: '민팅', icon: '🎨' },
    LIST: { en: 'Listed', ko: '등록', icon: '📋' },
    SALE: { en: 'Sold', ko: '판매', icon: '💰' },
    TRANSFER: { en: 'Transferred', ko: '전송', icon: '➡️' },
    BID: { en: 'Bid', ko: '입찰', icon: '🔨' },
    CANCEL: { en: 'Cancelled', ko: '취소', icon: '❌' },
    BURN: { en: 'Burned', ko: '소각', icon: '🔥' },
  };
  return labels[type];
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const NFTEngine = {
  // Collections
  getAllCollections,
  getFeaturedCollections,
  getCollectionById,
  getCollectionsByCategory,
  getTrendingCollections,
  // NFTs
  getAllNFTs,
  getNFTById,
  getNFTsByCollection,
  getNFTsByOwner,
  getNFTsByRarity,
  getNFTsByCategory,
  getUserNFTs,
  // Marketplace
  getActiveListings,
  getListingById,
  getListingsByCollection,
  getAuctions,
  getRecentSales,
  // Activity
  getNFTActivity,
  getRecentActivity,
  getUserActivity,
  // Stats
  getUserNFTStats,
  getMarketplaceStats,
  // Helpers
  getRarityLabel,
  getActivityLabel,
  // Config
  RARITY_CONFIG,
  CATEGORY_CONFIG,
};

export default NFTEngine;
