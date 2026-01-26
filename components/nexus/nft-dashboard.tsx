'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT MARKETPLACE UI COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NFT,
  NFTCollection,
  NFTListing,
  NFTActivity,
  NFTRarity,
  NFTCategory,
  UserNFTStats,
  MarketplaceStats,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  getRarityLabel,
  getActivityLabel,
} from '@/lib/nft/nft-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const KAUS_TO_KRW = 120;

function formatKAUS(amount: number): string {
  return amount.toLocaleString();
}

function formatKRW(kaus: number): string {
  return (kaus * KAUS_TO_KRW).toLocaleString();
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY BADGE
// ═══════════════════════════════════════════════════════════════════════════════

interface RarityBadgeProps {
  rarity: NFTRarity;
  size?: 'sm' | 'md' | 'lg';
}

export function RarityBadge({ rarity, size = 'md' }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity];
  const label = getRarityLabel(rarity);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium bg-gradient-to-r ${config.gradient} text-white ${sizeClasses[size]}`}
    >
      {label.ko}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY BADGE
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryBadgeProps {
  category: NFTCategory;
  showLabel?: boolean;
}

export function CategoryBadge({ category, showLabel = true }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-sm">
      <span>{config.icon}</span>
      {showLabel && <span>{config.labelKo}</span>}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface NFTCardProps {
  nft: NFT;
  listing?: NFTListing;
  onClick?: () => void;
  compact?: boolean;
}

export function NFTCard({ nft, listing, onClick, compact = false }: NFTCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 cursor-pointer group ${
        compact ? '' : 'hover:border-neutral-700'
      }`}
    >
      {/* Image */}
      <div className={`relative bg-neutral-800 ${compact ? 'h-32' : 'h-48'} flex items-center justify-center`}>
        <span className={`${compact ? 'text-4xl' : 'text-6xl'}`}>{nft.image}</span>

        {/* Rarity glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-t ${RARITY_CONFIG[nft.rarity].gradient} opacity-10`} />

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className={isFavorited ? 'text-red-500' : 'text-white'}>{isFavorited ? '❤️' : '🤍'}</span>
        </button>

        {/* Rarity badge */}
        <div className="absolute top-3 left-3">
          <RarityBadge rarity={nft.rarity} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        {/* Collection */}
        <p className="text-xs text-neutral-500 mb-1">{nft.collectionName}</p>

        {/* Name */}
        <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'} line-clamp-1`}>
          {nft.nameKo}
        </h3>

        {!compact && (
          <>
            {/* Category and utility */}
            <div className="mt-2 flex items-center gap-2">
              <CategoryBadge category={nft.category} showLabel={false} />
              {nft.utility && (
                <span className="text-xs text-emerald-400">
                  {nft.utility.descriptionKo}
                </span>
              )}
            </div>
          </>
        )}

        {/* Price */}
        {listing && (
          <div className={`${compact ? 'mt-2' : 'mt-3'} pt-3 border-t border-neutral-800`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">현재 가격</p>
                <p className="font-bold text-white">
                  {formatKAUS(listing.price)} KAUS
                </p>
              </div>
              {listing.auctionType === 'AUCTION' && (
                <div className="text-right">
                  <p className="text-xs text-neutral-500">입찰 {listing.bidCount}건</p>
                  <p className="text-xs text-amber-400">경매 진행중</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {!listing && !compact && (
          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
            <span>👁️ {nft.viewCount.toLocaleString()}</span>
            <span>❤️ {nft.favoriteCount.toLocaleString()}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT GRID
// ═══════════════════════════════════════════════════════════════════════════════

interface NFTGridProps {
  nfts: NFT[];
  listings?: Map<string, NFTListing>;
  onNFTClick?: (nft: NFT) => void;
  compact?: boolean;
  emptyMessage?: string;
}

export function NFTGrid({ nfts, listings, onNFTClick, compact = false, emptyMessage = 'NFT가 없습니다' }: NFTGridProps) {
  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          listing={listings?.get(nft.id)}
          onClick={() => onNFTClick?.(nft)}
          compact={compact}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface CollectionCardProps {
  collection: NFTCollection;
  onClick?: () => void;
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  const progress = collection.totalSupply > 0
    ? (collection.mintedCount / collection.totalSupply) * 100
    : 100;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 cursor-pointer group hover:border-neutral-700"
    >
      {/* Banner */}
      <div className="h-24 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative">
        <span className="text-5xl">{collection.image}</span>
        {collection.isVerified && (
          <span className="absolute top-3 right-3 text-blue-400">✓</span>
        )}
        {collection.isFeatured && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-white">{collection.nameKo}</h3>
            <p className="text-xs text-neutral-500">by {collection.creatorName}</p>
          </div>
          <CategoryBadge category={collection.category} showLabel={false} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-neutral-500">바닥가</p>
            <p className="font-bold text-white">{formatKAUS(collection.floorPrice)} KAUS</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">24h 거래량</p>
            <p className="font-bold text-emerald-400">+{formatKAUS(collection.volume24h)}</p>
          </div>
        </div>

        {/* Supply progress */}
        {collection.totalSupply > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>민팅</span>
              <span>{collection.mintedCount.toLocaleString()} / {collection.totalSupply.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Owners */}
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
          <span>👥 {collection.ownerCount.toLocaleString()} 소유자</span>
          <span>📊 총 {(collection.volumeTotal / 1000000).toFixed(1)}M KAUS</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTION GRID
// ═══════════════════════════════════════════════════════════════════════════════

interface CollectionGridProps {
  collections: NFTCollection[];
  onCollectionClick?: (collection: NFTCollection) => void;
}

export function CollectionGrid({ collections, onCollectionClick }: CollectionGridProps) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">컬렉션이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onClick={() => onCollectionClick?.(collection)}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE LISTING CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface ListingCardProps {
  listing: NFTListing;
  onClick?: () => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const { nft } = listing;
  const isAuction = listing.auctionType === 'AUCTION';
  const timeLeft = listing.expiresAt
    ? Math.max(0, listing.expiresAt.getTime() - Date.now())
    : null;

  const formatTimeLeft = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}일 ${hours % 24}시간`;
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 cursor-pointer group hover:border-neutral-700"
    >
      {/* Image */}
      <div className="relative h-48 bg-neutral-800 flex items-center justify-center">
        <span className="text-6xl">{nft.image}</span>
        <div className={`absolute inset-0 bg-gradient-to-t ${RARITY_CONFIG[nft.rarity].gradient} opacity-10`} />

        {/* Auction badge */}
        {isAuction && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-amber-500/20 backdrop-blur rounded-full">
            <span className="text-amber-400 text-sm font-medium">🔨 경매</span>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <RarityBadge rarity={nft.rarity} size="sm" />
        </div>

        {/* Time left */}
        {timeLeft !== null && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">남은 시간</span>
              <span className="text-sm font-medium text-white">{formatTimeLeft(timeLeft)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-neutral-500 mb-1">{nft.collectionName}</p>
        <h3 className="font-semibold text-white line-clamp-1">{nft.nameKo}</h3>

        <div className="flex items-center gap-2 mt-2">
          <CategoryBadge category={nft.category} showLabel={false} />
          {nft.utility && (
            <span className="text-xs text-emerald-400 line-clamp-1">
              {nft.utility.descriptionKo}
            </span>
          )}
        </div>

        {/* Price section */}
        <div className="mt-4 pt-4 border-t border-neutral-800">
          {isAuction ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">현재 입찰가</span>
                <span className="font-bold text-white">{formatKAUS(listing.highestBid || listing.startPrice || 0)} KAUS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">입찰 수</span>
                <span className="text-sm text-amber-400">{listing.bidCount}건</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">가격</p>
                <p className="font-bold text-white">{formatKAUS(listing.price)} KAUS</p>
                <p className="text-xs text-neutral-500">≈ ₩{formatKRW(listing.price)}</p>
              </div>
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors">
                구매하기
              </button>
            </div>
          )}
        </div>

        {/* Seller */}
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span>판매자: {listing.sellerName}</span>
          <span>{formatTimeAgo(listing.listedAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LISTINGS GRID
// ═══════════════════════════════════════════════════════════════════════════════

interface ListingsGridProps {
  listings: NFTListing[];
  onListingClick?: (listing: NFTListing) => void;
}

export function ListingsGrid({ listings, onListingClick }: ListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">등록된 판매 목록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onClick={() => onListingClick?.(listing)}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY ITEM
// ═══════════════════════════════════════════════════════════════════════════════

interface ActivityItemProps {
  activity: NFTActivity;
  showNFT?: boolean;
}

export function ActivityItem({ activity, showNFT = true }: ActivityItemProps) {
  const label = getActivityLabel(activity.type);

  const getActivityColor = (type: NFTActivity['type']): string => {
    switch (type) {
      case 'SALE': return 'text-emerald-400';
      case 'MINT': return 'text-blue-400';
      case 'LIST': return 'text-amber-400';
      case 'BID': return 'text-purple-400';
      case 'TRANSFER': return 'text-cyan-400';
      case 'CANCEL': return 'text-red-400';
      case 'BURN': return 'text-orange-400';
      default: return 'text-neutral-400';
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-neutral-900 rounded-xl border border-neutral-800">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center ${getActivityColor(activity.type)}`}>
        <span className="text-lg">{label.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${getActivityColor(activity.type)}`}>{label.ko}</span>
          {showNFT && (
            <span className="text-neutral-400 truncate">NFT #{activity.nftId.slice(-3)}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <span>{activity.fromName}</span>
          {activity.to && (
            <>
              <span>→</span>
              <span>{activity.toName}</span>
            </>
          )}
        </div>
      </div>

      {/* Price and time */}
      <div className="text-right">
        {activity.price && (
          <p className="font-medium text-white">{formatKAUS(activity.price)} KAUS</p>
        )}
        <p className="text-xs text-neutral-500">{formatTimeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════════════════

interface ActivityFeedProps {
  activities: NFTActivity[];
  showNFT?: boolean;
  title?: string;
}

export function ActivityFeed({ activities, showNFT = true, title = '최근 활동' }: ActivityFeedProps) {
  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-center py-8 text-neutral-500">활동 내역이 없습니다</p>
        ) : (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} showNFT={showNFT} />
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE STATS OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

interface MarketplaceStatsOverviewProps {
  stats: MarketplaceStats;
}

export function MarketplaceStatsOverview({ stats }: MarketplaceStatsOverviewProps) {
  const statItems = [
    { label: '총 거래량', value: `${(stats.totalVolume / 1000000).toFixed(1)}M`, suffix: 'KAUS', icon: '💰' },
    { label: '24h 거래량', value: `${(stats.volume24h / 1000).toFixed(0)}K`, suffix: 'KAUS', change: '+12.5%', icon: '📈' },
    { label: '총 NFT', value: stats.totalNFTs.toLocaleString(), suffix: '개', icon: '🎨' },
    { label: '컬렉션', value: stats.totalCollections.toString(), suffix: '개', icon: '📦' },
    { label: '소유자', value: stats.totalOwners.toLocaleString(), suffix: '명', icon: '👥' },
    { label: '바닥가', value: formatKAUS(stats.floorPrice), suffix: 'KAUS', icon: '📊' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-neutral-900 rounded-xl p-4 border border-neutral-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <span>{item.icon}</span>
            <span className="text-xs text-neutral-500">{item.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{item.value}</span>
            <span className="text-sm text-neutral-400">{item.suffix}</span>
          </div>
          {item.change && (
            <span className="text-xs text-emerald-400">{item.change}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER NFT STATS
// ═══════════════════════════════════════════════════════════════════════════════

interface UserNFTStatsWidgetProps {
  stats: UserNFTStats;
}

export function UserNFTStatsWidget({ stats }: UserNFTStatsWidgetProps) {
  const categoryLabel = CATEGORY_CONFIG[stats.favoriteCategory];

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
      <h3 className="text-lg font-semibold text-white mb-4">내 NFT 통계</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-neutral-500">보유 NFT</p>
          <p className="text-2xl font-bold text-white">{stats.totalOwned}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">생성 NFT</p>
          <p className="text-2xl font-bold text-white">{stats.totalCreated}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">판매 완료</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.totalSold}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">총 거래량</p>
          <p className="text-2xl font-bold text-white">{formatKAUS(stats.totalVolume)}</p>
        </div>
      </div>

      {/* Favorite category */}
      <div className="mb-4 p-3 bg-neutral-800 rounded-xl">
        <p className="text-xs text-neutral-500 mb-1">선호 카테고리</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryLabel.icon}</span>
          <span className="font-medium text-white">{categoryLabel.labelKo}</span>
        </div>
      </div>

      {/* Rarity breakdown */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">희귀도별 분포</p>
        <div className="space-y-2">
          {(Object.entries(stats.rarityBreakdown) as [NFTRarity, number][])
            .filter(([_, count]) => count > 0)
            .map(([rarity, count]) => (
              <div key={rarity} className="flex items-center gap-2">
                <RarityBadge rarity={rarity} size="sm" />
                <span className="text-white font-medium">{count}개</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY FILTER
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryFilterProps {
  selected: NFTCategory | 'ALL';
  onChange: (category: NFTCategory | 'ALL') => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const categories: (NFTCategory | 'ALL')[] = ['ALL', 'ENERGY', 'AVATAR', 'BADGE', 'LAND', 'UTILITY', 'COLLECTIBLE'];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isAll = cat === 'ALL';
        const config = isAll ? null : CATEGORY_CONFIG[cat];
        const isSelected = selected === cat;

        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {isAll ? '전체' : `${config?.icon} ${config?.labelKo}`}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY FILTER
// ═══════════════════════════════════════════════════════════════════════════════

interface RarityFilterProps {
  selected: NFTRarity[];
  onChange: (rarities: NFTRarity[]) => void;
}

export function RarityFilter({ selected, onChange }: RarityFilterProps) {
  const rarities: NFTRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

  const toggleRarity = (rarity: NFTRarity) => {
    if (selected.includes(rarity)) {
      onChange(selected.filter(r => r !== rarity));
    } else {
      onChange([...selected, rarity]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {rarities.map((rarity) => {
        const isSelected = selected.includes(rarity);
        const config = RARITY_CONFIG[rarity];
        const label = getRarityLabel(rarity);

        return (
          <button
            key={rarity}
            onClick={() => toggleRarity(rarity)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? `bg-gradient-to-r ${config.gradient} text-white`
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {label.ko}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface NFTDetailModalProps {
  nft: NFT | null;
  listing?: NFTListing | null;
  onClose: () => void;
  activities?: NFTActivity[];
}

export function NFTDetailModal({ nft, listing, onClose, activities = [] }: NFTDetailModalProps) {
  if (!nft) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-800"
        >
          {/* Header */}
          <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{nft.nameKo}</h2>
            <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full">
              ✕
            </button>
          </div>

          {/* Image */}
          <div className={`h-64 bg-neutral-800 flex items-center justify-center relative`}>
            <span className="text-8xl">{nft.image}</span>
            <div className={`absolute inset-0 bg-gradient-to-t ${RARITY_CONFIG[nft.rarity].gradient} opacity-10`} />
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-3">
              <RarityBadge rarity={nft.rarity} />
              <CategoryBadge category={nft.category} />
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-2">설명</h4>
              <p className="text-white">{nft.descriptionKo}</p>
            </div>

            {/* Utility */}
            {nft.utility && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <h4 className="text-sm font-medium text-emerald-400 mb-1">특수 효과</h4>
                <p className="text-white">{nft.utility.descriptionKo}</p>
              </div>
            )}

            {/* Attributes */}
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-2">속성</h4>
              <div className="grid grid-cols-2 gap-2">
                {nft.attributes.map((attr, idx) => (
                  <div key={idx} className="p-3 bg-neutral-800 rounded-lg">
                    <p className="text-xs text-neutral-500">{attr.trait_type}</p>
                    <p className="font-medium text-white">
                      {attr.value}
                      {attr.display_type === 'boost_percentage' && '%'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ownership */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500">소유자</p>
                <p className="font-medium text-white">{nft.ownerName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">크리에이터</p>
                <p className="font-medium text-white">{nft.creatorName}</p>
              </div>
            </div>

            {/* Price/Buy */}
            {listing && (
              <div className="p-4 bg-neutral-800 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-neutral-400">현재 가격</p>
                    <p className="text-2xl font-bold text-white">{formatKAUS(listing.price)} KAUS</p>
                    <p className="text-sm text-neutral-500">≈ ₩{formatKRW(listing.price)}</p>
                  </div>
                  {listing.auctionType === 'AUCTION' && (
                    <div className="text-right">
                      <p className="text-sm text-amber-400">🔨 경매 진행중</p>
                      <p className="text-sm text-neutral-400">{listing.bidCount}건 입찰</p>
                    </div>
                  )}
                </div>
                <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">
                  {listing.auctionType === 'AUCTION' ? '입찰하기' : '지금 구매'}
                </button>
              </div>
            )}

            {/* Activity */}
            {activities.length > 0 && (
              <ActivityFeed activities={activities} showNFT={false} title="거래 내역" />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRENDING COLLECTIONS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface TrendingCollectionsProps {
  collections: NFTCollection[];
  onCollectionClick?: (collection: NFTCollection) => void;
}

export function TrendingCollections({ collections, onCollectionClick }: TrendingCollectionsProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
      <h3 className="text-lg font-semibold text-white mb-4">🔥 트렌딩 컬렉션</h3>
      <div className="space-y-3">
        {collections.map((collection, idx) => (
          <motion.div
            key={collection.id}
            whileHover={{ x: 4 }}
            onClick={() => onCollectionClick?.(collection)}
            className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-750"
          >
            <span className="w-6 text-neutral-500 font-medium">{idx + 1}</span>
            <span className="text-3xl">{collection.image}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{collection.nameKo}</p>
              <p className="text-xs text-neutral-500">바닥가 {formatKAUS(collection.floorPrice)} KAUS</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-emerald-400">+{formatKAUS(collection.volume24h)}</p>
              <p className="text-xs text-neutral-500">24h</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER GALLERY
// ═══════════════════════════════════════════════════════════════════════════════

interface UserGalleryProps {
  nfts: NFT[];
  stats: UserNFTStats;
  onNFTClick?: (nft: NFT) => void;
}

export function UserGallery({ nfts, stats, onNFTClick }: UserGalleryProps) {
  const [activeTab, setActiveTab] = useState<'owned' | 'created' | 'favorited'>('owned');
  const [categoryFilter, setCategoryFilter] = useState<NFTCategory | 'ALL'>('ALL');

  const filteredNFTs = nfts.filter(nft =>
    categoryFilter === 'ALL' || nft.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <p className="text-xs text-neutral-500">보유</p>
          <p className="text-2xl font-bold text-white">{stats.totalOwned}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <p className="text-xs text-neutral-500">생성</p>
          <p className="text-2xl font-bold text-white">{stats.totalCreated}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <p className="text-xs text-neutral-500">판매</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.totalSold}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <p className="text-xs text-neutral-500">거래량</p>
          <p className="text-2xl font-bold text-white">{(stats.totalVolume / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        {[
          { id: 'owned', label: '보유 중', count: stats.totalOwned },
          { id: 'created', label: '생성', count: stats.totalCreated },
          { id: 'favorited', label: '즐겨찾기', count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Category filter */}
      <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />

      {/* NFT Grid */}
      <NFTGrid nfts={filteredNFTs} onNFTClick={onNFTClick} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUCTIONS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface AuctionsWidgetProps {
  auctions: NFTListing[];
  onAuctionClick?: (auction: NFTListing) => void;
}

export function AuctionsWidget({ auctions, onAuctionClick }: AuctionsWidgetProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
      <h3 className="text-lg font-semibold text-white mb-4">🔨 진행 중인 경매</h3>

      {auctions.length === 0 ? (
        <p className="text-center py-8 text-neutral-500">진행 중인 경매가 없습니다</p>
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <motion.div
              key={auction.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => onAuctionClick?.(auction)}
              className="flex items-center gap-4 p-4 bg-neutral-800 rounded-xl cursor-pointer"
            >
              <div className="w-16 h-16 bg-neutral-700 rounded-lg flex items-center justify-center">
                <span className="text-3xl">{auction.nft.image}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{auction.nft.nameKo}</p>
                <p className="text-xs text-neutral-500">{auction.nft.collectionName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <RarityBadge rarity={auction.nft.rarity} size="sm" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">현재 입찰가</p>
                <p className="font-bold text-amber-400">
                  {formatKAUS(auction.highestBid || auction.startPrice || 0)} KAUS
                </p>
                <p className="text-xs text-neutral-500">{auction.bidCount}건 입찰</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
