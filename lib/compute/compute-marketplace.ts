/**
 * K-AUS COMPUTE MARKETPLACE
 *
 * 연산력 거래소 - Compute Bidding API
 * - K-AUS 지불로 연산력 임대
 * - 0.5% 정산 수수료 즉시 소각
 * - 실시간 입찰 시스템
 */

import {
  energyHashrateMapper,
  GPUType,
  WorkloadType,
  VirtualGPUNode,
  COMPUTE_CONFIG,
} from './energy-hashrate-mapping';

// Marketplace Configuration
export const MARKETPLACE_CONFIG = {
  // Settlement fee (0.5% burned)
  SETTLEMENT_FEE_RATE: 0.005,

  // Minimum bid amounts (K-AUS)
  MIN_BID: {
    H100: 10,
    A100: 5,
    RTX4090: 3,
    L40S: 2.5,
    MI300X: 9,
  } as Record<GPUType, number>,

  // Base hourly rate per TFLOPS (K-AUS)
  BASE_RATE_PER_TFLOPS: 0.001,

  // Demand multiplier ranges
  DEMAND_MULTIPLIER: {
    LOW: 0.8,      // <30% utilization
    NORMAL: 1.0,   // 30-70% utilization
    HIGH: 1.5,     // 70-90% utilization
    SURGE: 2.5,    // >90% utilization
  },

  // Priority multipliers
  PRIORITY_MULTIPLIER: {
    STANDARD: 1.0,
    PRIORITY: 1.3,
    URGENT: 2.0,
    RESERVED: 0.9, // Discount for reserved capacity
  },

  // Maximum bid duration (hours)
  MAX_BID_DURATION: 720, // 30 days

  // Auction duration (seconds)
  AUCTION_DURATION: 300, // 5 minutes
};

// Bid Status
export type BidStatus = 'PENDING' | 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';
export type BidPriority = 'STANDARD' | 'PRIORITY' | 'URGENT' | 'RESERVED';

// Compute Bid
export interface ComputeBid {
  bidId: string;
  clientId: string;
  clientName: string;
  gpuType: GPUType;
  requestedTFLOPS: number;
  requestedGPUs: number;
  workloadType: WorkloadType;
  priority: BidPriority;
  maxKausPerHour: number;
  minDurationHours: number;
  maxDurationHours: number;
  totalKausBudget: number;
  status: BidStatus;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  completedAt?: number;
  assignedNodeId?: string;
  actualKausSpent?: number;
  burnedKaus?: number;
}

// Compute Order (Accepted Bid)
export interface ComputeOrder {
  orderId: string;
  bidId: string;
  clientId: string;
  nodeId: string;
  gpuType: GPUType;
  allocatedTFLOPS: number;
  allocatedGPUs: number;
  workloadType: WorkloadType;
  kausPerHour: number;
  startTime: number;
  endTime: number;
  totalKaus: number;
  settlementFee: number;
  burnedKaus: number;
  status: 'RUNNING' | 'COMPLETED' | 'TERMINATED';
}

// Market Stats
export interface MarketStats {
  totalBids: number;
  activeBids: number;
  completedOrders: number;
  totalVolumeKaus: number;
  totalBurnedKaus: number;
  averageKausPerTFLOPSHour: number;
  currentDemandLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'SURGE';
  topGPUDemand: GPUType;
  marketCapKaus: number;
}

// Price Quote
export interface PriceQuote {
  gpuType: GPUType;
  requestedTFLOPS: number;
  duration: number;
  basePrice: number;
  demandMultiplier: number;
  priorityMultiplier: number;
  totalPrice: number;
  settlementFee: number;
  effectivePrice: number;
  availability: number; // 0-1
  estimatedWaitMinutes: number;
}

class ComputeMarketplace {
  private bids: Map<string, ComputeBid> = new Map();
  private orders: Map<string, ComputeOrder> = new Map();
  private totalVolumeKaus = 0;
  private totalBurnedKaus = 0;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock historical data
    const mockClients = [
      { id: 'CL-001', name: 'OpenAI Korea' },
      { id: 'CL-002', name: 'Samsung SDS AI Lab' },
      { id: 'CL-003', name: 'Hyundai AutonoMI' },
      { id: 'CL-004', name: 'NAVER Cloud AI' },
      { id: 'CL-005', name: 'Kakao Brain' },
      { id: 'CL-006', name: 'LG AI Research' },
      { id: 'CL-007', name: 'SK Telecom AI' },
      { id: 'CL-008', name: 'DeepMind Asia' },
      { id: 'CL-009', name: 'Anthropic APAC' },
      { id: 'CL-010', name: 'Meta AI Korea' },
    ];

    const gpuTypes: GPUType[] = ['H100', 'A100', 'MI300X', 'RTX4090', 'L40S'];
    const workloadTypes: WorkloadType[] = ['TRAINING', 'INFERENCE', 'RENDERING', 'SCIENTIFIC'];

    // Generate mock bids
    for (let i = 0; i < 50; i++) {
      const client = mockClients[Math.floor(Math.random() * mockClients.length)];
      const gpuType = gpuTypes[Math.floor(Math.random() * gpuTypes.length)];
      const workloadType = workloadTypes[Math.floor(Math.random() * workloadTypes.length)];
      const status: BidStatus = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'PENDING'][
        Math.floor(Math.random() * 5)
      ] as BidStatus;

      const tflops = COMPUTE_CONFIG.GPU_TFLOPS[gpuType];
      const gpuCount = Math.floor(Math.random() * 64) + 8;
      const duration = Math.floor(Math.random() * 168) + 1; // 1-168 hours
      const kausPerHour = this.calculateBasePrice(gpuType, tflops * gpuCount, 'STANDARD');
      const totalKaus = kausPerHour * duration;

      const bid: ComputeBid = {
        bidId: `BID-${Date.now()}-${i.toString().padStart(3, '0')}`,
        clientId: client.id,
        clientName: client.name,
        gpuType,
        requestedTFLOPS: tflops * gpuCount,
        requestedGPUs: gpuCount,
        workloadType,
        priority: ['STANDARD', 'PRIORITY', 'URGENT'][Math.floor(Math.random() * 3)] as BidPriority,
        maxKausPerHour: kausPerHour * 1.2,
        minDurationHours: 1,
        maxDurationHours: duration,
        totalKausBudget: totalKaus * 1.5,
        status,
        createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() + Math.random() * 24 * 60 * 60 * 1000,
      };

      if (status === 'COMPLETED') {
        bid.actualKausSpent = totalKaus;
        bid.burnedKaus = totalKaus * MARKETPLACE_CONFIG.SETTLEMENT_FEE_RATE;
        this.totalVolumeKaus += totalKaus;
        this.totalBurnedKaus += bid.burnedKaus;
      }

      this.bids.set(bid.bidId, bid);
    }
  }

  /**
   * Calculate base price for compute
   */
  private calculateBasePrice(
    gpuType: GPUType,
    tflops: number,
    priority: BidPriority
  ): number {
    const baseRate = MARKETPLACE_CONFIG.BASE_RATE_PER_TFLOPS;
    const minBid = MARKETPLACE_CONFIG.MIN_BID[gpuType];
    const priorityMultiplier = MARKETPLACE_CONFIG.PRIORITY_MULTIPLIER[priority];

    // GPU premium multiplier
    const gpuPremium: Record<GPUType, number> = {
      H100: 2.5,
      MI300X: 2.2,
      A100: 1.5,
      L40S: 1.2,
      RTX4090: 1.0,
    };

    const price = Math.max(
      minBid,
      tflops * baseRate * gpuPremium[gpuType] * priorityMultiplier
    );

    return Math.round(price * 1000) / 1000; // Round to 3 decimals
  }

  /**
   * Get current demand multiplier
   */
  private getDemandMultiplier(): { multiplier: number; level: 'LOW' | 'NORMAL' | 'HIGH' | 'SURGE' } {
    const stats = energyHashrateMapper.getGlobalStats();
    const utilization = stats.averageUtilization;

    if (utilization < 0.3) {
      return { multiplier: MARKETPLACE_CONFIG.DEMAND_MULTIPLIER.LOW, level: 'LOW' };
    } else if (utilization < 0.7) {
      return { multiplier: MARKETPLACE_CONFIG.DEMAND_MULTIPLIER.NORMAL, level: 'NORMAL' };
    } else if (utilization < 0.9) {
      return { multiplier: MARKETPLACE_CONFIG.DEMAND_MULTIPLIER.HIGH, level: 'HIGH' };
    } else {
      return { multiplier: MARKETPLACE_CONFIG.DEMAND_MULTIPLIER.SURGE, level: 'SURGE' };
    }
  }

  /**
   * Get price quote for compute request
   */
  getPriceQuote(
    gpuType: GPUType,
    tflops: number,
    durationHours: number,
    priority: BidPriority = 'STANDARD'
  ): PriceQuote {
    const basePrice = this.calculateBasePrice(gpuType, tflops, 'STANDARD');
    const { multiplier: demandMultiplier, level } = this.getDemandMultiplier();
    const priorityMultiplier = MARKETPLACE_CONFIG.PRIORITY_MULTIPLIER[priority];

    const hourlyPrice = basePrice * demandMultiplier * priorityMultiplier;
    const totalPrice = hourlyPrice * durationHours;
    const settlementFee = totalPrice * MARKETPLACE_CONFIG.SETTLEMENT_FEE_RATE;
    const effectivePrice = totalPrice + settlementFee;

    // Check availability
    const availableNodes = energyHashrateMapper.getAvailableNodes(tflops, gpuType);
    const availability = availableNodes.length > 0
      ? Math.min(1, availableNodes.reduce((sum, n) => sum + n.availableTFLOPS, 0) / tflops)
      : 0;

    // Estimate wait time based on demand
    let estimatedWaitMinutes = 0;
    if (availability < 0.5) {
      estimatedWaitMinutes = Math.round((1 - availability) * 60);
    }
    if (level === 'SURGE') {
      estimatedWaitMinutes += 30;
    }

    return {
      gpuType,
      requestedTFLOPS: tflops,
      duration: durationHours,
      basePrice,
      demandMultiplier,
      priorityMultiplier,
      totalPrice,
      settlementFee,
      effectivePrice,
      availability,
      estimatedWaitMinutes,
    };
  }

  /**
   * Submit a compute bid
   */
  submitBid(params: {
    clientId: string;
    clientName: string;
    gpuType: GPUType;
    requestedGPUs: number;
    workloadType: WorkloadType;
    priority: BidPriority;
    maxKausPerHour: number;
    minDurationHours: number;
    maxDurationHours: number;
    totalKausBudget: number;
  }): ComputeBid {
    const { gpuType, requestedGPUs } = params;
    const tflops = COMPUTE_CONFIG.GPU_TFLOPS[gpuType] * requestedGPUs;

    const bid: ComputeBid = {
      bidId: `BID-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...params,
      requestedTFLOPS: tflops,
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + MARKETPLACE_CONFIG.AUCTION_DURATION * 1000,
    };

    this.bids.set(bid.bidId, bid);

    // Auto-match with available nodes
    this.matchBid(bid.bidId);

    return bid;
  }

  /**
   * Match bid with available nodes
   */
  private matchBid(bidId: string): ComputeOrder | null {
    const bid = this.bids.get(bidId);
    if (!bid || bid.status !== 'PENDING') return null;

    const availableNodes = energyHashrateMapper.getAvailableNodes(
      bid.requestedTFLOPS,
      bid.gpuType
    );

    if (availableNodes.length === 0) {
      bid.status = 'ACTIVE'; // Waiting for capacity
      return null;
    }

    // Find best matching node
    const bestNode = availableNodes.reduce((best, node) => {
      if (!best) return node;
      // Prefer nodes with more available capacity
      return node.availableTFLOPS > best.availableTFLOPS ? node : best;
    }, null as VirtualGPUNode | null);

    if (!bestNode) return null;

    // Calculate final price
    const quote = this.getPriceQuote(
      bid.gpuType,
      bid.requestedTFLOPS,
      bid.maxDurationHours,
      bid.priority
    );

    if (quote.effectivePrice > bid.totalKausBudget) {
      bid.status = 'REJECTED';
      return null;
    }

    // Accept bid and create order
    bid.status = 'ACCEPTED';
    bid.acceptedAt = Date.now();
    bid.assignedNodeId = bestNode.nodeId;

    const order: ComputeOrder = {
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      bidId: bid.bidId,
      clientId: bid.clientId,
      nodeId: bestNode.nodeId,
      gpuType: bid.gpuType,
      allocatedTFLOPS: bid.requestedTFLOPS,
      allocatedGPUs: bid.requestedGPUs,
      workloadType: bid.workloadType,
      kausPerHour: quote.totalPrice / bid.maxDurationHours,
      startTime: Date.now(),
      endTime: Date.now() + bid.maxDurationHours * 60 * 60 * 1000,
      totalKaus: quote.totalPrice,
      settlementFee: quote.settlementFee,
      burnedKaus: quote.settlementFee,
      status: 'RUNNING',
    };

    this.orders.set(order.orderId, order);
    this.totalVolumeKaus += quote.totalPrice;
    this.totalBurnedKaus += quote.settlementFee;

    return order;
  }

  /**
   * Get bid by ID
   */
  getBid(bidId: string): ComputeBid | undefined {
    return this.bids.get(bidId);
  }

  /**
   * Get all bids
   */
  getAllBids(): ComputeBid[] {
    return Array.from(this.bids.values());
  }

  /**
   * Get active bids
   */
  getActiveBids(): ComputeBid[] {
    return Array.from(this.bids.values()).filter(b =>
      b.status === 'PENDING' || b.status === 'ACTIVE'
    );
  }

  /**
   * Get bids by client
   */
  getBidsByClient(clientId: string): ComputeBid[] {
    return Array.from(this.bids.values()).filter(b => b.clientId === clientId);
  }

  /**
   * Get all orders
   */
  getAllOrders(): ComputeOrder[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get running orders
   */
  getRunningOrders(): ComputeOrder[] {
    return Array.from(this.orders.values()).filter(o => o.status === 'RUNNING');
  }

  /**
   * Get market statistics
   */
  getMarketStats(): MarketStats {
    const bids = Array.from(this.bids.values());
    const orders = Array.from(this.orders.values());
    const { level } = this.getDemandMultiplier();

    // Find top GPU demand
    const gpuDemand = new Map<GPUType, number>();
    bids.forEach(bid => {
      const current = gpuDemand.get(bid.gpuType) || 0;
      gpuDemand.set(bid.gpuType, current + bid.requestedTFLOPS);
    });

    let topGPU: GPUType = 'H100';
    let maxDemand = 0;
    gpuDemand.forEach((demand, gpu) => {
      if (demand > maxDemand) {
        maxDemand = demand;
        topGPU = gpu;
      }
    });

    // Calculate average price
    const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'RUNNING');
    const avgPrice = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + o.kausPerHour / o.allocatedTFLOPS, 0) / completedOrders.length
      : MARKETPLACE_CONFIG.BASE_RATE_PER_TFLOPS;

    // Estimate market cap (all available TFLOPS * avg hourly rate * 24 hours)
    const globalStats = energyHashrateMapper.getGlobalStats();
    const marketCap = globalStats.totalTFLOPS * avgPrice * 24;

    return {
      totalBids: bids.length,
      activeBids: bids.filter(b => b.status === 'PENDING' || b.status === 'ACTIVE').length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
      totalVolumeKaus: this.totalVolumeKaus,
      totalBurnedKaus: this.totalBurnedKaus,
      averageKausPerTFLOPSHour: avgPrice,
      currentDemandLevel: level,
      topGPUDemand: topGPU,
      marketCapKaus: marketCap,
    };
  }

  /**
   * Get leaderboard (top clients by volume)
   */
  getClientLeaderboard(limit: number = 10): { clientId: string; clientName: string; totalVolume: number; orderCount: number }[] {
    const clientStats = new Map<string, { name: string; volume: number; orders: number }>();

    Array.from(this.bids.values())
      .filter(b => b.status === 'COMPLETED')
      .forEach(bid => {
        const existing = clientStats.get(bid.clientId) || { name: bid.clientName, volume: 0, orders: 0 };
        existing.volume += bid.actualKausSpent || 0;
        existing.orders++;
        clientStats.set(bid.clientId, existing);
      });

    return Array.from(clientStats.entries())
      .map(([clientId, stats]) => ({
        clientId,
        clientName: stats.name,
        totalVolume: stats.volume,
        orderCount: stats.orders,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, limit);
  }

  /**
   * Get GPU type pricing
   */
  getGPUPricing(): { gpuType: GPUType; minBid: number; currentRate: number; tflops: number }[] {
    const { multiplier } = this.getDemandMultiplier();

    return (['H100', 'MI300X', 'A100', 'L40S', 'RTX4090'] as GPUType[]).map(gpuType => {
      const tflops = COMPUTE_CONFIG.GPU_TFLOPS[gpuType];
      const minBid = MARKETPLACE_CONFIG.MIN_BID[gpuType];
      const currentRate = this.calculateBasePrice(gpuType, tflops, 'STANDARD') * multiplier;

      return {
        gpuType,
        minBid,
        currentRate,
        tflops,
      };
    });
  }

  /**
   * Cancel bid
   */
  cancelBid(bidId: string): boolean {
    const bid = this.bids.get(bidId);
    if (!bid || bid.status === 'COMPLETED' || bid.status === 'CANCELLED') {
      return false;
    }

    bid.status = 'CANCELLED';
    return true;
  }
}

// Singleton instance
export const computeMarketplace = new ComputeMarketplace();

// Convenience exports
export const getPriceQuote = (
  gpuType: GPUType,
  tflops: number,
  durationHours: number,
  priority?: BidPriority
) => computeMarketplace.getPriceQuote(gpuType, tflops, durationHours, priority);

export const submitComputeBid = (params: Parameters<typeof computeMarketplace.submitBid>[0]) =>
  computeMarketplace.submitBid(params);

export const getMarketStats = () => computeMarketplace.getMarketStats();

export const getActiveBids = () => computeMarketplace.getActiveBids();

export const getRunningOrders = () => computeMarketplace.getRunningOrders();

export const getGPUPricing = () => computeMarketplace.getGPUPricing();

export const getClientLeaderboard = (limit?: number) => computeMarketplace.getClientLeaderboard(limit);
