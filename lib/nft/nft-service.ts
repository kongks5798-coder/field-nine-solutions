/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT SERVICE (PRODUCTION)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Production-ready NFT service that connects to:
 * - Supabase database (via API routes)
 * - Alchemy blockchain data
 * - KAUS wallet integration
 */

import { AlchemyConnector, AlchemyNFT } from './alchemy-connector';
import type {
  NFT,
  NFTCollection,
  NFTListing,
  NFTActivity,
  NFTRarity,
  NFTCategory,
  UserNFTStats,
  MarketplaceStats,
} from './nft-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = '/api/nft';

interface APIResponse<T> {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: APIResponse<T> & T = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllCollections(options: {
  limit?: number;
  offset?: number;
  category?: NFTCategory;
} = {}): Promise<{
  collections: NFTCollection[];
  pagination: { limit: number; offset: number; total: number };
}> {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  if (options.category) params.append('category', options.category);

  const data = await fetchAPI<{
    collections: NFTCollection[];
    pagination: { limit: number; offset: number; total: number };
  }>(`/collections?${params.toString()}`);

  return {
    collections: data.collections,
    pagination: data.pagination,
  };
}

export async function getFeaturedCollections(): Promise<NFTCollection[]> {
  const data = await fetchAPI<{ collections: NFTCollection[] }>(
    '/collections?featured=true'
  );
  return data.collections;
}

export async function getTrendingCollections(limit: number = 5): Promise<NFTCollection[]> {
  const data = await fetchAPI<{ collections: NFTCollection[] }>(
    `/collections?trending=true&limit=${limit}`
  );
  return data.collections;
}

export async function getCollectionById(id: string): Promise<NFTCollection | null> {
  try {
    const data = await fetchAPI<{ collection: NFTCollection }>(
      `/collections/${id}`
    );
    return data.collection;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getNFTs(options: {
  owner?: string;
  collection?: string;
  category?: NFTCategory;
  rarity?: NFTRarity;
  forSale?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<{
  nfts: NFT[];
  pagination: { limit: number; offset: number; total: number };
}> {
  const params = new URLSearchParams();
  if (options.owner) params.append('owner', options.owner);
  if (options.collection) params.append('collection', options.collection);
  if (options.category) params.append('category', options.category);
  if (options.rarity) params.append('rarity', options.rarity);
  if (options.forSale) params.append('forSale', 'true');
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const data = await fetchAPI<{
    nfts: NFT[];
    pagination: { limit: number; offset: number; total: number };
  }>(`/items?${params.toString()}`);

  return {
    nfts: data.nfts,
    pagination: data.pagination,
  };
}

export async function getNFTById(id: string): Promise<NFT | null> {
  try {
    const data = await fetchAPI<{ nft: NFT }>(`/items?id=${id}`);
    return data.nft;
  } catch {
    return null;
  }
}

export async function getUserNFTs(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<NFT[]> {
  const result = await getNFTs({
    owner: userId,
    ...options,
  });
  return result.nfts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getActiveListings(options: {
  collection?: string;
  category?: NFTCategory;
  auctionType?: 'FIXED' | 'AUCTION' | 'DUTCH';
  sortBy?: 'price' | 'recent' | 'ending';
  limit?: number;
  offset?: number;
} = {}): Promise<{
  listings: NFTListing[];
  pagination: { limit: number; offset: number; total: number };
}> {
  const params = new URLSearchParams();
  if (options.collection) params.append('collection', options.collection);
  if (options.category) params.append('category', options.category);
  if (options.auctionType) params.append('auctionType', options.auctionType);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const data = await fetchAPI<{
    listings: NFTListing[];
    pagination: { limit: number; offset: number; total: number };
  }>(`/marketplace?${params.toString()}`);

  return {
    listings: data.listings,
    pagination: data.pagination,
  };
}

export async function getAuctions(): Promise<NFTListing[]> {
  const result = await getActiveListings({ auctionType: 'AUCTION' });
  return result.listings;
}

export async function createListing(params: {
  nftId: string;
  price: number;
  currency?: string;
  auctionType?: 'FIXED' | 'AUCTION' | 'DUTCH';
  minBidIncrement?: number;
  expiresAt?: string;
  // Dutch auction params
  startPrice?: number;
  endPrice?: number;
}): Promise<{ listingId: string }> {
  const data = await fetchAPI<{ listing: { id: string } }>('/marketplace', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return { listingId: data.listing.id };
}

export async function cancelListing(listingId: string): Promise<void> {
  await fetchAPI('/marketplace', {
    method: 'DELETE',
    body: JSON.stringify({ listingId }),
  });
}

export async function placeBid(params: {
  listingId: string;
  amount: number;
  currency?: string;
}): Promise<{ bidId: string }> {
  const data = await fetchAPI<{ bid: { id: string } }>('/marketplace', {
    method: 'POST',
    body: JSON.stringify({
      action: 'bid',
      ...params,
    }),
  });

  return { bidId: data.bid.id };
}

export async function buyNFT(params: {
  listingId: string;
  buyerAddress?: string;
}): Promise<{ txHash?: string }> {
  const data = await fetchAPI<{ sale: { txHash?: string } }>('/marketplace', {
    method: 'POST',
    body: JSON.stringify({
      action: 'buy',
      ...params,
    }),
  });

  return { txHash: data.sale.txHash };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINTING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function mintNFT(params: {
  collectionId: string;
  name: string;
  nameKo?: string;
  description?: string;
  descriptionKo?: string;
  image?: string;
  animationUrl?: string;
  rarity?: NFTRarity;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  utility?: {
    type: string;
    value: number;
    description: string;
  };
  txHash?: string;
}): Promise<{
  nft: {
    id: string;
    tokenId: string;
    name: string;
  };
}> {
  const data = await fetchAPI<{
    nft: { id: string; tokenId: string; name: string };
  }>('/items', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return { nft: data.nft };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getNFTActivity(
  nftId: string,
  limit: number = 20
): Promise<NFTActivity[]> {
  const data = await fetchAPI<{ activities: NFTActivity[] }>(
    `/activities?nftId=${nftId}&limit=${limit}`
  );
  return data.activities;
}

export async function getRecentActivity(limit: number = 20): Promise<NFTActivity[]> {
  const data = await fetchAPI<{ activities: NFTActivity[] }>(
    `/activities?limit=${limit}`
  );
  return data.activities;
}

export async function getUserActivity(
  userId: string,
  limit: number = 20
): Promise<NFTActivity[]> {
  const data = await fetchAPI<{ activities: NFTActivity[] }>(
    `/activities?userId=${userId}&limit=${limit}`
  );
  return data.activities;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITES FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function toggleFavorite(nftId: string): Promise<boolean> {
  const data = await fetchAPI<{ isFavorited: boolean }>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ nftId }),
  });
  return data.isFavorited;
}

export async function getUserFavorites(userId: string): Promise<NFT[]> {
  const data = await fetchAPI<{ nfts: NFT[] }>(
    `/favorites?userId=${userId}`
  );
  return data.nfts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKCHAIN INTEGRATION (VIA ALCHEMY)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getOnChainNFTs(
  ownerAddress: string,
  chainId: number = 42161
): Promise<AlchemyNFT[]> {
  if (!AlchemyConnector.isAlchemyConfigured()) {
    console.warn('[NFT Service] Alchemy not configured, returning empty array');
    return [];
  }

  const result = await AlchemyConnector.getNFTsForOwner(ownerAddress, chainId, {
    excludeFilters: ['SPAM'],
  });

  return result.ownedNfts;
}

export async function verifyOnChainOwnership(
  ownerAddress: string,
  contractAddress: string,
  tokenId: string,
  chainId: number = 42161
): Promise<boolean> {
  if (!AlchemyConnector.isAlchemyConfigured()) {
    console.warn('[NFT Service] Alchemy not configured, cannot verify ownership');
    return false;
  }

  return AlchemyConnector.verifyNFTOwnership(
    ownerAddress,
    contractAddress,
    tokenId,
    chainId
  );
}

export async function syncOnChainNFT(
  contractAddress: string,
  tokenId: string,
  chainId: number = 42161
): Promise<{
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
} | null> {
  if (!AlchemyConnector.isAlchemyConfigured()) {
    return null;
  }

  try {
    const nft = await AlchemyConnector.getNFTMetadata(
      contractAddress,
      tokenId,
      chainId,
      true
    );

    const converted = AlchemyConnector.convertAlchemyNFT(nft, chainId);

    return {
      name: converted.name,
      description: converted.description,
      image: converted.image,
      attributes: converted.attributes,
    };
  } catch {
    console.error('[NFT Service] Failed to sync on-chain NFT');
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getUserNFTStats(userId: string): Promise<UserNFTStats> {
  const data = await fetchAPI<{ stats: UserNFTStats }>(
    `/stats/user/${userId}`
  );
  return data.stats;
}

export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const data = await fetchAPI<{ stats: MarketplaceStats }>(
    '/stats/marketplace'
  );
  return data.stats;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const NFTService = {
  // Collections
  getAllCollections,
  getFeaturedCollections,
  getTrendingCollections,
  getCollectionById,

  // NFTs
  getNFTs,
  getNFTById,
  getUserNFTs,

  // Marketplace
  getActiveListings,
  getAuctions,
  createListing,
  cancelListing,
  placeBid,
  buyNFT,

  // Minting
  mintNFT,

  // Activity
  getNFTActivity,
  getRecentActivity,
  getUserActivity,

  // Favorites
  toggleFavorite,
  getUserFavorites,

  // Blockchain
  getOnChainNFTs,
  verifyOnChainOwnership,
  syncOnChainNFT,

  // Stats
  getUserNFTStats,
  getMarketplaceStats,
};

export default NFTService;
