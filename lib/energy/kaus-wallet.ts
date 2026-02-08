/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KAUS WALLET SERVICE - FIELD NINE NEXUS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 37: THE FINAL CONVERGENCE
 *
 * Alchemy API Integration for Kaus Coin Wallet Management
 * Real-time on-chain asset tracking and balance display
 *
 * @version 37.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Alchemy API
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || '',
  ALCHEMY_NETWORK: process.env.ALCHEMY_NETWORK || 'polygon-mainnet',
  ALCHEMY_BASE_URL: 'https://polygon-mainnet.g.alchemy.com/v2',

  // Boss Wallet Address (Field Nine Treasury)
  BOSS_WALLET: process.env.BOSS_WALLET_ADDRESS || '0x0a5769...', // Placeholder

  // Kaus Coin Contract (Polygon)
  KAUS_CONTRACT: process.env.KAUS_CONTRACT_ADDRESS || '',

  // Token Economics
  KAUS_DECIMALS: 18,
  KAUS_SYMBOL: 'KAUS',
  KAUS_NAME: 'Kaus Energy Coin',

  // Pricing
  BASE_KAUS_PRICE_USD: 0.10,
  KWH_TO_KAUS_RATE: 10, // 1 kWh = 10 KAUS
};

// Supabase client
const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface KausWalletBalance {
  address: string;
  kausBalance: number;
  kausBalanceFormatted: string;
  usdValue: number;
  krwValue: number;
  nativeBalance: number; // MATIC/ETH
  nativeSymbol: string;
  lastUpdate: string;
  isLive: boolean;
}

export interface KausTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  amountFormatted: string;
  type: 'SEND' | 'RECEIVE' | 'SWAP' | 'STAKE' | 'UNSTAKE';
  timestamp: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  blockNumber: number;
}

export interface SwapQuote {
  inputType: 'ENERGY' | 'KAUS';
  inputAmount: number;
  outputType: 'KAUS' | 'ENERGY';
  outputAmount: number;
  rate: number;
  fee: number;
  feePercent: number;
  priceImpact: number;
  estimatedGas: number;
  validUntil: string;
}

export interface SwapResult {
  success: boolean;
  transactionHash?: string;
  inputAmount: number;
  outputAmount: number;
  fee: number;
  timestamp: string;
  error?: string;
}

export interface EnergyAsset {
  source: 'TESLA' | 'SOLAR' | 'GRID';
  kwhAvailable: number;
  kausEquivalent: number;
  usdValue: number;
  lastUpdate: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALCHEMY API SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class AlchemyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = CONFIG.ALCHEMY_API_KEY;
    this.baseUrl = `${CONFIG.ALCHEMY_BASE_URL}/${this.apiKey}`;
  }

  /**
   * Make JSON-RPC call to Alchemy
   */
  private async rpcCall(method: string, params: unknown[]): Promise<unknown> {
    const response = await fetch(this.baseUrl, {
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
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }

    return data.result;
  }

  /**
   * Get native token balance (MATIC on Polygon)
   */
  async getNativeBalance(address: string): Promise<number> {
    try {
      const result = await this.rpcCall('eth_getBalance', [address, 'latest']);
      const weiBalance = parseInt(result as string, 16);
      return weiBalance / 1e18;
    } catch (error) {
      console.error('[ALCHEMY] Native balance error:', error);
      return 0;
    }
  }

  /**
   * Get ERC-20 token balance (Kaus Coin)
   */
  async getTokenBalance(walletAddress: string, tokenContract: string): Promise<number> {
    try {
      // ERC-20 balanceOf function signature
      const data = `0x70a08231000000000000000000000000${walletAddress.slice(2).toLowerCase()}`;

      const result = await this.rpcCall('eth_call', [
        { to: tokenContract, data },
        'latest',
      ]);

      const balance = parseInt(result as string, 16);
      return balance / Math.pow(10, CONFIG.KAUS_DECIMALS);
    } catch (error) {
      console.error('[ALCHEMY] Token balance error:', error);
      return 0;
    }
  }

  /**
   * Get recent transactions for address
   */
  async getRecentTransactions(address: string, limit: number = 10): Promise<KausTransaction[]> {
    try {
      // Use Alchemy's enhanced API for asset transfers
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromAddress: address,
            category: ['erc20', 'external'],
            maxCount: `0x${limit.toString(16)}`,
            order: 'desc',
          }],
        }),
      });

      const data = await response.json();
      const transfers = data.result?.transfers || [];

      return transfers.map((tx: {
        hash: string;
        from: string;
        to: string;
        value: number;
        asset: string;
        blockNum: string;
        metadata: { blockTimestamp: string };
      }) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: tx.value || 0,
        amountFormatted: `${(tx.value || 0).toFixed(4)} ${tx.asset}`,
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'SEND' : 'RECEIVE',
        timestamp: tx.metadata?.blockTimestamp || new Date().toISOString(),
        status: 'CONFIRMED' as const,
        blockNumber: parseInt(tx.blockNum, 16),
      }));
    } catch (error) {
      console.error('[ALCHEMY] Transactions error:', error);
      return [];
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(from: string, to: string, data: string): Promise<number> {
    try {
      const result = await this.rpcCall('eth_estimateGas', [{ from, to, data }]);
      return parseInt(result as string, 16);
    } catch (error) {
      console.error('[ALCHEMY] Gas estimation error:', error);
      return 21000; // Default gas
    }
  }

  /**
   * Check if API is configured and working
   */
  async isConfigured(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      await this.rpcCall('eth_blockNumber', []);
      return true;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS WALLET SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class KausWalletService {
  private alchemy: AlchemyService;
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor() {
    this.alchemy = new AlchemyService();
  }

  /**
   * Get Boss wallet balance
   */
  async getBossWalletBalance(): Promise<KausWalletBalance> {
    const cacheKey = 'boss_wallet';
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as KausWalletBalance;
    }

    const address = CONFIG.BOSS_WALLET;
    const isAlchemyConfigured = await this.alchemy.isConfigured();

    let kausBalance = 0;
    let nativeBalance = 0;
    let isLive = false;

    if (isAlchemyConfigured && CONFIG.KAUS_CONTRACT) {
      try {
        [kausBalance, nativeBalance] = await Promise.all([
          this.alchemy.getTokenBalance(address, CONFIG.KAUS_CONTRACT),
          this.alchemy.getNativeBalance(address),
        ]);
        isLive = true;
      } catch (error) {
        console.error('[KAUS WALLET] Error fetching balances:', error);
      }
    }

    // If not live, check Supabase for simulated balance
    if (!isLive) {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'kaus_wallet_balance')
        .single();

      if (data?.value) {
        kausBalance = data.value.balance || 0;
      } else {
        // Default simulation balance based on Tesla fleet energy
        kausBalance = 15000; // 1,500 kWh equivalent
      }
    }

    // Calculate values
    const usdValue = kausBalance * CONFIG.BASE_KAUS_PRICE_USD;
    const krwValue = usdValue * 1350;

    const walletBalance: KausWalletBalance = {
      address: this.maskAddress(address),
      kausBalance,
      kausBalanceFormatted: this.formatBalance(kausBalance),
      usdValue,
      krwValue,
      nativeBalance,
      nativeSymbol: 'MATIC',
      lastUpdate: new Date().toISOString(),
      isLive,
    };

    this.cache.set(cacheKey, { data: walletBalance, expiry: Date.now() + this.CACHE_TTL });
    return walletBalance;
  }

  /**
   * Get energy assets available for swap
   */
  async getEnergyAssets(): Promise<EnergyAsset[]> {
    // Fetch Tesla data for energy calculation
    const { getLiveTeslaData } = await import('@/lib/partnerships/live-data-service');
    const teslaData = await getLiveTeslaData();

    const assets: EnergyAsset[] = [];

    // Tesla battery energy
    if (teslaData.totalVehicles > 0) {
      const kwhAvailable = teslaData.vehicles.reduce((sum, v) => {
        // Calculate available energy (battery level * estimated capacity)
        const batteryCapacity = 100; // kWh per vehicle (Model S/X/3/Y average)
        return sum + (v.batteryLevel / 100) * batteryCapacity;
      }, 0);

      assets.push({
        source: 'TESLA',
        kwhAvailable,
        kausEquivalent: kwhAvailable * CONFIG.KWH_TO_KAUS_RATE,
        usdValue: kwhAvailable * CONFIG.KWH_TO_KAUS_RATE * CONFIG.BASE_KAUS_PRICE_USD,
        lastUpdate: teslaData.timestamp,
      });
    } else {
      // Simulation mode
      assets.push({
        source: 'TESLA',
        kwhAvailable: 75, // 75% of 100 kWh
        kausEquivalent: 750,
        usdValue: 75,
        lastUpdate: new Date().toISOString(),
      });
    }

    return assets;
  }

  /**
   * Get swap quote for energy to Kaus
   */
  async getSwapQuote(
    inputType: 'ENERGY' | 'KAUS',
    inputAmount: number
  ): Promise<SwapQuote> {
    const { getLiveSMP } = await import('@/lib/partnerships/live-data-service');
    const smpData = await getLiveSMP();

    // Dynamic rate based on SMP price
    const baseRate = CONFIG.KWH_TO_KAUS_RATE;
    const smpMultiplier = smpData.price / 120; // Baseline 120 KRW/kWh
    const dynamicRate = baseRate * (1 + (1 - smpMultiplier) * 0.2); // ±20% adjustment

    const feePercent = 0.5; // 0.5% swap fee
    const fee = inputAmount * (feePercent / 100);

    let outputAmount: number;
    let rate: number;

    if (inputType === 'ENERGY') {
      // Energy (kWh) -> Kaus
      rate = dynamicRate;
      outputAmount = (inputAmount - fee) * rate;
    } else {
      // Kaus -> Energy (kWh)
      rate = 1 / dynamicRate;
      outputAmount = (inputAmount - fee) * rate;
    }

    // Estimate gas cost
    const estimatedGas = 65000; // Typical ERC-20 transfer

    return {
      inputType,
      inputAmount,
      outputType: inputType === 'ENERGY' ? 'KAUS' : 'ENERGY',
      outputAmount,
      rate,
      fee,
      feePercent,
      priceImpact: inputAmount > 1000 ? 0.1 : 0, // 0.1% for large swaps
      estimatedGas,
      validUntil: new Date(Date.now() + 60000).toISOString(), // Valid for 1 minute
    };
  }

  /**
   * Execute energy to Kaus swap (simulation)
   */
  async executeSwap(
    inputType: 'ENERGY' | 'KAUS',
    inputAmount: number
  ): Promise<SwapResult> {
    const quote = await this.getSwapQuote(inputType, inputAmount);

    // In production, this would:
    // 1. Sign transaction with user's wallet
    // 2. Execute on-chain swap via smart contract
    // 3. Update balances

    // For now, simulate the swap
    const supabase = getSupabase();

    // Get current balance
    const { data: currentBalance } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'kaus_wallet_balance')
      .single();

    const currentKaus = currentBalance?.value?.balance || 15000;
    const newBalance = inputType === 'ENERGY'
      ? currentKaus + quote.outputAmount
      : currentKaus - inputAmount;

    // Update balance in database
    await supabase.from('system_config').upsert({
      key: 'kaus_wallet_balance',
      value: { balance: newBalance, lastUpdate: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    // Log transaction
    await supabase.from('system_config').upsert({
      key: `kaus_tx_${Date.now()}`,
      value: {
        type: 'SWAP',
        inputType,
        inputAmount,
        outputAmount: quote.outputAmount,
        timestamp: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    // Clear cache
    this.cache.delete('boss_wallet');

    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2)}...${Math.random().toString(16).slice(2, 10)}`,
      inputAmount,
      outputAmount: quote.outputAmount,
      fee: quote.fee,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(): Promise<KausTransaction[]> {
    const isAlchemyConfigured = await this.alchemy.isConfigured();

    if (isAlchemyConfigured) {
      return this.alchemy.getRecentTransactions(CONFIG.BOSS_WALLET, 10);
    }

    // Return simulated transactions
    return [
      {
        hash: '0x1a2b...3c4d',
        from: CONFIG.BOSS_WALLET,
        to: '0x5678...9abc',
        amount: 500,
        amountFormatted: '500.0000 KAUS',
        type: 'SEND',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'CONFIRMED',
        blockNumber: 52345678,
      },
      {
        hash: '0x2b3c...4d5e',
        from: '0x9876...fedc',
        to: CONFIG.BOSS_WALLET,
        amount: 1200,
        amountFormatted: '1,200.0000 KAUS',
        type: 'RECEIVE',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'CONFIRMED',
        blockNumber: 52345600,
      },
    ];
  }

  /**
   * Helper: Format large balance numbers
   */
  private formatBalance(balance: number): string {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M`;
    }
    if (balance >= 1000) {
      return `${(balance / 1000).toFixed(2)}K`;
    }
    return balance.toFixed(2);
  }

  /**
   * Helper: Mask wallet address for display
   */
  private maskAddress(address: string): string {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const kausWalletService = new KausWalletService();

// API Functions
export async function getKausWalletBalance(): Promise<KausWalletBalance> {
  return kausWalletService.getBossWalletBalance();
}

export async function getEnergyAssets(): Promise<EnergyAsset[]> {
  return kausWalletService.getEnergyAssets();
}

export async function getSwapQuote(
  inputType: 'ENERGY' | 'KAUS',
  inputAmount: number
): Promise<SwapQuote> {
  return kausWalletService.getSwapQuote(inputType, inputAmount);
}

export async function executeEnergySwap(
  inputType: 'ENERGY' | 'KAUS',
  inputAmount: number
): Promise<SwapResult> {
  return kausWalletService.executeSwap(inputType, inputAmount);
}

export async function getKausTransactions(): Promise<KausTransaction[]> {
  return kausWalletService.getRecentTransactions();
}
