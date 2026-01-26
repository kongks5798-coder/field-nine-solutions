'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT MARKETPLACE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NFTEngine,
  NFT,
  NFTCollection,
  NFTListing,
  NFTCategory,
  NFTRarity,
} from '@/lib/nft/nft-engine';
import {
  MarketplaceStatsOverview,
  CollectionGrid,
  NFTGrid,
  ListingsGrid,
  ActivityFeed,
  TrendingCollections,
  AuctionsWidget,
  UserNFTStatsWidget,
  UserGallery,
  CategoryFilter,
  RarityFilter,
  NFTDetailModal,
} from '@/components/nexus/nft-dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ViewType = 'marketplace' | 'collections' | 'my-nfts' | 'activity';

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION TABS
// ═══════════════════════════════════════════════════════════════════════════════

interface NavTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

function NavTabs({ activeView, onViewChange }: NavTabsProps) {
  const tabs: { id: ViewType; label: string; icon: string }[] = [
    { id: 'marketplace', label: '마켓플레이스', icon: '🛒' },
    { id: 'collections', label: '컬렉션', icon: '📦' },
    { id: 'my-nfts', label: '내 NFT', icon: '🎨' },
    { id: 'activity', label: '활동', icon: '📋' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-xl border border-neutral-800 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeView === tab.id
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function MarketplaceView() {
  const [categoryFilter, setCategoryFilter] = useState<NFTCategory | 'ALL'>('ALL');
  const [rarityFilter, setRarityFilter] = useState<NFTRarity[]>([]);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'recent'>('recent');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedListing, setSelectedListing] = useState<NFTListing | null>(null);

  const stats = NFTEngine.getMarketplaceStats();
  const allListings = NFTEngine.getActiveListings();
  const auctions = NFTEngine.getAuctions();
  const trendingCollections = NFTEngine.getTrendingCollections(5);

  const filteredListings = useMemo(() => {
    let listings = [...allListings];

    // Category filter
    if (categoryFilter !== 'ALL') {
      listings = listings.filter(l => l.nft.category === categoryFilter);
    }

    // Rarity filter
    if (rarityFilter.length > 0) {
      listings = listings.filter(l => rarityFilter.includes(l.nft.rarity));
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        listings.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        listings.sort((a, b) => b.price - a.price);
        break;
      case 'recent':
        listings.sort((a, b) => b.listedAt.getTime() - a.listedAt.getTime());
        break;
    }

    return listings;
  }, [allListings, categoryFilter, rarityFilter, sortBy]);

  const handleListingClick = (listing: NFTListing) => {
    setSelectedNFT(listing.nft);
    setSelectedListing(listing);
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <MarketplaceStatsOverview stats={stats} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">필터</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white"
              >
                <option value="recent">최신순</option>
                <option value="price-low">가격 낮은순</option>
                <option value="price-high">가격 높은순</option>
              </select>
            </div>
            <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
            <div>
              <p className="text-xs text-neutral-500 mb-2">희귀도</p>
              <RarityFilter selected={rarityFilter} onChange={setRarityFilter} />
            </div>
          </div>

          {/* Listings Grid */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              판매 중인 NFT ({filteredListings.length})
            </h3>
            <ListingsGrid
              listings={filteredListings}
              onListingClick={handleListingClick}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Auctions */}
          <AuctionsWidget
            auctions={auctions}
            onAuctionClick={handleListingClick}
          />

          {/* Trending */}
          <TrendingCollections collections={trendingCollections} />
        </div>
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          nft={selectedNFT}
          listing={selectedListing}
          onClose={() => {
            setSelectedNFT(null);
            setSelectedListing(null);
          }}
          activities={NFTEngine.getNFTActivity(selectedNFT.id)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTIONS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function CollectionsView() {
  const [categoryFilter, setCategoryFilter] = useState<NFTCategory | 'ALL'>('ALL');
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);

  const allCollections = NFTEngine.getAllCollections();
  const featuredCollections = NFTEngine.getFeaturedCollections();

  const filteredCollections = useMemo(() => {
    if (categoryFilter === 'ALL') return allCollections;
    return allCollections.filter(c => c.category === categoryFilter);
  }, [allCollections, categoryFilter]);

  if (selectedCollection) {
    const collectionNFTs = NFTEngine.getNFTsByCollection(selectedCollection.id);
    const collectionListings = NFTEngine.getListingsByCollection(selectedCollection.id);

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedCollection(null)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          ← 컬렉션 목록
        </button>

        {/* Collection Header */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
            <span className="text-7xl">{selectedCollection.image}</span>
          </div>

          {/* Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {selectedCollection.nameKo}
                  {selectedCollection.isVerified && <span className="text-blue-400">✓</span>}
                </h2>
                <p className="text-neutral-400">by {selectedCollection.creatorName}</p>
              </div>
              {selectedCollection.isFeatured && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full">
                  Featured
                </span>
              )}
            </div>

            <p className="text-neutral-300 mb-6">{selectedCollection.descriptionKo}</p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-neutral-500">바닥가</p>
                <p className="text-xl font-bold text-white">{selectedCollection.floorPrice.toLocaleString()} KAUS</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">총 거래량</p>
                <p className="text-xl font-bold text-white">{(selectedCollection.volumeTotal / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">24h 거래량</p>
                <p className="text-xl font-bold text-emerald-400">+{selectedCollection.volume24h.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">소유자</p>
                <p className="text-xl font-bold text-white">{selectedCollection.ownerCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Collection NFTs */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            NFT ({collectionNFTs.length})
          </h3>
          <NFTGrid nfts={collectionNFTs} />
        </div>

        {/* Active Listings */}
        {collectionListings.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              판매 중 ({collectionListings.length})
            </h3>
            <ListingsGrid listings={collectionListings} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">⭐ 추천 컬렉션</h3>
          <CollectionGrid
            collections={featuredCollections}
            onCollectionClick={setSelectedCollection}
          />
        </div>
      )}

      {/* All Collections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">전체 컬렉션</h3>
        </div>
        <div className="mb-4">
          <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
        </div>
        <CollectionGrid
          collections={filteredCollections}
          onCollectionClick={setSelectedCollection}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY NFTS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function MyNFTsView() {
  const userId = 'user-001'; // Mock user
  const userNFTs = NFTEngine.getUserNFTs(userId);
  const userStats = NFTEngine.getUserNFTStats(userId);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-2">
          <UserGallery
            nfts={userNFTs}
            stats={userStats}
            onNFTClick={setSelectedNFT}
          />
        </div>

        {/* Stats */}
        <div>
          <UserNFTStatsWidget stats={userStats} />
        </div>
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          nft={selectedNFT}
          onClose={() => setSelectedNFT(null)}
          activities={NFTEngine.getNFTActivity(selectedNFT.id)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityView() {
  const [filter, setFilter] = useState<'all' | 'sales' | 'listings' | 'bids'>('all');
  const recentActivity = NFTEngine.getRecentActivity(20);
  const recentSales = NFTEngine.getRecentSales(10);

  const filteredActivity = useMemo(() => {
    switch (filter) {
      case 'sales':
        return recentActivity.filter(a => a.type === 'SALE');
      case 'listings':
        return recentActivity.filter(a => a.type === 'LIST');
      case 'bids':
        return recentActivity.filter(a => a.type === 'BID');
      default:
        return recentActivity;
    }
  }, [recentActivity, filter]);

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: '전체' },
          { id: 'sales', label: '판매' },
          { id: 'listings', label: '등록' },
          { id: 'bids', label: '입찰' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
          <ActivityFeed activities={filteredActivity} title="최근 활동" />
        </div>

        {/* Recent Sales */}
        <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
          <h3 className="text-lg font-semibold text-white mb-4">💰 최근 판매</h3>
          <div className="space-y-4">
            {recentSales.map((sale, idx) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-3 bg-neutral-800 rounded-xl"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  💰
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">NFT #{sale.nftId.slice(-3)} 판매</p>
                  <p className="text-xs text-neutral-500">
                    {sale.fromName} → {sale.toName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{sale.price?.toLocaleString()} KAUS</p>
                  <p className="text-xs text-neutral-500">
                    {Math.floor((Date.now() - sale.timestamp.getTime()) / 3600000)}시간 전
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function NFTMarketplacePage() {
  const [activeView, setActiveView] = useState<ViewType>('marketplace');

  const renderView = () => {
    switch (activeView) {
      case 'marketplace':
        return <MarketplaceView />;
      case 'collections':
        return <CollectionsView />;
      case 'my-nfts':
        return <MyNFTsView />;
      case 'activity':
        return <ActivityView />;
      default:
        return <MarketplaceView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">NFT Marketplace</h1>
              <p className="text-sm text-neutral-400">에너지 NFT 거래소</p>
            </div>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors">
              NFT 민팅
            </button>
          </div>

          {/* Navigation */}
          <NavTabs activeView={activeView} onViewChange={setActiveView} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
