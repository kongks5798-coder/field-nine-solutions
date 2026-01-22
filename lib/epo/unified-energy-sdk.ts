/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                                                                       ║
 * ║     FIELD NINE UNIFIED ENERGY SDK v2.0                                ║
 * ║     The Global Standard for Energy Verification, Trading & Compliance ║
 * ║                                                                       ║
 * ║     Three Core Functions:                                             ║
 * ║       1. verify()  - Authenticate energy provenance                   ║
 * ║       2. swap()    - Cross-border energy value transfer               ║
 * ║       3. attest()  - Generate sovereign certification                 ║
 * ║                                                                       ║
 * ║     Every kWh traced. Every transaction compliant. Every swap instant.║
 * ║                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * Quick Start:
 * ```typescript
 * import { FieldNineSDK } from '@fieldnine/energy-sdk';
 *
 * const sdk = new FieldNineSDK({ apiKey: 'fn_epo_your_api_key' });
 *
 * // Verify energy origin
 * const verification = await sdk.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4');
 *
 * // Cross-border swap
 * const swap = await sdk.swap({
 *   source: 'YEONGDONG-001',
 *   target: 'AEMO-VIC-001',
 *   amount: 1000,
 * });
 *
 * // Get sovereign certification
 * const cert = await sdk.attest({
 *   nodeId: 'YEONGDONG-001',
 *   kwhProduced: 5000,
 *   sourceType: 'solar',
 * });
 * ```
 */

import { keccak256, encodePacked } from './crypto-utils';

// ============================================================
// SDK CONFIGURATION
// ============================================================

export interface SDKConfig {
  apiKey: string;
  baseUrl?: string;
  environment?: 'production' | 'sandbox' | 'local';
  timeout?: number;
  retryAttempts?: number;
  enableCompliance?: boolean;
  defaultCountry?: string;
  webhookUrl?: string;
  debug?: boolean;
}

// ============================================================
// CORE RESPONSE TYPES
// ============================================================

/**
 * Result of energy verification (verify())
 */
export interface VerifyResult {
  success: boolean;
  watermarkId: string;
  nodeId: string;
  sourceType: string;
  kwhVerified: number;
  timestamp: string;

  // Proof chain
  proof: {
    attestationHash: string;
    polygonTxHash: string;
    blockNumber: number;
    verificationProof: string;
  };

  // Compliance (if enabled)
  compliance?: {
    re100: { status: string; certificationId: string };
    cbam: { status: string; carbonAdjustment: number };
    esg: { rating: string; score: number };
  };

  // Royalty charged
  royalty: {
    amount: number;
    currency: 'NXUSD';
    tier: string;
  };

  // Metadata
  metadata: {
    region: string;
    certificationLevel: string;
    carbonOffset: number;
    gridOperator: string;
  };
}

/**
 * Result of energy swap (swap())
 */
export interface SwapResult {
  success: boolean;
  swapId: string;

  // Transaction details
  source: {
    nodeId: string;
    market: string;
    kwhDeposited: number;
    localPrice: number;
  };

  target: {
    nodeId: string;
    market: string;
    kwhReceived: number;
    localPrice: number;
  };

  // Swap economics
  economics: {
    swapRate: number;
    nxusdValue: number;
    fees: number;
    priceImpact: string;
  };

  // Proof chain
  proof: {
    gridInjectionProof: string;
    mirrorPositionId: string;
    swapOrderId: string;
    polygonTxHash: string;
  };

  // Settlement
  settlement: {
    estimatedTime: string;
    path: string[];
    status: 'pending' | 'confirmed' | 'settled';
  };

  // Compliance certification
  sovereignCertification?: {
    certificationId: string;
    certificationHash: string;
    compliantFrameworks: string[];
  };
}

/**
 * Result of energy attestation (attest())
 */
export interface AttestResult {
  success: boolean;
  watermarkId: string;
  attestationId: string;

  // Energy details
  energy: {
    nodeId: string;
    sourceType: string;
    kwhAttested: number;
    productionTimestamp: string;
  };

  // Grid injection proof (HARD-BACKING)
  gridInjection: {
    proofId: string;
    meterDelta: number;
    gridOperator: string;
    verified: boolean;
  };

  // Sovereign certification
  sovereignCertification: {
    certificationId: string;
    certificationHash: string;
    expiresAt: string;

    compliance: {
      re100: { status: string; certificationId: string };
      cbam: { status: string; carbonAdjustment: number };
      esg: { rating: string; score: number };
      ghgProtocol: { status: string; scope2Emissions: number };
      sbti: { validationStatus: string; targetType: string };
    };
  };

  // Permanent record
  permanentRecord: {
    ipfsHash: string;
    arweaveId: string;
    polygonTxHash: string;
    polygonBlockNumber: number;
  };

  // Royalty info
  royaltyEarning: {
    estimatedEarnings: number;
    perVerification: number;
    currency: 'NXUSD';
  };
}

// ============================================================
// INPUT TYPES
// ============================================================

export interface SwapInput {
  source: string;           // Source node ID
  target: string;           // Target node ID
  amount: number;           // kWh to swap
  userAddress?: string;     // Optional wallet address
  useCase?: string;         // Optional use case description
  slippageTolerance?: number; // Max slippage (default 0.5%)
}

export interface AttestInput {
  nodeId: string;
  kwhProduced: number;
  sourceType: string;
  countryCode?: string;

  // Optional detailed readings
  inverterReadings?: Array<{
    inverterId: string;
    voltage: number;
    current: number;
    frequency: number;
    powerFactor: number;
    temperature: number;
  }>;

  // Optional weather data
  weatherConditions?: {
    irradiance?: number;
    windSpeed?: number;
    temperature: number;
    humidity: number;
  };

  // Meter readings for HARD-BACKING
  meterReadings?: {
    before: number;
    after: number;
    gridOperator: string;
  };
}

// ============================================================
// NODE & MARKET INFORMATION
// ============================================================

export interface NodeInfo {
  nodeId: string;
  name: string;
  region: string;
  country: string;
  market: string;
  capacity: number;
  sourceType: string;
  certificationLevel: 'standard' | 'premium' | 'sovereign';
  currentPrice: number;
  availableLiquidity: number;
  status: 'active' | 'maintenance' | 'offline';
}

export interface MarketInfo {
  market: string;
  name: string;
  region: string;
  currency: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  tradingHours: string;
}

// ============================================================
// FIELD NINE UNIFIED SDK CLASS
// ============================================================

export class FieldNineSDK {
  private config: Required<SDKConfig>;
  private isInitialized = false;

  // SDK version
  static readonly VERSION = '2.0.0';
  static readonly PROTOCOL = 'EPO-v2';

  constructor(config: SDKConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.fieldnine.io/v2',
      environment: config.environment || 'production',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      enableCompliance: config.enableCompliance ?? true,
      defaultCountry: config.defaultCountry || 'KR',
      webhookUrl: config.webhookUrl || '',
      debug: config.debug || false,
    };

    this.validateApiKey();
    this.isInitialized = true;

    if (this.config.debug) {
      console.log(`[FieldNine SDK] Initialized v${FieldNineSDK.VERSION}`);
      console.log(`[FieldNine SDK] Environment: ${this.config.environment}`);
      console.log(`[FieldNine SDK] Compliance: ${this.config.enableCompliance ? 'enabled' : 'disabled'}`);
    }
  }

  private validateApiKey(): void {
    if (!this.config.apiKey || !this.config.apiKey.startsWith('fn_epo_')) {
      throw new Error('Invalid API key format. Keys must start with "fn_epo_"');
    }
  }

  // ════════════════════════════════════════════════════════════
  // CORE FUNCTION 1: verify()
  // Authenticate energy provenance
  // ════════════════════════════════════════════════════════════

  /**
   * Verify energy provenance with optional compliance check
   *
   * @param watermarkId - EPO watermark ID to verify
   * @returns Verification result with proof and compliance status
   *
   * @example
   * ```typescript
   * const result = await sdk.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4');
   * if (result.success && result.compliance?.re100.status === 'compliant') {
   *   console.log('RE100 compliant energy verified!');
   * }
   * ```
   */
  async verify(watermarkId: string): Promise<VerifyResult> {
    this.ensureInitialized();

    if (this.config.debug) {
      console.log(`[FieldNine SDK] Verifying: ${watermarkId}`);
    }

    // Parse watermark
    const parsed = this.parseWatermarkId(watermarkId);
    if (!parsed) {
      throw new Error('Invalid watermark ID format');
    }

    // Simulate verification (in production, this calls the API)
    const verificationProof = keccak256(
      encodePacked(['string', 'uint256'], [watermarkId, BigInt(Date.now())])
    );

    const result: VerifyResult = {
      success: true,
      watermarkId,
      nodeId: parsed.nodeId,
      sourceType: 'solar',
      kwhVerified: 100 + Math.random() * 900,
      timestamp: new Date().toISOString(),

      proof: {
        attestationHash: parsed.hash,
        polygonTxHash: `0x${verificationProof.slice(2, 66)}`,
        blockNumber: 50000000 + Math.floor(Math.random() * 1000000),
        verificationProof,
      },

      royalty: {
        amount: 0.001,
        currency: 'NXUSD',
        tier: 'standard',
      },

      metadata: {
        region: 'Korea',
        certificationLevel: 'sovereign',
        carbonOffset: 0,
        gridOperator: 'KEPCO',
      },
    };

    // Add carbon offset for renewable sources
    result.metadata.carbonOffset = result.kwhVerified * 0.475;

    // Add compliance if enabled
    if (this.config.enableCompliance) {
      result.compliance = {
        re100: {
          status: 'compliant',
          certificationId: `RE100-${parsed.nodeId}-${Date.now()}`,
        },
        cbam: {
          status: 'exempt',
          carbonAdjustment: 0,
        },
        esg: {
          rating: 'AAA',
          score: 95,
        },
      };
    }

    return result;
  }

  /**
   * Batch verify multiple watermarks
   */
  async verifyBatch(watermarkIds: string[]): Promise<{
    results: VerifyResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      totalKwh: number;
      totalRoyalty: number;
    };
  }> {
    this.ensureInitialized();

    if (watermarkIds.length > 100) {
      throw new Error('Batch size limited to 100 watermarks');
    }

    const results = await Promise.all(
      watermarkIds.map(id => this.verify(id).catch(() => null))
    );

    const validResults = results.filter((r): r is VerifyResult => r !== null && r.success);

    return {
      results: validResults,
      summary: {
        total: watermarkIds.length,
        valid: validResults.length,
        invalid: watermarkIds.length - validResults.length,
        totalKwh: validResults.reduce((sum, r) => sum + r.kwhVerified, 0),
        totalRoyalty: validResults.reduce((sum, r) => sum + r.royalty.amount, 0),
      },
    };
  }

  // ════════════════════════════════════════════════════════════
  // CORE FUNCTION 2: swap()
  // Cross-border energy value transfer
  // ════════════════════════════════════════════════════════════

  /**
   * Execute cross-border energy swap
   *
   * @param input - Swap parameters
   * @returns Swap result with settlement details
   *
   * @example
   * ```typescript
   * // Seoul production → Sydney Tesla charging
   * const swap = await sdk.swap({
   *   source: 'YEONGDONG-001',
   *   target: 'AEMO-VIC-001',
   *   amount: 1000,
   *   useCase: 'Tesla Supercharger Payment',
   * });
   *
   * console.log(`Swapped ${swap.source.kwhDeposited} kWh → ${swap.target.kwhReceived} kWh`);
   * console.log(`NXUSD Value: $${swap.economics.nxusdValue}`);
   * ```
   */
  async swap(input: SwapInput): Promise<SwapResult> {
    this.ensureInitialized();

    const { source, target, amount, userAddress, useCase, slippageTolerance = 0.5 } = input;

    if (this.config.debug) {
      console.log(`[FieldNine SDK] Swap: ${source} → ${target}, ${amount} kWh`);
    }

    // Get node info (simulated)
    const sourceNode = this.getNodeInfo(source);
    const targetNode = this.getNodeInfo(target);

    // Calculate swap rate
    const swapRate = (sourceNode.currentPrice / targetNode.currentPrice) * 0.9975;
    const outputAmount = amount * swapRate;
    const nxusdValue = outputAmount * targetNode.currentPrice / 1000;
    const fees = amount * 0.0025;

    // Generate proofs
    const timestamp = Date.now();
    const swapId = `SWAP-${source}-${target}-${timestamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const gridInjectionProof = `GIP-${source}-${timestamp}`;
    const mirrorPositionId = `MP-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
    const swapOrderId = `SO-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
    const polygonTxHash = `0x${keccak256(encodePacked(['string', 'uint256'], [swapId, BigInt(timestamp)])).slice(2, 66)}`;

    const result: SwapResult = {
      success: true,
      swapId,

      source: {
        nodeId: source,
        market: sourceNode.market,
        kwhDeposited: amount,
        localPrice: sourceNode.currentPrice,
      },

      target: {
        nodeId: target,
        market: targetNode.market,
        kwhReceived: Math.round(outputAmount * 100) / 100,
        localPrice: targetNode.currentPrice,
      },

      economics: {
        swapRate: Math.round(swapRate * 10000) / 10000,
        nxusdValue: Math.round(nxusdValue * 100) / 100,
        fees: Math.round(fees * 100) / 100,
        priceImpact: amount > 10000 ? '< 0.5%' : '< 0.1%',
      },

      proof: {
        gridInjectionProof,
        mirrorPositionId,
        swapOrderId,
        polygonTxHash,
      },

      settlement: {
        estimatedTime: '~15 seconds',
        path: [sourceNode.market, targetNode.market],
        status: 'confirmed',
      },
    };

    // Add sovereign certification if compliance enabled
    if (this.config.enableCompliance) {
      result.sovereignCertification = {
        certificationId: `SVCERT-${source}-${timestamp}`,
        certificationHash: keccak256(encodePacked(['string', 'uint256'], [swapId, BigInt(amount)])),
        compliantFrameworks: ['RE100', 'CBAM', 'ESG', 'GHG Protocol', 'SBTi'],
      };
    }

    return result;
  }

  /**
   * Get swap quote without executing
   */
  async getSwapQuote(source: string, target: string, amount: number): Promise<{
    inputAmount: number;
    outputAmount: number;
    swapRate: number;
    fees: number;
    nxusdValue: number;
    priceImpact: string;
    validFor: string;
  }> {
    const sourceNode = this.getNodeInfo(source);
    const targetNode = this.getNodeInfo(target);

    const swapRate = (sourceNode.currentPrice / targetNode.currentPrice) * 0.9975;
    const outputAmount = amount * swapRate;
    const nxusdValue = outputAmount * targetNode.currentPrice / 1000;

    return {
      inputAmount: amount,
      outputAmount: Math.round(outputAmount * 100) / 100,
      swapRate: Math.round(swapRate * 10000) / 10000,
      fees: Math.round(amount * 0.0025 * 100) / 100,
      nxusdValue: Math.round(nxusdValue * 100) / 100,
      priceImpact: amount > 10000 ? '< 0.5%' : '< 0.1%',
      validFor: '30 seconds',
    };
  }

  // ════════════════════════════════════════════════════════════
  // CORE FUNCTION 3: attest()
  // Generate sovereign certification
  // ════════════════════════════════════════════════════════════

  /**
   * Attest energy production and generate sovereign certification
   *
   * @param input - Attestation parameters
   * @returns Attestation result with sovereign certification
   *
   * @example
   * ```typescript
   * const cert = await sdk.attest({
   *   nodeId: 'YEONGDONG-001',
   *   kwhProduced: 5000,
   *   sourceType: 'solar',
   *   countryCode: 'KR',
   *   meterReadings: {
   *     before: 1000000,
   *     after: 1005000,
   *     gridOperator: 'KEPCO',
   *   },
   * });
   *
   * console.log(`Certification: ${cert.sovereignCertification.certificationId}`);
   * console.log(`ESG Rating: ${cert.sovereignCertification.compliance.esg.rating}`);
   * ```
   */
  async attest(input: AttestInput): Promise<AttestResult> {
    this.ensureInitialized();

    const {
      nodeId,
      kwhProduced,
      sourceType,
      countryCode = this.config.defaultCountry,
      meterReadings,
    } = input;

    if (this.config.debug) {
      console.log(`[FieldNine SDK] Attesting: ${nodeId}, ${kwhProduced} kWh ${sourceType}`);
    }

    const timestamp = Date.now();
    const watermarkId = `EPO-${nodeId}-${timestamp}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const attestationId = `ATT-${nodeId}-${timestamp}`;
    const gridInjectionProofId = `GIP-${nodeId}-${timestamp}`;
    const certificationId = `SVCERT-${nodeId}-${timestamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Generate certification hash
    const certificationHash = keccak256(
      encodePacked(
        ['string', 'string', 'string', 'uint256', 'uint256'],
        [certificationId, nodeId, sourceType, BigInt(Math.floor(kwhProduced)), BigInt(timestamp)]
      )
    );

    // Check if renewable
    const isRenewable = ['solar', 'wind', 'hydro'].includes(sourceType.toLowerCase());
    const carbonEmissions = isRenewable ? 0 : (kwhProduced * 475) / 1000; // kg CO2

    const result: AttestResult = {
      success: true,
      watermarkId,
      attestationId,

      energy: {
        nodeId,
        sourceType,
        kwhAttested: kwhProduced,
        productionTimestamp: new Date(timestamp).toISOString(),
      },

      gridInjection: {
        proofId: gridInjectionProofId,
        meterDelta: meterReadings ? meterReadings.after - meterReadings.before : kwhProduced,
        gridOperator: meterReadings?.gridOperator || 'KEPCO',
        verified: true,
      },

      sovereignCertification: {
        certificationId,
        certificationHash,
        expiresAt: new Date(timestamp + 365 * 24 * 60 * 60 * 1000).toISOString(),

        compliance: {
          re100: {
            status: isRenewable ? 'compliant' : 'non-compliant',
            certificationId: `RE100-${nodeId}-${timestamp}`,
          },
          cbam: {
            status: isRenewable ? 'exempt' : 'verified',
            carbonAdjustment: carbonEmissions * 0.085, // EUR/kg CO2
          },
          esg: {
            rating: isRenewable ? 'AAA' : 'BBB',
            score: isRenewable ? 95 : 65,
          },
          ghgProtocol: {
            status: isRenewable ? 'achieved' : 'on-track',
            scope2Emissions: carbonEmissions,
          },
          sbti: {
            validationStatus: isRenewable ? 'validated' : 'targets-set',
            targetType: '1.5C',
          },
        },
      },

      permanentRecord: {
        ipfsHash: `Qm${certificationHash.slice(2, 48)}`,
        arweaveId: certificationHash.slice(2, 45),
        polygonTxHash: `0x${certificationHash.slice(2, 66)}`,
        polygonBlockNumber: 50000000 + Math.floor(Math.random() * 1000000),
      },

      royaltyEarning: {
        estimatedEarnings: kwhProduced * 0.001 * 0.7, // 70% to node operator
        perVerification: 0.0007,
        currency: 'NXUSD',
      },
    };

    return result;
  }

  // ════════════════════════════════════════════════════════════
  // NODE & MARKET METHODS
  // ════════════════════════════════════════════════════════════

  /**
   * Get information about a specific node
   */
  getNodeInfo(nodeId: string): NodeInfo {
    // Simulated node data (in production, this would be fetched from API)
    const nodes: Record<string, NodeInfo> = {
      'YEONGDONG-001': {
        nodeId: 'YEONGDONG-001',
        name: 'Yeongdong Energy Node #1',
        region: 'Korea',
        country: 'KR',
        market: 'JEPX',
        capacity: 70000,
        sourceType: 'solar',
        certificationLevel: 'sovereign',
        currentPrice: 85.50,
        availableLiquidity: 15000000,
        status: 'active',
      },
      'PJM-EAST-001': {
        nodeId: 'PJM-EAST-001',
        name: 'PJM East Hub',
        region: 'USA-East',
        country: 'US',
        market: 'PJM',
        capacity: 150000,
        sourceType: 'wind',
        certificationLevel: 'premium',
        currentPrice: 42.30,
        availableLiquidity: 35000000,
        status: 'active',
      },
      'AEMO-VIC-001': {
        nodeId: 'AEMO-VIC-001',
        name: 'Victoria Node',
        region: 'Australia',
        country: 'AU',
        market: 'AEMO',
        capacity: 80000,
        sourceType: 'solar',
        certificationLevel: 'premium',
        currentPrice: 65.80,
        availableLiquidity: 18000000,
        status: 'active',
      },
      'EPEX-DE-001': {
        nodeId: 'EPEX-DE-001',
        name: 'Germany Central',
        region: 'EU',
        country: 'DE',
        market: 'EPEX',
        capacity: 120000,
        sourceType: 'wind',
        certificationLevel: 'premium',
        currentPrice: 78.20,
        availableLiquidity: 28000000,
        status: 'active',
      },
    };

    return nodes[nodeId] || {
      nodeId,
      name: 'Unknown Node',
      region: 'Unknown',
      country: 'XX',
      market: 'UNKNOWN',
      capacity: 0,
      sourceType: 'unknown',
      certificationLevel: 'standard',
      currentPrice: 50,
      availableLiquidity: 0,
      status: 'offline',
    };
  }

  /**
   * List all available nodes
   */
  async listNodes(options?: {
    region?: string;
    market?: string;
    sourceType?: string;
    status?: 'active' | 'all';
  }): Promise<NodeInfo[]> {
    const allNodes = [
      this.getNodeInfo('YEONGDONG-001'),
      this.getNodeInfo('PJM-EAST-001'),
      this.getNodeInfo('AEMO-VIC-001'),
      this.getNodeInfo('EPEX-DE-001'),
    ];

    let filtered = allNodes;

    if (options?.region) {
      filtered = filtered.filter(n => n.region.toLowerCase().includes(options.region!.toLowerCase()));
    }
    if (options?.market) {
      filtered = filtered.filter(n => n.market === options.market);
    }
    if (options?.sourceType) {
      filtered = filtered.filter(n => n.sourceType === options.sourceType);
    }
    if (options?.status === 'active') {
      filtered = filtered.filter(n => n.status === 'active');
    }

    return filtered;
  }

  /**
   * Get market information
   */
  async getMarkets(): Promise<MarketInfo[]> {
    return [
      {
        market: 'JEPX',
        name: 'Japan Electric Power Exchange',
        region: 'Asia-Pacific',
        currency: 'JPY',
        currentPrice: 12500,
        priceChange24h: 2.3,
        volume24h: 5200000,
        liquidity: 45000000,
        tradingHours: '09:00-15:00 JST',
      },
      {
        market: 'PJM',
        name: 'PJM Interconnection',
        region: 'North America',
        currency: 'USD',
        currentPrice: 42.30,
        priceChange24h: -1.2,
        volume24h: 8500000,
        liquidity: 65000000,
        tradingHours: '24/7',
      },
      {
        market: 'AEMO',
        name: 'Australian Energy Market Operator',
        region: 'Asia-Pacific',
        currency: 'AUD',
        currentPrice: 65.80,
        priceChange24h: 3.5,
        volume24h: 3200000,
        liquidity: 28000000,
        tradingHours: '24/7',
      },
      {
        market: 'EPEX',
        name: 'European Power Exchange',
        region: 'Europe',
        currency: 'EUR',
        currentPrice: 78.20,
        priceChange24h: -0.8,
        volume24h: 6800000,
        liquidity: 52000000,
        tradingHours: '24/7',
      },
    ];
  }

  // ════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ════════════════════════════════════════════════════════════

  /**
   * Parse watermark ID into components
   */
  parseWatermarkId(watermarkId: string): {
    nodeId: string;
    timestamp: number;
    hash: string;
  } | null {
    const match = watermarkId.match(/^EPO-(.+)-(\d+)-([A-Z0-9]+)$/);
    if (!match) return null;

    return {
      nodeId: match[1],
      timestamp: parseInt(match[2], 10),
      hash: match[3],
    };
  }

  /**
   * Calculate carbon offset for energy amount
   */
  calculateCarbonOffset(kwhAmount: number, sourceType: string): number {
    const renewableSources = ['solar', 'wind', 'hydro'];
    if (renewableSources.includes(sourceType.toLowerCase())) {
      return kwhAmount * 0.475; // kg CO2
    }
    return 0;
  }

  /**
   * Get SDK status
   */
  getStatus(): {
    initialized: boolean;
    version: string;
    environment: string;
    complianceEnabled: boolean;
  } {
    return {
      initialized: this.isInitialized,
      version: FieldNineSDK.VERSION,
      environment: this.config.environment,
      complianceEnabled: this.config.enableCompliance,
    };
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Check your API key.');
    }
  }
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Create SDK instance with default configuration
 */
export function createSDK(apiKey: string, options?: Partial<SDKConfig>): FieldNineSDK {
  return new FieldNineSDK({ apiKey, ...options });
}

/**
 * Quick verify without creating SDK instance
 */
export async function quickVerify(apiKey: string, watermarkId: string): Promise<VerifyResult> {
  const sdk = new FieldNineSDK({ apiKey });
  return sdk.verify(watermarkId);
}

/**
 * Quick swap without creating SDK instance
 */
export async function quickSwap(apiKey: string, input: SwapInput): Promise<SwapResult> {
  const sdk = new FieldNineSDK({ apiKey });
  return sdk.swap(input);
}

/**
 * Quick attest without creating SDK instance
 */
export async function quickAttest(apiKey: string, input: AttestInput): Promise<AttestResult> {
  const sdk = new FieldNineSDK({ apiKey });
  return sdk.attest(input);
}

// Default export
export default FieldNineSDK;
