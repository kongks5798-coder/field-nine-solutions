/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: ALCHEMY NFT CONNECTOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Connects to Alchemy NFT API for on-chain NFT data
 * Supports: Ethereum, Arbitrum, Polygon, Base
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AlchemyNFT {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    tokenType: 'ERC721' | 'ERC1155';
    contractDeployer?: string;
    deployedBlockNumber?: number;
  };
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  name?: string;
  description?: string;
  image?: {
    cachedUrl?: string;
    originalUrl?: string;
    thumbnailUrl?: string;
    pngUrl?: string;
  };
  raw?: {
    metadata?: Record<string, unknown>;
  };
  timeLastUpdated?: string;
  balance?: string;
}

export interface AlchemyNFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

export interface AlchemyOwnersResponse {
  owners: string[];
  pageKey?: string;
}

export interface AlchemyFloorPrice {
  openSea?: {
    floorPrice: number;
    priceCurrency: string;
    retrievedAt: string;
    collectionUrl: string;
  };
  looksRare?: {
    floorPrice: number;
    priceCurrency: string;
    retrievedAt: string;
    collectionUrl: string;
  };
}

export interface AlchemyContractMetadata {
  address: string;
  name?: string;
  symbol?: string;
  totalSupply?: string;
  tokenType: string;
  contractDeployer?: string;
  deployedBlockNumber?: number;
  openSea?: {
    collectionName?: string;
    collectionSlug?: string;
    imageUrl?: string;
    bannerImageUrl?: string;
    description?: string;
    externalUrl?: string;
    floorPrice?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || '';

const ALCHEMY_BASE_URLS: Record<number, string> = {
  1: 'https://eth-mainnet.g.alchemy.com',
  42161: 'https://arb-mainnet.g.alchemy.com',
  137: 'https://polygon-mainnet.g.alchemy.com',
  8453: 'https://base-mainnet.g.alchemy.com',
  11155111: 'https://eth-sepolia.g.alchemy.com',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getAlchemyUrl(chainId: number, endpoint: string): string {
  const baseUrl = ALCHEMY_BASE_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${baseUrl}/nft/v3/${ALCHEMY_API_KEY}/${endpoint}`;
}

async function fetchAlchemy<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Alchemy API] Error:', response.status, errorText);
    throw new Error(`Alchemy API error: ${response.status}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get NFTs owned by an address
 */
export async function getNFTsForOwner(
  ownerAddress: string,
  chainId: number = 42161,
  options: {
    pageSize?: number;
    pageKey?: string;
    contractAddresses?: string[];
    excludeFilters?: string[];
  } = {}
): Promise<{
  ownedNfts: AlchemyNFT[];
  pageKey?: string;
  totalCount: number;
}> {
  const params = new URLSearchParams({
    owner: ownerAddress,
    pageSize: (options.pageSize || 100).toString(),
    withMetadata: 'true',
  });

  if (options.pageKey) {
    params.append('pageKey', options.pageKey);
  }

  if (options.contractAddresses) {
    options.contractAddresses.forEach(addr => {
      params.append('contractAddresses[]', addr);
    });
  }

  if (options.excludeFilters) {
    options.excludeFilters.forEach(filter => {
      params.append('excludeFilters[]', filter);
    });
  }

  const url = getAlchemyUrl(chainId, `getNFTsForOwner?${params.toString()}`);
  return fetchAlchemy(url);
}

/**
 * Get NFTs in a collection (contract)
 */
export async function getNFTsForContract(
  contractAddress: string,
  chainId: number = 42161,
  options: {
    pageSize?: number;
    startToken?: string;
    omitMetadata?: boolean;
  } = {}
): Promise<{
  nfts: AlchemyNFT[];
  pageKey?: string;
}> {
  const params = new URLSearchParams({
    contractAddress,
    withMetadata: (!options.omitMetadata).toString(),
  });

  if (options.pageSize) {
    params.append('limit', options.pageSize.toString());
  }

  if (options.startToken) {
    params.append('startToken', options.startToken);
  }

  const url = getAlchemyUrl(chainId, `getNFTsForContract?${params.toString()}`);
  return fetchAlchemy(url);
}

/**
 * Get single NFT metadata
 */
export async function getNFTMetadata(
  contractAddress: string,
  tokenId: string,
  chainId: number = 42161,
  refreshCache: boolean = false
): Promise<AlchemyNFT> {
  const params = new URLSearchParams({
    contractAddress,
    tokenId,
    refreshCache: refreshCache.toString(),
  });

  const url = getAlchemyUrl(chainId, `getNFTMetadata?${params.toString()}`);
  return fetchAlchemy(url);
}

/**
 * Get owners of an NFT
 */
export async function getOwnersForNFT(
  contractAddress: string,
  tokenId: string,
  chainId: number = 42161
): Promise<AlchemyOwnersResponse> {
  const params = new URLSearchParams({
    contractAddress,
    tokenId,
  });

  const url = getAlchemyUrl(chainId, `getOwnersForNFT?${params.toString()}`);
  return fetchAlchemy(url);
}

/**
 * Get owners for a collection (contract)
 */
export async function getOwnersForContract(
  contractAddress: string,
  chainId: number = 42161,
  options: {
    withTokenBalances?: boolean;
    pageKey?: string;
  } = {}
): Promise<{
  owners: Array<{
    ownerAddress: string;
    tokenBalances?: Array<{
      tokenId: string;
      balance: string;
    }>;
  }>;
  pageKey?: string;
}> {
  const params = new URLSearchParams({
    contractAddress,
    withTokenBalances: (options.withTokenBalances || false).toString(),
  });

  if (options.pageKey) {
    params.append('pageKey', options.pageKey);
  }

  const url = getAlchemyUrl(chainId, `getOwnersForContract?${params.toString()}`);
  return fetchAlchemy(url);
}

/**
 * Get floor price for a collection
 */
export async function getFloorPrice(
  contractAddress: string,
  chainId: number = 1 // Floor price is primarily on mainnet
): Promise<AlchemyFloorPrice> {
  const params = new URLSearchParams({
    contractAddress,
  });

  const url = getAlchemyUrl(chainId, `getFloorPrice?${params.toString()}`);
  return fetchAlchemy(url);
}

/**
 * Get collection/contract metadata
 */
export async function getContractMetadata(
  contractAddress: string,
  chainId: number = 42161
): Promise<AlchemyContractMetadata> {
  const params = new URLSearchParams({
    contractAddress,
  });

  const url = getAlchemyUrl(chainId, `getContractMetadata?${params.toString()}`);
  return fetchAlchemy(url);
}

/**
 * Verify NFT ownership
 */
export async function verifyNFTOwnership(
  ownerAddress: string,
  contractAddress: string,
  tokenId: string,
  chainId: number = 42161
): Promise<boolean> {
  try {
    const { owners } = await getOwnersForNFT(contractAddress, tokenId, chainId);
    return owners.some(owner => owner.toLowerCase() === ownerAddress.toLowerCase());
  } catch {
    console.error('[Alchemy] Error verifying ownership');
    return false;
  }
}

/**
 * Get NFT transfers for an address
 */
export async function getNFTTransfers(
  address: string,
  chainId: number = 42161,
  options: {
    category?: ('external' | 'internal' | 'erc20' | 'erc721' | 'erc1155')[];
    order?: 'asc' | 'desc';
    fromBlock?: string;
    toBlock?: string;
    pageKey?: string;
  } = {}
): Promise<{
  transfers: Array<{
    blockNum: string;
    hash: string;
    from: string;
    to: string;
    value?: string;
    tokenId?: string;
    asset?: string;
    category: string;
  }>;
  pageKey?: string;
}> {
  // Use getAssetTransfers endpoint on core API
  const baseUrl = ALCHEMY_BASE_URLS[chainId];
  const url = `${baseUrl}/v2/${ALCHEMY_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [{
        fromAddress: address,
        category: options.category || ['erc721', 'erc1155'],
        order: options.order || 'desc',
        fromBlock: options.fromBlock || '0x0',
        toBlock: options.toBlock || 'latest',
        withMetadata: true,
        maxCount: '0x64', // 100
        pageKey: options.pageKey,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    transfers: data.result?.transfers || [],
    pageKey: data.result?.pageKey,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get batch NFT metadata
 */
export async function getBatchNFTMetadata(
  tokens: Array<{ contractAddress: string; tokenId: string }>,
  chainId: number = 42161
): Promise<AlchemyNFT[]> {
  const url = getAlchemyUrl(chainId, 'getNFTMetadataBatch');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokens: tokens.map(t => ({
        contractAddress: t.contractAddress,
        tokenId: t.tokenId,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`);
  }

  const data = await response.json();
  return data.nfts || [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPAM DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a collection is spam
 */
export async function isSpamContract(
  contractAddress: string,
  chainId: number = 42161
): Promise<boolean> {
  const params = new URLSearchParams({
    contractAddress,
  });

  const url = getAlchemyUrl(chainId, `isSpamContract?${params.toString()}`);

  try {
    const data = await fetchAlchemy<{ isSpamContract: boolean }>(url);
    return data.isSpamContract;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert Alchemy NFT to our internal format
 */
export function convertAlchemyNFT(
  alchemyNFT: AlchemyNFT,
  chainId: number
): {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  animationUrl?: string;
  attributes: Array<{ trait_type: string; value: string | number; display_type?: string }>;
  contractAddress: string;
  chainId: number;
  tokenType: string;
} {
  const metadata = alchemyNFT.raw?.metadata as AlchemyNFTMetadata | undefined;

  return {
    tokenId: alchemyNFT.tokenId,
    name: alchemyNFT.name || metadata?.name || `#${alchemyNFT.tokenId}`,
    description: alchemyNFT.description || metadata?.description || '',
    image: alchemyNFT.image?.cachedUrl || alchemyNFT.image?.originalUrl || metadata?.image || '',
    animationUrl: metadata?.animation_url,
    attributes: metadata?.attributes || [],
    contractAddress: alchemyNFT.contract.address,
    chainId,
    tokenType: alchemyNFT.tokenType,
  };
}

/**
 * Check if Alchemy API is configured
 */
export function isAlchemyConfigured(): boolean {
  return Boolean(ALCHEMY_API_KEY);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const AlchemyConnector = {
  // Read NFTs
  getNFTsForOwner,
  getNFTsForContract,
  getNFTMetadata,
  getBatchNFTMetadata,

  // Ownership
  getOwnersForNFT,
  getOwnersForContract,
  verifyNFTOwnership,

  // Collection Info
  getContractMetadata,
  getFloorPrice,
  isSpamContract,

  // Transfers
  getNFTTransfers,

  // Utilities
  convertAlchemyNFT,
  isAlchemyConfigured,

  // Constants
  SUPPORTED_CHAINS: Object.keys(ALCHEMY_BASE_URLS).map(Number),
};

export default AlchemyConnector;
