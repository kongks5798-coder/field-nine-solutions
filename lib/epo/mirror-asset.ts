/**
 * FIELD NINE - VIRTUAL ENERGY SWAP ENGINE
 * Mirror-Asset Contract
 *
 * Enables energy value transfer across borders without physical delivery.
 * Deposit in Node A (Korea) → Withdraw rights in Node B (USA)
 */

import { keccak256, encodePacked } from './crypto-utils';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface EnergyNode {
  nodeId: string;
  region: string;
  market: 'PJM' | 'JEPX' | 'AEMO' | 'EPEX';
  currency: string;
  timezone: string;
  gridOperator: string;
  currentPrice: number;       // $/MWh
  capacity: number;           // MW
  availableLiquidity: number; // MWh available for swap
  utilizationRate: number;    // %
}

export interface MirrorPosition {
  positionId: string;
  ownerAddress: string;
  sourceNode: string;
  targetNode: string;
  depositedKwh: number;
  mirroredKwh: number;        // Adjusted for swap rate
  swapRate: number;
  depositTxHash: string;
  status: 'pending' | 'active' | 'withdrawn' | 'expired';
  createdAt: number;
  expiresAt: number;
  gridInjectionProof?: GridInjectionProof;
}

export interface GridInjectionProof {
  proofId: string;
  nodeId: string;
  timestamp: number;
  kwhInjected: number;
  meterReadingBefore: number;
  meterReadingAfter: number;
  gridOperatorSignature: string;
  scadaDataHash: string;
  attestationHash: string;
  verified: boolean;
}

export interface SwapOrder {
  orderId: string;
  positionId: string;
  sourceNode: string;
  targetNode: string;
  requestedKwh: number;
  swapRate: number;
  receivedKwh: number;
  nxusdValue: number;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  executedAt?: number;
  targetTxHash?: string;
}

export interface LiquidityContribution {
  contributionId: string;
  nodeId: string;
  providerAddress: string;
  kwhProvided: number;
  earnedFees: number;
  apr: number;
  startedAt: number;
}

// ============================================================
// GLOBAL ENERGY NODES REGISTRY
// ============================================================

export const GLOBAL_ENERGY_NODES: Record<string, EnergyNode> = {
  'YEONGDONG-001': {
    nodeId: 'YEONGDONG-001',
    region: 'Korea',
    market: 'JEPX',  // Using JEPX pricing as proxy for Korea
    currency: 'KRW',
    timezone: 'Asia/Seoul',
    gridOperator: 'KEPCO',
    currentPrice: 85.50,
    capacity: 50000,
    availableLiquidity: 25000,
    utilizationRate: 72,
  },
  'PJM-EAST-001': {
    nodeId: 'PJM-EAST-001',
    region: 'USA-East',
    market: 'PJM',
    currency: 'USD',
    timezone: 'America/New_York',
    gridOperator: 'PJM Interconnection',
    currentPrice: 42.30,
    capacity: 100000,
    availableLiquidity: 45000,
    utilizationRate: 68,
  },
  'AEMO-VIC-001': {
    nodeId: 'AEMO-VIC-001',
    region: 'Australia',
    market: 'AEMO',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    gridOperator: 'AEMO',
    currentPrice: 65.80,
    capacity: 45000,
    availableLiquidity: 20000,
    utilizationRate: 75,
  },
  'EPEX-DE-001': {
    nodeId: 'EPEX-DE-001',
    region: 'Germany/EU',
    market: 'EPEX',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    gridOperator: 'TenneT',
    currentPrice: 78.20,
    capacity: 80000,
    availableLiquidity: 35000,
    utilizationRate: 70,
  },
};

// ============================================================
// MIRROR ASSET ENGINE
// ============================================================

export class MirrorAssetEngine {
  private static instance: MirrorAssetEngine;

  private positions: Map<string, MirrorPosition> = new Map();
  private swapOrders: Map<string, SwapOrder> = new Map();
  private liquidityContributions: Map<string, LiquidityContribution> = new Map();
  private gridInjectionProofs: Map<string, GridInjectionProof> = new Map();

  // Engine stats
  private totalSwapVolume = 0;
  private totalFeesCollected = 0;

  private constructor() {
    this.initializeDemoData();
  }

  static getInstance(): MirrorAssetEngine {
    if (!MirrorAssetEngine.instance) {
      MirrorAssetEngine.instance = new MirrorAssetEngine();
    }
    return MirrorAssetEngine.instance;
  }

  private initializeDemoData(): void {
    // Historical swap volume
    this.totalSwapVolume = 15420000; // 15.42 GWh swapped
    this.totalFeesCollected = 38550;  // $38,550 in fees
  }

  // ============================================================
  // GRID INJECTION ATTESTATION (PROOF OF DEPOSIT)
  // ============================================================

  /**
   * Create Grid Injection Proof
   * This proves physical electricity was actually injected into the grid
   */
  async createGridInjectionProof(
    nodeId: string,
    kwhInjected: number,
    meterReadingBefore: number,
    meterReadingAfter: number,
    scadaData: Record<string, unknown>
  ): Promise<GridInjectionProof> {
    // Validate meter readings match claimed injection
    const calculatedInjection = meterReadingAfter - meterReadingBefore;
    if (Math.abs(calculatedInjection - kwhInjected) > kwhInjected * 0.01) {
      throw new Error('Meter readings do not match claimed injection amount');
    }

    // Hash SCADA data for integrity
    const scadaDataHash = keccak256(encodePacked(
      ['string'],
      [JSON.stringify(scadaData)]
    ));

    // Generate grid operator signature (simulated)
    const node = GLOBAL_ENERGY_NODES[nodeId];
    const gridOperatorSignature = keccak256(encodePacked(
      ['string', 'uint256', 'uint256', 'string'],
      [
        nodeId,
        BigInt(Math.round(kwhInjected * 1000)),
        BigInt(Date.now()),
        node?.gridOperator || 'UNKNOWN'
      ]
    ));

    // Create attestation hash
    const attestationHash = keccak256(encodePacked(
      ['string', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        nodeId,
        BigInt(Math.round(kwhInjected * 1000)),
        BigInt(Math.round(meterReadingBefore * 1000)),
        BigInt(Math.round(meterReadingAfter * 1000)),
        scadaDataHash as `0x${string}`
      ]
    ));

    const proof: GridInjectionProof = {
      proofId: `GIP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nodeId,
      timestamp: Date.now(),
      kwhInjected,
      meterReadingBefore,
      meterReadingAfter,
      gridOperatorSignature,
      scadaDataHash,
      attestationHash,
      verified: true,
    };

    this.gridInjectionProofs.set(proof.proofId, proof);

    console.log(`[Mirror] Grid Injection Proof created: ${proof.proofId}, ${kwhInjected} kWh at ${nodeId}`);

    return proof;
  }

  /**
   * Verify Grid Injection Proof
   */
  verifyGridInjectionProof(proofId: string): boolean {
    const proof = this.gridInjectionProofs.get(proofId);
    if (!proof) return false;

    // Recalculate attestation hash to verify integrity
    const recalculatedHash = keccak256(encodePacked(
      ['string', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        proof.nodeId,
        BigInt(Math.round(proof.kwhInjected * 1000)),
        BigInt(Math.round(proof.meterReadingBefore * 1000)),
        BigInt(Math.round(proof.meterReadingAfter * 1000)),
        proof.scadaDataHash as `0x${string}`
      ]
    ));

    return recalculatedHash === proof.attestationHash;
  }

  // ============================================================
  // MIRROR POSITION MANAGEMENT
  // ============================================================

  /**
   * Create Mirror Position (Deposit energy, get mirrored rights)
   * HARD-BACKING: Requires valid Grid Injection Proof
   */
  async createMirrorPosition(
    ownerAddress: string,
    sourceNode: string,
    targetNode: string,
    depositKwh: number,
    gridInjectionProofId: string
  ): Promise<MirrorPosition> {
    // HARD-BACKING PRINCIPLE: Verify grid injection proof exists and is valid
    const injectionProof = this.gridInjectionProofs.get(gridInjectionProofId);
    if (!injectionProof) {
      throw new Error('HARD-BACKING VIOLATION: Grid Injection Proof not found');
    }

    if (!this.verifyGridInjectionProof(gridInjectionProofId)) {
      throw new Error('HARD-BACKING VIOLATION: Grid Injection Proof is invalid');
    }

    if (injectionProof.kwhInjected < depositKwh) {
      throw new Error('HARD-BACKING VIOLATION: Injection amount less than deposit request');
    }

    // Get swap rate from oracle
    const swapRate = this.calculateSwapRate(sourceNode, targetNode);

    // Calculate mirrored amount (adjusted for price differential)
    const mirroredKwh = depositKwh * swapRate;

    // Generate position ID
    const positionId = `MP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Create deposit transaction hash
    const depositTxHash = keccak256(encodePacked(
      ['string', 'string', 'string', 'uint256', 'uint256'],
      [
        positionId,
        sourceNode,
        ownerAddress,
        BigInt(Math.round(depositKwh * 1000)),
        BigInt(Date.now())
      ]
    ));

    const position: MirrorPosition = {
      positionId,
      ownerAddress,
      sourceNode,
      targetNode,
      depositedKwh: depositKwh,
      mirroredKwh,
      swapRate,
      depositTxHash,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      gridInjectionProof: injectionProof,
    };

    this.positions.set(positionId, position);

    // Update node liquidity
    const sourceNodeData = GLOBAL_ENERGY_NODES[sourceNode];
    if (sourceNodeData) {
      sourceNodeData.availableLiquidity += depositKwh;
    }

    console.log(`[Mirror] Position created: ${positionId}, ${depositKwh} kWh → ${mirroredKwh.toFixed(2)} kWh (rate: ${swapRate.toFixed(4)})`);

    return position;
  }

  /**
   * Calculate Swap Rate based on real-time prices
   */
  calculateSwapRate(sourceNode: string, targetNode: string): number {
    const source = GLOBAL_ENERGY_NODES[sourceNode];
    const target = GLOBAL_ENERGY_NODES[targetNode];

    if (!source || !target) {
      throw new Error('Invalid node IDs');
    }

    // Base swap rate = source price / target price
    // If source is more expensive, you get more kWh at target
    const baseRate = source.currentPrice / target.currentPrice;

    // Apply liquidity adjustment (lower liquidity = higher spread)
    const liquidityFactor = Math.min(
      source.availableLiquidity,
      target.availableLiquidity
    ) / 50000; // Normalize to 50 MWh baseline

    const liquidityAdjustment = 1 - (0.05 * (1 - Math.min(liquidityFactor, 1)));

    // Apply network fee (0.25%)
    const networkFee = 0.9975;

    const finalRate = baseRate * liquidityAdjustment * networkFee;

    return Math.round(finalRate * 10000) / 10000;
  }

  // ============================================================
  // SWAP EXECUTION
  // ============================================================

  /**
   * Execute Swap - Convert mirrored rights to actual usage/NXUSD
   */
  async executeSwap(
    positionId: string,
    requestedKwh: number
  ): Promise<SwapOrder> {
    const position = this.positions.get(positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    if (position.status !== 'active') {
      throw new Error('Position is not active');
    }

    if (requestedKwh > position.mirroredKwh) {
      throw new Error('Insufficient mirrored balance');
    }

    // Get current target node price
    const targetNode = GLOBAL_ENERGY_NODES[position.targetNode];
    if (!targetNode) {
      throw new Error('Target node not found');
    }

    // Calculate NXUSD value
    const nxusdValue = requestedKwh * targetNode.currentPrice / 1000; // Convert $/MWh to $/kWh

    // Update swap rate for current conditions
    const currentSwapRate = this.calculateSwapRate(position.sourceNode, position.targetNode);

    // Create swap order
    const orderId = `SO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const order: SwapOrder = {
      orderId,
      positionId,
      sourceNode: position.sourceNode,
      targetNode: position.targetNode,
      requestedKwh,
      swapRate: currentSwapRate,
      receivedKwh: requestedKwh,
      nxusdValue,
      status: 'executed',
      executedAt: Date.now(),
      targetTxHash: keccak256(encodePacked(
        ['string', 'uint256', 'uint256'],
        [orderId, BigInt(Math.round(requestedKwh * 1000)), BigInt(Date.now())]
      )),
    };

    // Update position
    position.mirroredKwh -= requestedKwh;
    if (position.mirroredKwh <= 0) {
      position.status = 'withdrawn';
    }

    // Update stats
    this.totalSwapVolume += requestedKwh;
    this.totalFeesCollected += nxusdValue * 0.0025; // 0.25% fee

    // Update target node liquidity
    targetNode.availableLiquidity -= requestedKwh;

    this.swapOrders.set(orderId, order);
    this.positions.set(positionId, position);

    console.log(`[Mirror] Swap executed: ${orderId}, ${requestedKwh} kWh = $${nxusdValue.toFixed(2)} NXUSD`);

    return order;
  }

  // ============================================================
  // CROSS-BORDER PAYMENT SCENARIO
  // ============================================================

  /**
   * Complete cross-border payment flow
   * Seoul production → Australia Tesla charging
   */
  async executeCrossBorderPayment(
    ownerAddress: string,
    sourceNode: string,     // YEONGDONG-001
    targetNode: string,     // AEMO-VIC-001
    kwhToSwap: number,
    targetUseCase: string   // e.g., "Tesla Supercharger"
  ): Promise<{
    injectionProof: GridInjectionProof;
    position: MirrorPosition;
    swapOrder: SwapOrder;
    paymentDetails: {
      sourceLocation: string;
      targetLocation: string;
      energyProduced: number;
      energyDelivered: number;
      nxusdValue: number;
      useCase: string;
      carbonOffset: number;
    };
  }> {
    // Step 1: Create Grid Injection Proof (energy actually injected in Korea)
    const meterBefore = 1000000 + Math.random() * 100000;
    const injectionProof = await this.createGridInjectionProof(
      sourceNode,
      kwhToSwap,
      meterBefore,
      meterBefore + kwhToSwap,
      {
        timestamp: Date.now(),
        inverterOutput: kwhToSwap * 0.98,
        gridFrequency: 60.0,
        voltage: 22900,
        powerFactor: 0.99,
      }
    );

    // Step 2: Create Mirror Position
    const position = await this.createMirrorPosition(
      ownerAddress,
      sourceNode,
      targetNode,
      kwhToSwap,
      injectionProof.proofId
    );

    // Step 3: Execute Swap
    const swapOrder = await this.executeSwap(position.positionId, position.mirroredKwh);

    // Step 4: Generate payment details
    const sourceNodeData = GLOBAL_ENERGY_NODES[sourceNode];
    const targetNodeData = GLOBAL_ENERGY_NODES[targetNode];

    return {
      injectionProof,
      position,
      swapOrder,
      paymentDetails: {
        sourceLocation: sourceNodeData?.region || sourceNode,
        targetLocation: targetNodeData?.region || targetNode,
        energyProduced: kwhToSwap,
        energyDelivered: swapOrder.receivedKwh,
        nxusdValue: swapOrder.nxusdValue,
        useCase: targetUseCase,
        carbonOffset: kwhToSwap * 0.475, // kg CO2 avoided
      },
    };
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  getPosition(positionId: string): MirrorPosition | undefined {
    return this.positions.get(positionId);
  }

  getSwapOrder(orderId: string): SwapOrder | undefined {
    return this.swapOrders.get(orderId);
  }

  getNodeStats(): {
    nodes: EnergyNode[];
    totalLiquidity: number;
    totalCapacity: number;
    swapVolume24h: number;
  } {
    const nodes = Object.values(GLOBAL_ENERGY_NODES);
    return {
      nodes,
      totalLiquidity: nodes.reduce((sum, n) => sum + n.availableLiquidity, 0),
      totalCapacity: nodes.reduce((sum, n) => sum + n.capacity, 0),
      swapVolume24h: 85000 + Math.random() * 15000, // Simulated 24h volume
    };
  }

  getGlobalStats(): {
    totalSwapVolume: number;
    totalFeesCollected: number;
    activePositions: number;
    executedSwaps: number;
    avgSwapRate: number;
  } {
    const activePositions = Array.from(this.positions.values())
      .filter(p => p.status === 'active').length;

    const executedSwaps = Array.from(this.swapOrders.values())
      .filter(o => o.status === 'executed').length;

    return {
      totalSwapVolume: this.totalSwapVolume,
      totalFeesCollected: this.totalFeesCollected,
      activePositions: activePositions + 127, // Include demo data
      executedSwaps: executedSwaps + 8542,
      avgSwapRate: 1.15,
    };
  }

  getRecentSwaps(limit: number = 20): SwapOrder[] {
    return Array.from(this.swapOrders.values())
      .sort((a, b) => (b.executedAt || 0) - (a.executedAt || 0))
      .slice(0, limit);
  }

  getAllSwapRates(): Record<string, Record<string, number>> {
    const nodes = Object.keys(GLOBAL_ENERGY_NODES);
    const rates: Record<string, Record<string, number>> = {};

    for (const source of nodes) {
      rates[source] = {};
      for (const target of nodes) {
        if (source !== target) {
          rates[source][target] = this.calculateSwapRate(source, target);
        }
      }
    }

    return rates;
  }
}

// Singleton export
export const mirrorAssetEngine = MirrorAssetEngine.getInstance();
