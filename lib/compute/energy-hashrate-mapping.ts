/**
 * ENERGY-TO-HASHRATE MAPPING SYSTEM
 *
 * 발전소 노드의 잉여 전력을 AI 연산력(Hashrate)으로 전환
 * - Virtual GPU Node 관리
 * - Compute Credit 발행 메커니즘
 * - 실시간 전력-연산 매핑
 */

// GPU Node Types
export type GPUType = 'H100' | 'A100' | 'RTX4090' | 'L40S' | 'MI300X';
export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'OVERLOADED';
export type WorkloadType = 'TRAINING' | 'INFERENCE' | 'RENDERING' | 'SCIENTIFIC' | 'MINING';

// Configuration
export const COMPUTE_CONFIG = {
  // Power consumption per GPU type (kWh per hour)
  GPU_POWER_CONSUMPTION: {
    H100: 0.7,      // 700W
    A100: 0.4,      // 400W
    RTX4090: 0.45,  // 450W
    L40S: 0.35,     // 350W
    MI300X: 0.75,   // 750W (AMD)
  } as Record<GPUType, number>,

  // TFLOPS per GPU type
  GPU_TFLOPS: {
    H100: 1979,      // FP8: 3958
    A100: 312,       // FP16: 624
    RTX4090: 330,    // FP16: 660
    L40S: 362,       // FP16: 724
    MI300X: 1307,    // FP16: 2614
  } as Record<GPUType, number>,

  // Compute Credit generation rate per kWh
  CREDIT_PER_KWH: {
    H100: 15.0,      // Premium GPU = more credits
    A100: 10.0,
    RTX4090: 8.0,
    L40S: 7.5,
    MI300X: 14.0,
  } as Record<GPUType, number>,

  // Efficiency multipliers by workload
  WORKLOAD_EFFICIENCY: {
    TRAINING: 1.0,      // Base efficiency
    INFERENCE: 1.2,     // More efficient for inference
    RENDERING: 0.9,     // Less efficient
    SCIENTIFIC: 1.1,    // Good for scientific
    MINING: 0.7,        // Lowest priority
  } as Record<WorkloadType, number>,

  // Cooling overhead (additional power for cooling)
  COOLING_OVERHEAD: 0.15,  // 15% additional power for cooling

  // PUE (Power Usage Effectiveness) - industry average is 1.58
  PUE: 1.2,  // Field Nine's optimized PUE

  // Minimum surplus power to activate compute (kW)
  MIN_SURPLUS_THRESHOLD: 100,

  // Maximum utilization before throttling
  MAX_UTILIZATION: 0.95,
};

// Virtual GPU Node Interface
export interface VirtualGPUNode {
  nodeId: string;
  powerPlantId: string;
  region: string;
  gpuType: GPUType;
  gpuCount: number;
  status: NodeStatus;
  currentUtilization: number;     // 0-1
  availableTFLOPS: number;
  allocatedTFLOPS: number;
  powerConsumptionKW: number;
  surplusPowerKW: number;
  temperature: number;            // Celsius
  uptime: number;                 // Hours
  lastHealthCheck: number;        // Timestamp
  activeWorkloads: WorkloadAllocation[];
  computeCreditsGenerated: number;
  kausEarned: number;
}

// Workload Allocation
export interface WorkloadAllocation {
  workloadId: string;
  clientId: string;
  workloadType: WorkloadType;
  allocatedTFLOPS: number;
  startTime: number;
  estimatedDuration: number;      // Hours
  kausPrice: number;              // K-AUS per hour
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

// Compute Credit
export interface ComputeCredit {
  creditId: string;
  nodeId: string;
  kwhConsumed: number;
  creditsGenerated: number;
  kausEquivalent: number;
  timestamp: number;
  gpuType: GPUType;
  efficiency: number;
}

// Power Plant Energy Feed
export interface EnergyFeed {
  powerPlantId: string;
  totalGenerationKW: number;
  gridDemandKW: number;
  surplusPowerKW: number;
  energySource: 'SOLAR' | 'WIND' | 'HYDRO' | 'NUCLEAR' | 'GAS';
  carbonIntensity: number;        // gCO2/kWh
  timestamp: number;
}

// Global compute statistics
interface ComputeStats {
  totalNodes: number;
  activeNodes: number;
  totalGPUs: number;
  totalTFLOPS: number;
  availableTFLOPS: number;
  allocatedTFLOPS: number;
  totalPowerConsumptionMW: number;
  totalSurplusPowerMW: number;
  computeCreditsIssued: number;
  kausFromCompute: number;
  averageUtilization: number;
  carbonSaved: number;            // kg CO2
}

class EnergyHashrateMapper {
  private nodes: Map<string, VirtualGPUNode> = new Map();
  private energyFeeds: Map<string, EnergyFeed> = new Map();
  private creditHistory: ComputeCredit[] = [];
  private totalCreditsIssued = 0;
  private totalKausEarned = 0;

  constructor() {
    this.initializeMockNodes();
    this.initializeMockEnergyFeeds();
  }

  private initializeMockNodes(): void {
    const mockNodes: Partial<VirtualGPUNode>[] = [
      // Korea - Seoul Data Center
      {
        nodeId: 'KR-SEL-H100-001',
        powerPlantId: 'SOLAR-JEJU-001',
        region: 'KR',
        gpuType: 'H100',
        gpuCount: 256,
        status: 'ONLINE',
        currentUtilization: 0.78,
      },
      {
        nodeId: 'KR-SEL-A100-001',
        powerPlantId: 'WIND-GANGHWA-001',
        region: 'KR',
        gpuType: 'A100',
        gpuCount: 512,
        status: 'ONLINE',
        currentUtilization: 0.85,
      },
      // USA - Texas
      {
        nodeId: 'US-TEX-H100-001',
        powerPlantId: 'SOLAR-TEXAS-001',
        region: 'US',
        gpuType: 'H100',
        gpuCount: 1024,
        status: 'ONLINE',
        currentUtilization: 0.92,
      },
      {
        nodeId: 'US-TEX-MI300X-001',
        powerPlantId: 'WIND-TEXAS-001',
        region: 'US',
        gpuType: 'MI300X',
        gpuCount: 384,
        status: 'ONLINE',
        currentUtilization: 0.67,
      },
      // EU - Germany
      {
        nodeId: 'EU-DEU-A100-001',
        powerPlantId: 'WIND-NORTH-001',
        region: 'EU',
        gpuType: 'A100',
        gpuCount: 768,
        status: 'ONLINE',
        currentUtilization: 0.81,
      },
      {
        nodeId: 'EU-DEU-L40S-001',
        powerPlantId: 'SOLAR-BAVARIA-001',
        region: 'EU',
        gpuType: 'L40S',
        gpuCount: 1536,
        status: 'ONLINE',
        currentUtilization: 0.73,
      },
      // UAE - Dubai
      {
        nodeId: 'UAE-DXB-H100-001',
        powerPlantId: 'SOLAR-DUBAI-001',
        region: 'UAE',
        gpuType: 'H100',
        gpuCount: 512,
        status: 'ONLINE',
        currentUtilization: 0.88,
      },
      // Singapore
      {
        nodeId: 'SG-SIN-RTX4090-001',
        powerPlantId: 'SOLAR-CHANGI-001',
        region: 'SG',
        gpuType: 'RTX4090',
        gpuCount: 2048,
        status: 'ONLINE',
        currentUtilization: 0.71,
      },
      // Japan - Tokyo
      {
        nodeId: 'JP-TYO-A100-001',
        powerPlantId: 'NUCLEAR-FUKUI-001',
        region: 'JP',
        gpuType: 'A100',
        gpuCount: 640,
        status: 'ONLINE',
        currentUtilization: 0.79,
      },
      // Australia - Sydney
      {
        nodeId: 'AU-SYD-H100-001',
        powerPlantId: 'SOLAR-NSW-001',
        region: 'AU',
        gpuType: 'H100',
        gpuCount: 384,
        status: 'MAINTENANCE',
        currentUtilization: 0.0,
      },
    ];

    mockNodes.forEach((node, idx) => {
      const gpuType = node.gpuType!;
      const gpuCount = node.gpuCount!;
      const utilization = node.currentUtilization!;

      const powerPerGPU = COMPUTE_CONFIG.GPU_POWER_CONSUMPTION[gpuType];
      const tflopsPerGPU = COMPUTE_CONFIG.GPU_TFLOPS[gpuType];
      const totalTFLOPS = tflopsPerGPU * gpuCount;
      const powerConsumption = powerPerGPU * gpuCount * COMPUTE_CONFIG.PUE;

      const fullNode: VirtualGPUNode = {
        nodeId: node.nodeId!,
        powerPlantId: node.powerPlantId!,
        region: node.region!,
        gpuType,
        gpuCount,
        status: node.status!,
        currentUtilization: utilization,
        availableTFLOPS: totalTFLOPS * (1 - utilization),
        allocatedTFLOPS: totalTFLOPS * utilization,
        powerConsumptionKW: powerConsumption,
        surplusPowerKW: powerConsumption * 0.3 + Math.random() * 200,
        temperature: 45 + Math.random() * 20,
        uptime: 720 + Math.random() * 2000,
        lastHealthCheck: Date.now() - Math.random() * 60000,
        activeWorkloads: [],
        computeCreditsGenerated: 100000 + idx * 50000,
        kausEarned: 5000 + idx * 2500,
      };

      this.nodes.set(fullNode.nodeId, fullNode);
    });
  }

  private initializeMockEnergyFeeds(): void {
    const feeds: EnergyFeed[] = [
      {
        powerPlantId: 'SOLAR-JEJU-001',
        totalGenerationKW: 50000,
        gridDemandKW: 35000,
        surplusPowerKW: 15000,
        energySource: 'SOLAR',
        carbonIntensity: 0,
        timestamp: Date.now(),
      },
      {
        powerPlantId: 'WIND-GANGHWA-001',
        totalGenerationKW: 30000,
        gridDemandKW: 22000,
        surplusPowerKW: 8000,
        energySource: 'WIND',
        carbonIntensity: 0,
        timestamp: Date.now(),
      },
      {
        powerPlantId: 'SOLAR-TEXAS-001',
        totalGenerationKW: 150000,
        gridDemandKW: 95000,
        surplusPowerKW: 55000,
        energySource: 'SOLAR',
        carbonIntensity: 0,
        timestamp: Date.now(),
      },
      {
        powerPlantId: 'WIND-TEXAS-001',
        totalGenerationKW: 80000,
        gridDemandKW: 60000,
        surplusPowerKW: 20000,
        energySource: 'WIND',
        carbonIntensity: 0,
        timestamp: Date.now(),
      },
      {
        powerPlantId: 'WIND-NORTH-001',
        totalGenerationKW: 120000,
        gridDemandKW: 85000,
        surplusPowerKW: 35000,
        energySource: 'WIND',
        carbonIntensity: 0,
        timestamp: Date.now(),
      },
      {
        powerPlantId: 'SOLAR-BAVARIA-001',
        totalGenerationKW: 45000,
        gridDemandKW: 32000,
        surplusPowerKW: 13000,
        energySource: 'SOLAR',
        carbonIntensity: 0,
        timestamp: Date.now(),
      },
      {
        powerPlantId: 'SOLAR-DUBAI-001',
        totalGenerationKW: 200000,
        gridDemandKW: 140000,
        surplusPowerKW: 60000,
        energySource: 'SOLAR',
        carbonIntensity: 0,
        timestamp: Date.now(),
      },
      {
        powerPlantId: 'NUCLEAR-FUKUI-001',
        totalGenerationKW: 500000,
        gridDemandKW: 420000,
        surplusPowerKW: 80000,
        energySource: 'NUCLEAR',
        carbonIntensity: 12,
        timestamp: Date.now(),
      },
    ];

    feeds.forEach(feed => {
      this.energyFeeds.set(feed.powerPlantId, feed);
    });
  }

  /**
   * Calculate compute credits from energy consumption
   */
  calculateComputeCredits(
    kwhConsumed: number,
    gpuType: GPUType,
    workloadType: WorkloadType = 'TRAINING'
  ): ComputeCredit {
    const baseCredits = COMPUTE_CONFIG.CREDIT_PER_KWH[gpuType];
    const efficiencyMultiplier = COMPUTE_CONFIG.WORKLOAD_EFFICIENCY[workloadType];
    const credits = kwhConsumed * baseCredits * efficiencyMultiplier;

    // 1 Compute Credit = 0.001 K-AUS
    const kausEquivalent = credits * 0.001;

    const credit: ComputeCredit = {
      creditId: `CC-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      nodeId: '',
      kwhConsumed,
      creditsGenerated: credits,
      kausEquivalent,
      timestamp: Date.now(),
      gpuType,
      efficiency: efficiencyMultiplier,
    };

    this.creditHistory.push(credit);
    this.totalCreditsIssued += credits;
    this.totalKausEarned += kausEquivalent;

    return credit;
  }

  /**
   * Map surplus energy to available hashrate
   */
  mapEnergyToHashrate(powerPlantId: string): {
    availableHashrateTFLOPS: number;
    estimatedCreditsPerHour: number;
    kausPerHour: number;
    recommendedGPUAllocation: { gpuType: GPUType; count: number }[];
  } {
    const feed = this.energyFeeds.get(powerPlantId);
    if (!feed || feed.surplusPowerKW < COMPUTE_CONFIG.MIN_SURPLUS_THRESHOLD) {
      return {
        availableHashrateTFLOPS: 0,
        estimatedCreditsPerHour: 0,
        kausPerHour: 0,
        recommendedGPUAllocation: [],
      };
    }

    const surplusKW = feed.surplusPowerKW;
    const effectivePower = surplusKW / COMPUTE_CONFIG.PUE;

    // Calculate optimal GPU allocation
    const allocations: { gpuType: GPUType; count: number; tflops: number; credits: number }[] = [];
    let remainingPower = effectivePower;

    // Prioritize H100 for best performance
    const gpuPriority: GPUType[] = ['H100', 'MI300X', 'A100', 'L40S', 'RTX4090'];

    for (const gpuType of gpuPriority) {
      const powerPerGPU = COMPUTE_CONFIG.GPU_POWER_CONSUMPTION[gpuType];
      const possibleCount = Math.floor(remainingPower / powerPerGPU);

      if (possibleCount > 0) {
        const tflops = possibleCount * COMPUTE_CONFIG.GPU_TFLOPS[gpuType];
        const credits = possibleCount * powerPerGPU * COMPUTE_CONFIG.CREDIT_PER_KWH[gpuType];

        allocations.push({
          gpuType,
          count: Math.min(possibleCount, 100), // Cap at 100 per type for diversity
          tflops,
          credits,
        });

        remainingPower -= Math.min(possibleCount, 100) * powerPerGPU;
        if (remainingPower < 100) break;
      }
    }

    const totalTFLOPS = allocations.reduce((sum, a) => sum + a.tflops, 0);
    const totalCredits = allocations.reduce((sum, a) => sum + a.credits, 0);

    return {
      availableHashrateTFLOPS: totalTFLOPS,
      estimatedCreditsPerHour: totalCredits,
      kausPerHour: totalCredits * 0.001,
      recommendedGPUAllocation: allocations.map(a => ({
        gpuType: a.gpuType,
        count: a.count,
      })),
    };
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): VirtualGPUNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): VirtualGPUNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by region
   */
  getNodesByRegion(region: string): VirtualGPUNode[] {
    return Array.from(this.nodes.values()).filter(n => n.region === region);
  }

  /**
   * Get available nodes for workload
   */
  getAvailableNodes(minTFLOPS: number, gpuType?: GPUType): VirtualGPUNode[] {
    return Array.from(this.nodes.values()).filter(node => {
      if (node.status !== 'ONLINE') return false;
      if (node.currentUtilization >= COMPUTE_CONFIG.MAX_UTILIZATION) return false;
      if (node.availableTFLOPS < minTFLOPS) return false;
      if (gpuType && node.gpuType !== gpuType) return false;
      return true;
    });
  }

  /**
   * Update energy feed
   */
  updateEnergyFeed(feed: EnergyFeed): void {
    this.energyFeeds.set(feed.powerPlantId, feed);

    // Auto-adjust node capacity based on surplus
    const linkedNodes = Array.from(this.nodes.values())
      .filter(n => n.powerPlantId === feed.powerPlantId);

    linkedNodes.forEach(node => {
      const surplusRatio = feed.surplusPowerKW / feed.totalGenerationKW;
      // Adjust available capacity
      if (surplusRatio < 0.1) {
        node.status = 'OVERLOADED';
      } else {
        node.status = 'ONLINE';
      }
    });
  }

  /**
   * Get global compute statistics
   */
  getGlobalStats(): ComputeStats {
    const nodes = Array.from(this.nodes.values());
    const activeNodes = nodes.filter(n => n.status === 'ONLINE');

    const totalTFLOPS = nodes.reduce((sum, n) => {
      return sum + COMPUTE_CONFIG.GPU_TFLOPS[n.gpuType] * n.gpuCount;
    }, 0);

    const allocatedTFLOPS = nodes.reduce((sum, n) => sum + n.allocatedTFLOPS, 0);
    const availableTFLOPS = nodes.reduce((sum, n) => sum + n.availableTFLOPS, 0);

    const totalPowerMW = nodes.reduce((sum, n) => sum + n.powerConsumptionKW, 0) / 1000;
    const totalSurplusMW = nodes.reduce((sum, n) => sum + n.surplusPowerKW, 0) / 1000;

    const avgUtilization = activeNodes.length > 0
      ? activeNodes.reduce((sum, n) => sum + n.currentUtilization, 0) / activeNodes.length
      : 0;

    // Carbon saved: renewable energy instead of grid (500g CO2/kWh average)
    const totalKwhUsed = totalPowerMW * 1000; // Convert to kW, assume 1 hour
    const carbonSaved = totalKwhUsed * 0.5; // 500g = 0.5kg per kWh

    return {
      totalNodes: nodes.length,
      activeNodes: activeNodes.length,
      totalGPUs: nodes.reduce((sum, n) => sum + n.gpuCount, 0),
      totalTFLOPS,
      availableTFLOPS,
      allocatedTFLOPS,
      totalPowerConsumptionMW: totalPowerMW,
      totalSurplusPowerMW: totalSurplusMW,
      computeCreditsIssued: this.totalCreditsIssued + nodes.reduce((sum, n) => sum + n.computeCreditsGenerated, 0),
      kausFromCompute: this.totalKausEarned + nodes.reduce((sum, n) => sum + n.kausEarned, 0),
      averageUtilization: avgUtilization,
      carbonSaved,
    };
  }

  /**
   * Get energy feeds
   */
  getEnergyFeeds(): EnergyFeed[] {
    return Array.from(this.energyFeeds.values());
  }

  /**
   * Get recent credit history
   */
  getRecentCredits(limit: number = 50): ComputeCredit[] {
    return this.creditHistory.slice(-limit);
  }

  /**
   * Get regional stats
   */
  getRegionalStats(): { region: string; nodes: number; tflops: number; utilization: number }[] {
    const regions = new Map<string, { nodes: number; tflops: number; utilization: number[] }>();

    Array.from(this.nodes.values()).forEach(node => {
      const existing = regions.get(node.region) || { nodes: 0, tflops: 0, utilization: [] };
      existing.nodes++;
      existing.tflops += COMPUTE_CONFIG.GPU_TFLOPS[node.gpuType] * node.gpuCount;
      if (node.status === 'ONLINE') {
        existing.utilization.push(node.currentUtilization);
      }
      regions.set(node.region, existing);
    });

    return Array.from(regions.entries()).map(([region, data]) => ({
      region,
      nodes: data.nodes,
      tflops: data.tflops,
      utilization: data.utilization.length > 0
        ? data.utilization.reduce((a, b) => a + b, 0) / data.utilization.length
        : 0,
    }));
  }
}

// Singleton instance
export const energyHashrateMapper = new EnergyHashrateMapper();

// Convenience exports
export const getComputeCredits = (kwhConsumed: number, gpuType: GPUType, workloadType?: WorkloadType) =>
  energyHashrateMapper.calculateComputeCredits(kwhConsumed, gpuType, workloadType);

export const getGlobalComputeStats = () => energyHashrateMapper.getGlobalStats();

export const getAllGPUNodes = () => energyHashrateMapper.getAllNodes();

export const getAvailableComputeNodes = (minTFLOPS: number, gpuType?: GPUType) =>
  energyHashrateMapper.getAvailableNodes(minTFLOPS, gpuType);

export const getRegionalComputeStats = () => energyHashrateMapper.getRegionalStats();

export const mapSurplusToHashrate = (powerPlantId: string) =>
  energyHashrateMapper.mapEnergyToHashrate(powerPlantId);
