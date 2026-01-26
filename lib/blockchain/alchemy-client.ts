/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: ALCHEMY BLOCKCHAIN CLIENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Production-ready Alchemy integration for:
 * - TVL (Total Value Locked) queries
 * - ERC-20 token balances
 * - NFT metadata
 * - Transaction monitoring
 * - Multi-chain support (Ethereum, Arbitrum, Polygon)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const ALCHEMY_CONFIG = {
  apiKey: process.env.ALCHEMY_API_KEY || '',
  networks: {
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2',
    arbitrum: 'https://arb-mainnet.g.alchemy.com/v2',
    polygon: 'https://polygon-mainnet.g.alchemy.com/v2',
    optimism: 'https://opt-mainnet.g.alchemy.com/v2',
  },
  // Field Nine contract addresses (to be deployed)
  contracts: {
    kausToken: process.env.KAUS_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    stakingVault: process.env.STAKING_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000',
    liquidityPool: process.env.LIQUIDITY_POOL_ADDRESS || '0x0000000000000000000000000000000000000000',
    treasuryWallet: process.env.TREASURY_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
  cache: {
    ttl: 30000, // 30 seconds
    maxSize: 100,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type Network = 'ethereum' | 'arbitrum' | 'polygon' | 'optimism';

export interface TokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: number;
  usdValue: number;
}

export interface TVLBreakdown {
  timestamp: string;
  network: Network;
  totalTVL: number;
  breakdown: {
    stakingVault: number;
    liquidityPool: number;
    treasuryWallet: number;
  };
  tokenPrices: {
    eth: number;
    kaus: number;
  };
  source: 'ALCHEMY' | 'FALLBACK';
  isLive: boolean;
}

export interface NFTMetadata {
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string | number }[];
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber: number | null;
  confirmations: number;
  timestamp: string;
  gasUsed: string;
  effectiveGasPrice: string;
}

export interface GasEstimate {
  network: Network;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCostUSD: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

class SimpleCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(ttl: number = 30000, maxSize: number = 100) {
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: T): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiry: Date.now() + this.ttl });
  }

  clear(): void {
    this.cache.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALCHEMY CLIENT CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class AlchemyClient {
  private cache = new SimpleCache<unknown>(ALCHEMY_CONFIG.cache.ttl, ALCHEMY_CONFIG.cache.maxSize);
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly RATE_LIMIT = 300; // requests per minute

  constructor() {
    if (!ALCHEMY_CONFIG.apiKey) {
      console.warn('[Alchemy] API key not configured - blockchain queries will use fallback data');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE JSON-RPC METHOD
  // ═══════════════════════════════════════════════════════════════════════════

  private async rpcCall<T>(
    network: Network,
    method: string,
    params: unknown[]
  ): Promise<T | null> {
    if (!ALCHEMY_CONFIG.apiKey) return null;

    // Rate limiting
    if (Date.now() - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }
    if (this.requestCount >= this.RATE_LIMIT) {
      console.warn('[Alchemy] Rate limit reached');
      return null;
    }
    this.requestCount++;

    const url = `${ALCHEMY_CONFIG.networks[network]}/${ALCHEMY_CONFIG.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      });

      if (!response.ok) {
        console.error(`[Alchemy] HTTP error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data.error) {
        console.error('[Alchemy] RPC error:', data.error);
        return null;
      }

      return data.result as T;
    } catch (error) {
      console.error('[Alchemy] Request failed:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get native token (ETH/MATIC) balance
   */
  async getNativeBalance(address: string, network: Network = 'ethereum'): Promise<number> {
    const cacheKey = `native_${network}_${address}`;
    const cached = this.cache.get(cacheKey) as number | null;
    if (cached !== null) return cached;

    const result = await this.rpcCall<string>(network, 'eth_getBalance', [address, 'latest']);
    if (!result) return 0;

    const balanceWei = parseInt(result, 16);
    const balanceEth = balanceWei / 1e18;

    this.cache.set(cacheKey, balanceEth);
    return balanceEth;
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string,
    network: Network = 'ethereum'
  ): Promise<TokenBalance | null> {
    const cacheKey = `token_${network}_${walletAddress}_${tokenAddress}`;
    const cached = this.cache.get(cacheKey) as TokenBalance | null;
    if (cached) return cached;

    // ERC-20 balanceOf(address) function selector
    const data = `0x70a08231000000000000000000000000${walletAddress.slice(2)}`;

    const result = await this.rpcCall<string>(network, 'eth_call', [
      { to: tokenAddress, data },
      'latest',
    ]);

    if (!result || result === '0x') return null;

    const balance = parseInt(result, 16);

    // Get token metadata
    const [symbol, name, decimals] = await Promise.all([
      this.getTokenSymbol(tokenAddress, network),
      this.getTokenName(tokenAddress, network),
      this.getTokenDecimals(tokenAddress, network),
    ]);

    const balanceFormatted = balance / Math.pow(10, decimals);
    const usdValue = await this.getTokenUSDValue(tokenAddress, balanceFormatted);

    const tokenBalance: TokenBalance = {
      contractAddress: tokenAddress,
      symbol: symbol || 'UNKNOWN',
      name: name || 'Unknown Token',
      decimals,
      balance: balance.toString(),
      balanceFormatted,
      usdValue,
    };

    this.cache.set(cacheKey, tokenBalance);
    return tokenBalance;
  }

  private async getTokenSymbol(tokenAddress: string, network: Network): Promise<string> {
    const result = await this.rpcCall<string>(network, 'eth_call', [
      { to: tokenAddress, data: '0x95d89b41' }, // symbol()
      'latest',
    ]);
    if (!result || result === '0x') return 'UNKNOWN';
    try {
      return this.decodeString(result);
    } catch {
      return 'UNKNOWN';
    }
  }

  private async getTokenName(tokenAddress: string, network: Network): Promise<string> {
    const result = await this.rpcCall<string>(network, 'eth_call', [
      { to: tokenAddress, data: '0x06fdde03' }, // name()
      'latest',
    ]);
    if (!result || result === '0x') return 'Unknown Token';
    try {
      return this.decodeString(result);
    } catch {
      return 'Unknown Token';
    }
  }

  private async getTokenDecimals(tokenAddress: string, network: Network): Promise<number> {
    const result = await this.rpcCall<string>(network, 'eth_call', [
      { to: tokenAddress, data: '0x313ce567' }, // decimals()
      'latest',
    ]);
    if (!result || result === '0x') return 18;
    return parseInt(result, 16);
  }

  private decodeString(hex: string): string {
    // Remove 0x prefix and offset (first 64 chars after 0x)
    const data = hex.slice(2);
    if (data.length < 128) return '';
    const length = parseInt(data.slice(64, 128), 16);
    const stringHex = data.slice(128, 128 + length * 2);
    return Buffer.from(stringHex, 'hex').toString('utf8').replace(/\0/g, '');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TVL CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate Total Value Locked across all contracts
   */
  async getTVL(network: Network = 'ethereum'): Promise<TVLBreakdown> {
    const cacheKey = `tvl_${network}`;
    const cached = this.cache.get(cacheKey) as TVLBreakdown | null;
    if (cached) return cached;

    // Get ETH price
    const ethPrice = await this.getETHPrice();

    // Query contract balances in parallel
    const [stakingBalance, liquidityBalance, treasuryBalance] = await Promise.all([
      this.getNativeBalance(ALCHEMY_CONFIG.contracts.stakingVault, network),
      this.getNativeBalance(ALCHEMY_CONFIG.contracts.liquidityPool, network),
      this.getNativeBalance(ALCHEMY_CONFIG.contracts.treasuryWallet, network),
    ]);

    const stakingUSD = stakingBalance * ethPrice;
    const liquidityUSD = liquidityBalance * ethPrice;
    const treasuryUSD = treasuryBalance * ethPrice;
    const totalTVL = stakingUSD + liquidityUSD + treasuryUSD;

    const tvlData: TVLBreakdown = {
      timestamp: new Date().toISOString(),
      network,
      totalTVL,
      breakdown: {
        stakingVault: stakingUSD,
        liquidityPool: liquidityUSD,
        treasuryWallet: treasuryUSD,
      },
      tokenPrices: {
        eth: ethPrice,
        kaus: 0.15, // K-AUS pegged price
      },
      source: ALCHEMY_CONFIG.apiKey ? 'ALCHEMY' : 'FALLBACK',
      isLive: !!ALCHEMY_CONFIG.apiKey,
    };

    this.cache.set(cacheKey, tvlData);
    return tvlData;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTION MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get transaction status and confirmations
   */
  async getTransactionStatus(
    txHash: string,
    network: Network = 'ethereum'
  ): Promise<TransactionStatus | null> {
    const receipt = await this.rpcCall<{
      status: string;
      blockNumber: string;
      gasUsed: string;
      effectiveGasPrice: string;
    }>(network, 'eth_getTransactionReceipt', [txHash]);

    if (!receipt) {
      // Transaction may still be pending
      const tx = await this.rpcCall<{ blockNumber: string | null }>(
        network,
        'eth_getTransactionByHash',
        [txHash]
      );

      if (!tx) return null;

      return {
        hash: txHash,
        status: 'pending',
        blockNumber: null,
        confirmations: 0,
        timestamp: new Date().toISOString(),
        gasUsed: '0',
        effectiveGasPrice: '0',
      };
    }

    // Get current block for confirmation count
    const currentBlock = await this.rpcCall<string>(network, 'eth_blockNumber', []);
    const txBlockNumber = parseInt(receipt.blockNumber, 16);
    const currentBlockNumber = currentBlock ? parseInt(currentBlock, 16) : txBlockNumber;

    return {
      hash: txHash,
      status: receipt.status === '0x1' ? 'confirmed' : 'failed',
      blockNumber: txBlockNumber,
      confirmations: currentBlockNumber - txBlockNumber + 1,
      timestamp: new Date().toISOString(),
      gasUsed: parseInt(receipt.gasUsed, 16).toString(),
      effectiveGasPrice: parseInt(receipt.effectiveGasPrice, 16).toString(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAS ESTIMATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current gas prices with USD estimation
   */
  async getGasEstimate(network: Network = 'ethereum'): Promise<GasEstimate> {
    const cacheKey = `gas_${network}`;
    const cached = this.cache.get(cacheKey) as GasEstimate | null;
    if (cached) return cached;

    const [gasPrice, feeHistory, ethPrice] = await Promise.all([
      this.rpcCall<string>(network, 'eth_gasPrice', []),
      this.rpcCall<{ baseFeePerGas: string[] }>(network, 'eth_feeHistory', [1, 'latest', [25, 75]]),
      this.getETHPrice(),
    ]);

    const gasPriceGwei = gasPrice ? parseInt(gasPrice, 16) / 1e9 : 30;
    const baseFee = feeHistory?.baseFeePerGas?.[0]
      ? parseInt(feeHistory.baseFeePerGas[0], 16) / 1e9
      : gasPriceGwei;

    // Standard transaction cost (21000 gas)
    const estimatedCostETH = (gasPriceGwei * 21000) / 1e9;
    const estimatedCostUSD = estimatedCostETH * ethPrice;

    const estimate: GasEstimate = {
      network,
      gasPrice: `${gasPriceGwei.toFixed(2)} Gwei`,
      maxFeePerGas: `${(baseFee * 2).toFixed(2)} Gwei`,
      maxPriorityFeePerGas: `${Math.max(1, baseFee * 0.1).toFixed(2)} Gwei`,
      estimatedCostUSD: Math.round(estimatedCostUSD * 100) / 100,
    };

    this.cache.set(cacheKey, estimate);
    return estimate;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NFT QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get NFT metadata using Alchemy NFT API
   */
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    network: Network = 'ethereum'
  ): Promise<NFTMetadata | null> {
    if (!ALCHEMY_CONFIG.apiKey) return null;

    const cacheKey = `nft_${network}_${contractAddress}_${tokenId}`;
    const cached = this.cache.get(cacheKey) as NFTMetadata | null;
    if (cached) return cached;

    try {
      const url = `${ALCHEMY_CONFIG.networks[network]}/${ALCHEMY_CONFIG.apiKey}/getNFTMetadata`;
      const response = await fetch(`${url}?contractAddress=${contractAddress}&tokenId=${tokenId}`);

      if (!response.ok) return null;

      const data = await response.json();
      const metadata: NFTMetadata = {
        contractAddress,
        tokenId,
        name: data.title || data.metadata?.name || `#${tokenId}`,
        description: data.description || data.metadata?.description || '',
        image: data.media?.[0]?.gateway || data.metadata?.image || '',
        attributes: data.metadata?.attributes || [],
      };

      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('[Alchemy] NFT metadata fetch failed:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async getETHPrice(): Promise<number> {
    const cacheKey = 'eth_price';
    const cached = this.cache.get(cacheKey) as number | null;
    if (cached) return cached;

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { next: { revalidate: 60 } }
      );
      if (response.ok) {
        const data = await response.json();
        const price = data.ethereum?.usd || 3500;
        this.cache.set(cacheKey, price);
        return price;
      }
    } catch {
      // Fallback price
    }
    return 3500;
  }

  private async getTokenUSDValue(tokenAddress: string, amount: number): Promise<number> {
    // For K-AUS token, use pegged price
    if (tokenAddress.toLowerCase() === ALCHEMY_CONFIG.contracts.kausToken.toLowerCase()) {
      return amount * 0.15;
    }
    // For other tokens, would integrate CoinGecko API
    return 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if Alchemy is properly configured
   */
  isConfigured(): boolean {
    return !!ALCHEMY_CONFIG.apiKey;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get API usage stats
   */
  getUsageStats(): { requestCount: number; cacheHits: number } {
    return {
      requestCount: this.requestCount,
      cacheHits: 0, // Would need to track this
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const alchemyClient = new AlchemyClient();

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getBlockchainTVL(network: Network = 'ethereum'): Promise<TVLBreakdown> {
  return alchemyClient.getTVL(network);
}

export async function getWalletBalance(
  address: string,
  network: Network = 'ethereum'
): Promise<number> {
  return alchemyClient.getNativeBalance(address, network);
}

export async function getTokenBalance(
  walletAddress: string,
  tokenAddress: string,
  network: Network = 'ethereum'
): Promise<TokenBalance | null> {
  return alchemyClient.getTokenBalance(walletAddress, tokenAddress, network);
}

export async function getTransactionStatus(
  txHash: string,
  network: Network = 'ethereum'
): Promise<TransactionStatus | null> {
  return alchemyClient.getTransactionStatus(txHash, network);
}

export async function getGasEstimate(network: Network = 'ethereum'): Promise<GasEstimate> {
  return alchemyClient.getGasEstimate(network);
}

export async function getNFTMetadata(
  contractAddress: string,
  tokenId: string,
  network: Network = 'ethereum'
): Promise<NFTMetadata | null> {
  return alchemyClient.getNFTMetadata(contractAddress, tokenId, network);
}

export function isAlchemyConfigured(): boolean {
  return alchemyClient.isConfigured();
}
