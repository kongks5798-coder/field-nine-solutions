/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                                                                       ║
 * ║     FIELD NINE - SHADOW ALPHA 10K NODE SIMULATION                     ║
 * ║     Global Scale Testing & Revenue Projection Engine                  ║
 * ║                                                                       ║
 * ║     Simulates:                                                        ║
 * ║       - 10,000 energy nodes across 50 countries                       ║
 * ║       - Real-time market dynamics                                     ║
 * ║       - Transaction volume scaling                                    ║
 * ║       - Revenue projections at global scale                           ║
 * ║       - Network stress testing                                        ║
 * ║                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import { keccak256, encodePacked } from './crypto-utils';

// ============================================================
// SIMULATION TYPES
// ============================================================

export interface SimulatedNode {
  nodeId: string;
  name: string;
  country: string;
  region: string;
  market: string;
  capacity: number;           // kW
  sourceType: string;
  certificationLevel: 'standard' | 'premium' | 'sovereign';
  utilizationRate: number;    // 0-1
  currentOutput: number;      // kWh/h
  totalProduced: number;      // Lifetime kWh
  totalTransactions: number;
  royaltiesEarned: number;    // NXUSD
  status: 'active' | 'maintenance' | 'offline';
  coordinates: { lat: number; lng: number };
  joinedAt: number;
}

export interface SimulatedTransaction {
  txId: string;
  timestamp: number;
  type: 'verify' | 'swap' | 'attest';
  sourceNode: string;
  targetNode?: string;
  kwhAmount: number;
  nxusdValue: number;
  royaltyPaid: number;
  complianceStatus: string;
  latencyMs: number;
}

export interface SimulationConfig {
  nodeCount: number;
  countryDistribution: Record<string, number>;  // Country -> % of nodes
  sourceTypeDistribution: Record<string, number>;
  avgTransactionsPerNodePerHour: number;
  simulationSpeedMultiplier: number;            // 1 = real-time, 60 = 1 hour per minute
  enableNetworkLatency: boolean;
  enableMarketVolatility: boolean;
}

export interface SimulationMetrics {
  totalNodes: number;
  activeNodes: number;
  totalCapacity: number;              // MW
  currentOutput: number;              // MW
  utilizationRate: number;            // %
  totalTransactions: number;
  transactionsPerSecond: number;
  totalKwhProcessed: number;
  totalRoyaltiesGenerated: number;
  averageLatencyMs: number;
  uptimePercentage: number;
  complianceRate: number;
}

export interface RevenueProjection {
  timeframe: string;
  nodes: number;
  transactions: number;
  volume: number;                     // GWh
  grossRevenue: number;               // NXUSD
  netRevenue: number;
  marketShare: number;                // %
  growthRate: number;                 // %
}

export interface NetworkStressTest {
  testId: string;
  scenario: string;
  peakTps: number;
  sustainedTps: number;
  avgLatency: number;
  p99Latency: number;
  errorRate: number;
  bottlenecks: string[];
  recommendations: string[];
  passed: boolean;
}

// ============================================================
// GLOBAL DISTRIBUTION DATA
// ============================================================

const COUNTRY_DATA: Record<string, {
  name: string;
  region: string;
  market: string;
  avgCapacity: number;
  renewableShare: number;
  coordinates: { lat: number; lng: number };
}> = {
  KR: { name: 'South Korea', region: 'Asia', market: 'JEPX', avgCapacity: 5000, renewableShare: 0.15, coordinates: { lat: 37.5, lng: 127 } },
  JP: { name: 'Japan', region: 'Asia', market: 'JEPX', avgCapacity: 8000, renewableShare: 0.20, coordinates: { lat: 35.7, lng: 139.7 } },
  CN: { name: 'China', region: 'Asia', market: 'CSEC', avgCapacity: 15000, renewableShare: 0.30, coordinates: { lat: 39.9, lng: 116.4 } },
  US: { name: 'United States', region: 'Americas', market: 'PJM', avgCapacity: 12000, renewableShare: 0.22, coordinates: { lat: 38.9, lng: -77.0 } },
  DE: { name: 'Germany', region: 'Europe', market: 'EPEX', avgCapacity: 6000, renewableShare: 0.45, coordinates: { lat: 52.5, lng: 13.4 } },
  AU: { name: 'Australia', region: 'Oceania', market: 'AEMO', avgCapacity: 7500, renewableShare: 0.32, coordinates: { lat: -33.9, lng: 151.2 } },
  GB: { name: 'United Kingdom', region: 'Europe', market: 'EPEX', avgCapacity: 5500, renewableShare: 0.40, coordinates: { lat: 51.5, lng: -0.1 } },
  FR: { name: 'France', region: 'Europe', market: 'EPEX', avgCapacity: 7000, renewableShare: 0.25, coordinates: { lat: 48.9, lng: 2.4 } },
  IN: { name: 'India', region: 'Asia', market: 'IEX', avgCapacity: 10000, renewableShare: 0.18, coordinates: { lat: 28.6, lng: 77.2 } },
  BR: { name: 'Brazil', region: 'Americas', market: 'CCEE', avgCapacity: 9000, renewableShare: 0.48, coordinates: { lat: -23.5, lng: -46.6 } },
  ES: { name: 'Spain', region: 'Europe', market: 'EPEX', avgCapacity: 6500, renewableShare: 0.42, coordinates: { lat: 40.4, lng: -3.7 } },
  IT: { name: 'Italy', region: 'Europe', market: 'GME', avgCapacity: 5000, renewableShare: 0.38, coordinates: { lat: 41.9, lng: 12.5 } },
  NL: { name: 'Netherlands', region: 'Europe', market: 'EPEX', avgCapacity: 4500, renewableShare: 0.35, coordinates: { lat: 52.4, lng: 4.9 } },
  CA: { name: 'Canada', region: 'Americas', market: 'AESO', avgCapacity: 8500, renewableShare: 0.68, coordinates: { lat: 45.4, lng: -75.7 } },
  MX: { name: 'Mexico', region: 'Americas', market: 'CENACE', avgCapacity: 5500, renewableShare: 0.22, coordinates: { lat: 19.4, lng: -99.1 } },
  ZA: { name: 'South Africa', region: 'Africa', market: 'SAPP', avgCapacity: 4000, renewableShare: 0.10, coordinates: { lat: -33.9, lng: 18.4 } },
  SG: { name: 'Singapore', region: 'Asia', market: 'EMC', avgCapacity: 3000, renewableShare: 0.05, coordinates: { lat: 1.3, lng: 103.8 } },
  AE: { name: 'UAE', region: 'MiddleEast', market: 'DEWA', avgCapacity: 8000, renewableShare: 0.12, coordinates: { lat: 25.2, lng: 55.3 } },
  SA: { name: 'Saudi Arabia', region: 'MiddleEast', market: 'ECRA', avgCapacity: 10000, renewableShare: 0.08, coordinates: { lat: 24.7, lng: 46.7 } },
  SE: { name: 'Sweden', region: 'Europe', market: 'NordPool', avgCapacity: 4000, renewableShare: 0.58, coordinates: { lat: 59.3, lng: 18.1 } },
};

const SOURCE_TYPES = ['solar', 'wind', 'hydro', 'biomass', 'nuclear'];

// ============================================================
// SHADOW ALPHA SIMULATION ENGINE
// ============================================================

export class ShadowAlphaSimulation {
  private static instance: ShadowAlphaSimulation;

  private nodes: Map<string, SimulatedNode> = new Map();
  private transactions: SimulatedTransaction[] = [];
  private isRunning = false;
  private simulationStartTime = 0;
  private metrics: SimulationMetrics;

  private config: SimulationConfig = {
    nodeCount: 10000,
    countryDistribution: {
      US: 0.20, CN: 0.18, DE: 0.08, JP: 0.07, KR: 0.06,
      AU: 0.05, GB: 0.05, FR: 0.04, IN: 0.05, BR: 0.04,
      ES: 0.03, IT: 0.03, NL: 0.02, CA: 0.03, MX: 0.02,
      ZA: 0.01, SG: 0.01, AE: 0.01, SA: 0.01, SE: 0.01,
    },
    sourceTypeDistribution: {
      solar: 0.40, wind: 0.30, hydro: 0.15, biomass: 0.10, nuclear: 0.05,
    },
    avgTransactionsPerNodePerHour: 5,
    simulationSpeedMultiplier: 60,
    enableNetworkLatency: true,
    enableMarketVolatility: true,
  };

  private constructor() {
    this.metrics = this.createEmptyMetrics();
  }

  static getInstance(): ShadowAlphaSimulation {
    if (!ShadowAlphaSimulation.instance) {
      ShadowAlphaSimulation.instance = new ShadowAlphaSimulation();
    }
    return ShadowAlphaSimulation.instance;
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize simulation with specified node count
   */
  async initializeSimulation(nodeCount: number = 10000): Promise<void> {
    this.config.nodeCount = nodeCount;
    this.nodes.clear();
    this.transactions = [];

    console.log(`[Shadow Alpha] Initializing ${nodeCount} nodes...`);

    const countries = Object.keys(this.config.countryDistribution);

    for (let i = 0; i < nodeCount; i++) {
      // Select country based on distribution
      const countryCode = this.selectByDistribution(this.config.countryDistribution);
      const countryData = COUNTRY_DATA[countryCode];

      if (!countryData) continue;

      // Select source type
      const sourceType = this.selectByDistribution(this.config.sourceTypeDistribution);

      // Generate node
      const nodeId = `NODE-${countryCode}-${String(i).padStart(5, '0')}`;
      const capacity = countryData.avgCapacity * (0.5 + Math.random());

      const node: SimulatedNode = {
        nodeId,
        name: `${countryData.name} Energy Node #${i + 1}`,
        country: countryCode,
        region: countryData.region,
        market: countryData.market,
        capacity: Math.round(capacity),
        sourceType,
        certificationLevel: this.assignCertificationLevel(),
        utilizationRate: 0.3 + Math.random() * 0.5,
        currentOutput: 0,
        totalProduced: 0,
        totalTransactions: 0,
        royaltiesEarned: 0,
        status: 'active',
        coordinates: {
          lat: countryData.coordinates.lat + (Math.random() - 0.5) * 5,
          lng: countryData.coordinates.lng + (Math.random() - 0.5) * 5,
        },
        joinedAt: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      };

      this.nodes.set(nodeId, node);
    }

    console.log(`[Shadow Alpha] Initialized ${this.nodes.size} nodes across ${countries.length} countries`);
    this.updateMetrics();
  }

  private selectByDistribution(distribution: Record<string, number>): string {
    const rand = Math.random();
    let cumulative = 0;

    for (const [key, prob] of Object.entries(distribution)) {
      cumulative += prob;
      if (rand <= cumulative) {
        return key;
      }
    }

    return Object.keys(distribution)[0];
  }

  private assignCertificationLevel(): 'standard' | 'premium' | 'sovereign' {
    const rand = Math.random();
    if (rand < 0.7) return 'standard';
    if (rand < 0.95) return 'premium';
    return 'sovereign';
  }

  // ============================================================
  // SIMULATION EXECUTION
  // ============================================================

  /**
   * Start the simulation
   */
  startSimulation(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.simulationStartTime = Date.now();

    console.log('[Shadow Alpha] Simulation started');

    // Run simulation loop
    this.simulationLoop();
  }

  /**
   * Stop the simulation
   */
  stopSimulation(): void {
    this.isRunning = false;
    console.log('[Shadow Alpha] Simulation stopped');
  }

  private simulationLoop(): void {
    if (!this.isRunning) return;

    // Generate transactions for this tick
    const transactionsPerTick = Math.ceil(
      this.nodes.size * this.config.avgTransactionsPerNodePerHour /
      3600 * this.config.simulationSpeedMultiplier
    );

    for (let i = 0; i < transactionsPerTick; i++) {
      this.generateTransaction();
    }

    // Update node outputs
    this.updateNodeOutputs();

    // Update metrics
    this.updateMetrics();

    // Schedule next tick
    setTimeout(() => this.simulationLoop(), 1000 / this.config.simulationSpeedMultiplier);
  }

  private generateTransaction(): void {
    const nodes = Array.from(this.nodes.values()).filter(n => n.status === 'active');
    if (nodes.length === 0) return;

    const sourceNode = nodes[Math.floor(Math.random() * nodes.length)];
    const txType = this.selectByDistribution({
      verify: 0.5,
      swap: 0.3,
      attest: 0.2,
    }) as 'verify' | 'swap' | 'attest';

    let targetNode: SimulatedNode | undefined;
    if (txType === 'swap') {
      const otherNodes = nodes.filter(n => n.nodeId !== sourceNode.nodeId);
      targetNode = otherNodes[Math.floor(Math.random() * otherNodes.length)];
    }

    const kwhAmount = Math.round(10 + Math.random() * 990);
    const pricePerKwh = 0.05 + Math.random() * 0.1;
    const nxusdValue = kwhAmount * pricePerKwh;

    const royaltyRates = { verify: 0.001, swap: 0.0025, attest: 0.0001 };
    const royaltyPaid = kwhAmount * royaltyRates[txType];

    const latencyBase = { verify: 50, swap: 200, attest: 150 };
    const latencyMs = latencyBase[txType] + Math.random() * 100;

    const tx: SimulatedTransaction = {
      txId: `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      type: txType,
      sourceNode: sourceNode.nodeId,
      targetNode: targetNode?.nodeId,
      kwhAmount,
      nxusdValue: Math.round(nxusdValue * 100) / 100,
      royaltyPaid: Math.round(royaltyPaid * 10000) / 10000,
      complianceStatus: Math.random() > 0.02 ? 'compliant' : 'review_required',
      latencyMs: Math.round(latencyMs),
    };

    this.transactions.push(tx);

    // Update node stats
    sourceNode.totalTransactions++;
    sourceNode.royaltiesEarned += royaltyPaid * 0.7; // 70% to node operator

    if (targetNode) {
      targetNode.totalTransactions++;
    }

    // Keep only last 100K transactions
    if (this.transactions.length > 100000) {
      this.transactions = this.transactions.slice(-50000);
    }
  }

  private updateNodeOutputs(): void {
    for (const node of this.nodes.values()) {
      if (node.status !== 'active') continue;

      // Simulate hourly output variation
      const hourOfDay = new Date().getHours();
      let capacityFactor = node.utilizationRate;

      // Solar peaks at noon
      if (node.sourceType === 'solar') {
        const solarFactor = Math.cos((hourOfDay - 12) * Math.PI / 12) * 0.5 + 0.5;
        capacityFactor *= solarFactor;
      }

      // Wind varies randomly
      if (node.sourceType === 'wind') {
        capacityFactor *= 0.6 + Math.random() * 0.4;
      }

      node.currentOutput = node.capacity * capacityFactor;
      node.totalProduced += node.currentOutput / 3600 * this.config.simulationSpeedMultiplier;
    }
  }

  // ============================================================
  // METRICS
  // ============================================================

  private createEmptyMetrics(): SimulationMetrics {
    return {
      totalNodes: 0,
      activeNodes: 0,
      totalCapacity: 0,
      currentOutput: 0,
      utilizationRate: 0,
      totalTransactions: 0,
      transactionsPerSecond: 0,
      totalKwhProcessed: 0,
      totalRoyaltiesGenerated: 0,
      averageLatencyMs: 0,
      uptimePercentage: 0,
      complianceRate: 0,
    };
  }

  private updateMetrics(): void {
    const nodes = Array.from(this.nodes.values());
    const activeNodes = nodes.filter(n => n.status === 'active');

    const recentTxs = this.transactions.filter(t => Date.now() - t.timestamp < 60000);
    const compliantTxs = this.transactions.filter(t => t.complianceStatus === 'compliant');

    this.metrics = {
      totalNodes: nodes.length,
      activeNodes: activeNodes.length,
      totalCapacity: Math.round(nodes.reduce((s, n) => s + n.capacity, 0) / 1000), // MW
      currentOutput: Math.round(activeNodes.reduce((s, n) => s + n.currentOutput, 0) / 1000), // MW
      utilizationRate: activeNodes.length > 0
        ? Math.round(activeNodes.reduce((s, n) => s + n.utilizationRate, 0) / activeNodes.length * 100)
        : 0,
      totalTransactions: this.transactions.length,
      transactionsPerSecond: Math.round(recentTxs.length / 60 * 100) / 100,
      totalKwhProcessed: Math.round(this.transactions.reduce((s, t) => s + t.kwhAmount, 0)),
      totalRoyaltiesGenerated: Math.round(this.transactions.reduce((s, t) => s + t.royaltyPaid, 0) * 100) / 100,
      averageLatencyMs: this.transactions.length > 0
        ? Math.round(this.transactions.reduce((s, t) => s + t.latencyMs, 0) / this.transactions.length)
        : 0,
      uptimePercentage: nodes.length > 0
        ? Math.round(activeNodes.length / nodes.length * 100 * 10) / 10
        : 0,
      complianceRate: this.transactions.length > 0
        ? Math.round(compliantTxs.length / this.transactions.length * 100 * 10) / 10
        : 100,
    };
  }

  // ============================================================
  // REVENUE PROJECTIONS
  // ============================================================

  /**
   * Generate revenue projections
   */
  generateRevenueProjections(): RevenueProjection[] {
    const baseNodes = this.config.nodeCount;
    const baseTransactionsPerNode = this.config.avgTransactionsPerNodePerHour * 24 * 365;
    const avgKwhPerTransaction = 500;
    const royaltyRate = 0.001;

    const projections: RevenueProjection[] = [];

    // Year 1-5 projections
    const growthRates = [0, 1.5, 2.0, 1.8, 1.5]; // Year-over-year growth multipliers
    let cumulativeNodes = baseNodes;
    let cumulativeVolume = 0;

    for (let year = 1; year <= 5; year++) {
      const yearNodes = Math.round(cumulativeNodes * growthRates[year - 1] || baseNodes);
      const transactions = yearNodes * baseTransactionsPerNode;
      const volume = transactions * avgKwhPerTransaction / 1000000000; // GWh
      const grossRevenue = transactions * avgKwhPerTransaction * royaltyRate;
      const netRevenue = grossRevenue * 0.8; // 80% after costs

      // Market share calculation (global renewable energy market ~$1.5T by 2030)
      const globalMarket = 1500000000000 * (1 + (year - 1) * 0.08);
      const marketShare = (grossRevenue / globalMarket) * 100;

      projections.push({
        timeframe: `Year ${year}`,
        nodes: yearNodes,
        transactions: Math.round(transactions),
        volume: Math.round(volume * 100) / 100,
        grossRevenue: Math.round(grossRevenue),
        netRevenue: Math.round(netRevenue),
        marketShare: Math.round(marketShare * 1000) / 1000,
        growthRate: year > 1 ? Math.round((growthRates[year - 1] - 1) * 100) : 0,
      });

      cumulativeNodes = yearNodes;
      cumulativeVolume += volume;
    }

    return projections;
  }

  // ============================================================
  // STRESS TESTING
  // ============================================================

  /**
   * Run network stress test
   */
  async runStressTest(scenario: string): Promise<NetworkStressTest> {
    const testId = `STRESS-${Date.now()}`;
    console.log(`[Shadow Alpha] Running stress test: ${scenario}`);

    let peakTps = 0;
    let sustainedTps = 0;
    let avgLatency = 0;
    let p99Latency = 0;
    let errorRate = 0;
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    switch (scenario) {
      case 'peak_load': {
        // Simulate 10x normal load
        peakTps = this.nodes.size * 50 / 3600;
        sustainedTps = peakTps * 0.8;
        avgLatency = 150;
        p99Latency = 450;
        errorRate = 0.1;
        bottlenecks.push('Database write throughput');
        recommendations.push('Scale database horizontally');
        break;
      }

      case 'global_surge': {
        // All markets active simultaneously
        peakTps = this.nodes.size * 100 / 3600;
        sustainedTps = peakTps * 0.6;
        avgLatency = 200;
        p99Latency = 800;
        errorRate = 0.5;
        bottlenecks.push('Cross-region latency', 'Load balancer capacity');
        recommendations.push('Deploy edge caching', 'Increase load balancer capacity');
        break;
      }

      case 'ddos_simulation': {
        // 100x normal request rate
        peakTps = this.nodes.size * 500 / 3600;
        sustainedTps = peakTps * 0.3;
        avgLatency = 500;
        p99Latency = 2000;
        errorRate = 5;
        bottlenecks.push('Rate limiter', 'WAF processing');
        recommendations.push('Enable auto-scaling', 'Activate DDoS protection');
        break;
      }

      default: {
        // Normal load
        peakTps = this.nodes.size * 5 / 3600;
        sustainedTps = peakTps * 0.9;
        avgLatency = 100;
        p99Latency = 250;
        errorRate = 0.01;
      }
    }

    const passed = errorRate < 1 && p99Latency < 1000;

    return {
      testId,
      scenario,
      peakTps: Math.round(peakTps * 100) / 100,
      sustainedTps: Math.round(sustainedTps * 100) / 100,
      avgLatency: Math.round(avgLatency),
      p99Latency: Math.round(p99Latency),
      errorRate: Math.round(errorRate * 100) / 100,
      bottlenecks,
      recommendations,
      passed,
    };
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  getMetrics(): SimulationMetrics {
    return { ...this.metrics };
  }

  getNodes(): SimulatedNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesByCountry(countryCode: string): SimulatedNode[] {
    return Array.from(this.nodes.values()).filter(n => n.country === countryCode);
  }

  getNodesByMarket(market: string): SimulatedNode[] {
    return Array.from(this.nodes.values()).filter(n => n.market === market);
  }

  getRecentTransactions(limit: number = 100): SimulatedTransaction[] {
    return this.transactions.slice(-limit);
  }

  getTransactionsByType(type: 'verify' | 'swap' | 'attest'): SimulatedTransaction[] {
    return this.transactions.filter(t => t.type === type);
  }

  getCountryDistribution(): Record<string, { nodes: number; capacity: number; output: number }> {
    const result: Record<string, { nodes: number; capacity: number; output: number }> = {};

    for (const node of this.nodes.values()) {
      if (!result[node.country]) {
        result[node.country] = { nodes: 0, capacity: 0, output: 0 };
      }
      result[node.country].nodes++;
      result[node.country].capacity += node.capacity;
      result[node.country].output += node.currentOutput;
    }

    return result;
  }

  isRunningSimulation(): boolean {
    return this.isRunning;
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }
}

// Singleton export
export const shadowAlphaSimulation = ShadowAlphaSimulation.getInstance();
