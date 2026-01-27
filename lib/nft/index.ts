/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT MARKETPLACE MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Exports:
 * - NFTService: Production API client
 * - NFTEngine: Types and constants (legacy mock data for fallback)
 * - AlchemyConnector: Blockchain data
 */

// Production service (API routes + Alchemy)
export { NFTService } from './nft-service';
export type {
  NFT,
  NFTCollection,
  NFTListing,
  NFTBid,
  NFTActivity,
  NFTUtility,
  NFTAttribute,
  NFTRarity,
  NFTCategory,
  ListingStatus,
  AuctionType,
  UserNFTStats,
  MarketplaceStats,
} from './nft-engine';

// Alchemy blockchain connector
export { AlchemyConnector } from './alchemy-connector';
export type {
  AlchemyNFT,
  AlchemyNFTMetadata,
  AlchemyFloorPrice,
  AlchemyContractMetadata,
  AlchemyOwnersResponse,
} from './alchemy-connector';

// Constants and helpers
export {
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  getRarityLabel,
  getActivityLabel,
} from './nft-engine';

// Legacy engine (for fallback/testing)
export { NFTEngine } from './nft-engine';

// Default export
export { NFTService as default } from './nft-service';
