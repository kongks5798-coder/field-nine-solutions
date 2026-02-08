/**
 * CONSUMER COMPUTE MINING PORTAL (MINI-NODE)
 *
 * 일반 유저의 기기 연산력을 필드나인 그리드에 대여하고 K-AUS 채굴
 * "당신의 기기가 잠든 사이 에너지를 지능으로 바꿉니다"
 *
 * - 노트북/스마트폰 연산력 기여
 * - 수면 시간 자동 채굴
 * - 실시간 수익 추적
 */

// Device Types
export type DeviceType = 'LAPTOP' | 'DESKTOP' | 'SMARTPHONE' | 'TABLET' | 'SERVER';

// Mining Status
export type MiningStatus = 'ACTIVE' | 'PAUSED' | 'SLEEPING' | 'OFFLINE' | 'CONNECTING';

// Performance Tier
export type PerformanceTier = 'ECO' | 'BALANCED' | 'PERFORMANCE' | 'MAXIMUM';

// Mining Configuration
export const MINING_CONFIG = {
  // Base K-AUS reward per compute unit per hour
  BASE_REWARD_RATE: 0.0001, // K-AUS per compute unit per hour

  // Device compute power (relative units)
  DEVICE_POWER: {
    LAPTOP: {
      base: 100,
      range: { min: 50, max: 300 },
      powerConsumption: 45, // Watts
    },
    DESKTOP: {
      base: 250,
      range: { min: 150, max: 800 },
      powerConsumption: 120,
    },
    SMARTPHONE: {
      base: 30,
      range: { min: 15, max: 60 },
      powerConsumption: 5,
    },
    TABLET: {
      base: 50,
      range: { min: 30, max: 100 },
      powerConsumption: 15,
    },
    SERVER: {
      base: 1000,
      range: { min: 500, max: 5000 },
      powerConsumption: 500,
    },
  } as Record<DeviceType, { base: number; range: { min: number; max: number }; powerConsumption: number }>,

  // Performance tier multipliers
  PERFORMANCE_MULTIPLIER: {
    ECO: 0.3,        // 30% capacity - minimal battery/power impact
    BALANCED: 0.5,   // 50% capacity - balanced
    PERFORMANCE: 0.8, // 80% capacity - more rewards
    MAXIMUM: 1.0,    // 100% capacity - maximum rewards
  } as Record<PerformanceTier, number>,

  // Sleep mode bonus (reward multiplier for overnight mining)
  SLEEP_MODE_BONUS: 1.25, // 25% bonus for sleep mining

  // Referral bonus
  REFERRAL_BONUS: 0.05, // 5% of referred user's earnings

  // Minimum payout threshold
  MIN_PAYOUT: 1, // 1 K-AUS minimum

  // Network contribution bonus tiers
  NETWORK_BONUS: {
    BRONZE: { hours: 100, bonus: 0.02 },   // 2% after 100 hours
    SILVER: { hours: 500, bonus: 0.05 },   // 5% after 500 hours
    GOLD: { hours: 2000, bonus: 0.10 },    // 10% after 2000 hours
    PLATINUM: { hours: 10000, bonus: 0.20 }, // 20% after 10000 hours
  },
};

// Mini Node Interface
export interface MiniNode {
  nodeId: string;
  userId: string;
  deviceType: DeviceType;
  deviceName: string;
  deviceModel: string;
  osVersion: string;
  computePower: number;         // Relative compute units
  performanceTier: PerformanceTier;
  status: MiningStatus;
  isSleeMode: boolean;
  totalMiningHours: number;
  totalKausEarned: number;
  todayKausEarned: number;
  currentSessionStart?: number;
  lastHeartbeat: number;
  networkTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'NONE';
  settings: {
    autoStartOnIdle: boolean;
    idleTimeMinutes: number;
    sleepSchedule: { start: string; end: string } | null;
    maxCpuUsage: number;
    maxRamUsage: number;
    pauseOnBattery: boolean;
  };
  createdAt: number;
}

// Mining Session
export interface MiningSession {
  sessionId: string;
  nodeId: string;
  startTime: number;
  endTime?: number;
  duration: number;              // minutes
  computeUnitsContributed: number;
  kausEarned: number;
  sleepModeMinutes: number;
  performanceTier: PerformanceTier;
  status: 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED';
}

// Mining Statistics
export interface MiningStats {
  globalActiveNodes: number;
  globalComputePower: number;
  globalKausMined24h: number;
  averageNodeEarnings: number;
  topEarnerToday: number;
  networkHealth: number;        // 0-100
}

// Earnings Report
export interface EarningsReport {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  startDate: number;
  endDate: number;
  totalKausEarned: number;
  totalMiningHours: number;
  averageHourlyRate: number;
  sleepModeBonusEarned: number;
  networkBonusEarned: number;
  referralBonusEarned: number;
  deviceBreakdown: { deviceType: DeviceType; kausEarned: number; hours: number }[];
}

class MiniNodeMining {
  private nodes: Map<string, MiniNode> = new Map();
  private sessions: MiningSession[] = [];
  private globalStats: MiningStats;

  constructor() {
    this.globalStats = {
      globalActiveNodes: 0,
      globalComputePower: 0,
      globalKausMined24h: 0,
      averageNodeEarnings: 0,
      topEarnerToday: 0,
      networkHealth: 0,
    };
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock user's nodes
    const mockNodes: Partial<MiniNode>[] = [
      {
        nodeId: 'MINI-LAPTOP-001',
        userId: 'USER-BOSS',
        deviceType: 'LAPTOP',
        deviceName: 'MacBook Pro Work',
        deviceModel: 'MacBook Pro 16" M3 Max',
        osVersion: 'macOS 15.2',
        computePower: 280,
        performanceTier: 'BALANCED',
        status: 'ACTIVE',
        isSleeMode: false,
        totalMiningHours: 847,
        totalKausEarned: 127.5,
        todayKausEarned: 0.85,
      },
      {
        nodeId: 'MINI-DESKTOP-001',
        userId: 'USER-BOSS',
        deviceType: 'DESKTOP',
        deviceName: 'Home Gaming PC',
        deviceModel: 'Custom RTX 4090',
        osVersion: 'Windows 11 Pro',
        computePower: 750,
        performanceTier: 'PERFORMANCE',
        status: 'SLEEPING',
        isSleeMode: true,
        totalMiningHours: 2150,
        totalKausEarned: 485.2,
        todayKausEarned: 2.15,
      },
      {
        nodeId: 'MINI-PHONE-001',
        userId: 'USER-BOSS',
        deviceType: 'SMARTPHONE',
        deviceName: 'iPhone 16 Pro',
        deviceModel: 'iPhone 16 Pro Max',
        osVersion: 'iOS 18.2',
        computePower: 55,
        performanceTier: 'ECO',
        status: 'PAUSED',
        isSleeMode: false,
        totalMiningHours: 320,
        totalKausEarned: 15.8,
        todayKausEarned: 0.12,
      },
    ];

    mockNodes.forEach(node => {
      const fullNode: MiniNode = {
        nodeId: node.nodeId!,
        userId: node.userId!,
        deviceType: node.deviceType!,
        deviceName: node.deviceName!,
        deviceModel: node.deviceModel!,
        osVersion: node.osVersion!,
        computePower: node.computePower!,
        performanceTier: node.performanceTier!,
        status: node.status!,
        isSleeMode: node.isSleeMode!,
        totalMiningHours: node.totalMiningHours!,
        totalKausEarned: node.totalKausEarned!,
        todayKausEarned: node.todayKausEarned!,
        currentSessionStart: node.status === 'ACTIVE' ? Date.now() - Math.random() * 3600000 : undefined,
        lastHeartbeat: Date.now() - Math.random() * 60000,
        networkTier: this.calculateNetworkTier(node.totalMiningHours!),
        settings: {
          autoStartOnIdle: true,
          idleTimeMinutes: 5,
          sleepSchedule: { start: '23:00', end: '07:00' },
          maxCpuUsage: 50,
          maxRamUsage: 40,
          pauseOnBattery: true,
        },
        createdAt: Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000,
      };

      this.nodes.set(fullNode.nodeId, fullNode);
    });

    // Update global stats
    this.updateGlobalStats();

    // Generate mock sessions
    for (let i = 0; i < 50; i++) {
      const nodeIds = Array.from(this.nodes.keys());
      const nodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      const node = this.nodes.get(nodeId)!;
      const duration = Math.floor(Math.random() * 480) + 30; // 30 min to 8 hours
      const sleepMinutes = Math.random() > 0.5 ? Math.floor(duration * 0.7) : 0;

      const computeUnits = node.computePower * MINING_CONFIG.PERFORMANCE_MULTIPLIER[node.performanceTier] * (duration / 60);
      let kausEarned = computeUnits * MINING_CONFIG.BASE_REWARD_RATE;

      if (sleepMinutes > 0) {
        kausEarned *= MINING_CONFIG.SLEEP_MODE_BONUS;
      }

      this.sessions.push({
        sessionId: `SESSION-${Date.now()}-${i}`,
        nodeId,
        startTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        endTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + duration * 60000,
        duration,
        computeUnitsContributed: computeUnits,
        kausEarned,
        sleepModeMinutes: sleepMinutes,
        performanceTier: node.performanceTier,
        status: 'COMPLETED',
      });
    }
  }

  private calculateNetworkTier(hours: number): MiniNode['networkTier'] {
    if (hours >= MINING_CONFIG.NETWORK_BONUS.PLATINUM.hours) return 'PLATINUM';
    if (hours >= MINING_CONFIG.NETWORK_BONUS.GOLD.hours) return 'GOLD';
    if (hours >= MINING_CONFIG.NETWORK_BONUS.SILVER.hours) return 'SILVER';
    if (hours >= MINING_CONFIG.NETWORK_BONUS.BRONZE.hours) return 'BRONZE';
    return 'NONE';
  }

  private updateGlobalStats(): void {
    const allNodes = Array.from(this.nodes.values());
    const activeNodes = allNodes.filter(n => n.status === 'ACTIVE' || n.status === 'SLEEPING');

    this.globalStats = {
      globalActiveNodes: 127500 + activeNodes.length, // Simulated global + user's
      globalComputePower: activeNodes.reduce((sum, n) => sum + n.computePower, 0) + 8500000,
      globalKausMined24h: allNodes.reduce((sum, n) => sum + n.todayKausEarned, 0) + 12500,
      averageNodeEarnings: 0.085,
      topEarnerToday: 15.7,
      networkHealth: 97.5,
    };
  }

  /**
   * Register a new mini node
   */
  registerNode(params: {
    userId: string;
    deviceType: DeviceType;
    deviceName: string;
    deviceModel: string;
    osVersion: string;
  }): MiniNode {
    const deviceConfig = MINING_CONFIG.DEVICE_POWER[params.deviceType];
    const computePower = deviceConfig.base + Math.random() * (deviceConfig.range.max - deviceConfig.range.min);

    const node: MiniNode = {
      nodeId: `MINI-${params.deviceType}-${Date.now()}`,
      userId: params.userId,
      deviceType: params.deviceType,
      deviceName: params.deviceName,
      deviceModel: params.deviceModel,
      osVersion: params.osVersion,
      computePower: Math.round(computePower),
      performanceTier: 'BALANCED',
      status: 'OFFLINE',
      isSleeMode: false,
      totalMiningHours: 0,
      totalKausEarned: 0,
      todayKausEarned: 0,
      lastHeartbeat: Date.now(),
      networkTier: 'NONE',
      settings: {
        autoStartOnIdle: true,
        idleTimeMinutes: 5,
        sleepSchedule: null,
        maxCpuUsage: 50,
        maxRamUsage: 40,
        pauseOnBattery: true,
      },
      createdAt: Date.now(),
    };

    this.nodes.set(node.nodeId, node);
    this.updateGlobalStats();
    return node;
  }

  /**
   * Start mining session
   */
  startMining(nodeId: string): MiningSession {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error('Node not found');

    node.status = 'ACTIVE';
    node.currentSessionStart = Date.now();
    node.lastHeartbeat = Date.now();

    const session: MiningSession = {
      sessionId: `SESSION-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      nodeId,
      startTime: Date.now(),
      duration: 0,
      computeUnitsContributed: 0,
      kausEarned: 0,
      sleepModeMinutes: 0,
      performanceTier: node.performanceTier,
      status: 'ACTIVE',
    };

    this.sessions.push(session);
    this.updateGlobalStats();
    return session;
  }

  /**
   * Stop mining session
   */
  stopMining(nodeId: string): MiningSession | null {
    const node = this.nodes.get(nodeId);
    if (!node || !node.currentSessionStart) return null;

    const activeSession = this.sessions.find(s => s.nodeId === nodeId && s.status === 'ACTIVE');
    if (!activeSession) return null;

    const duration = Math.round((Date.now() - activeSession.startTime) / 60000);
    const computeUnits = node.computePower * MINING_CONFIG.PERFORMANCE_MULTIPLIER[node.performanceTier] * (duration / 60);

    let kausEarned = computeUnits * MINING_CONFIG.BASE_REWARD_RATE;

    // Apply bonuses
    if (node.isSleeMode) {
      kausEarned *= MINING_CONFIG.SLEEP_MODE_BONUS;
    }

    const networkBonus = MINING_CONFIG.NETWORK_BONUS[node.networkTier as keyof typeof MINING_CONFIG.NETWORK_BONUS];
    if (networkBonus) {
      kausEarned *= (1 + networkBonus.bonus);
    }

    activeSession.endTime = Date.now();
    activeSession.duration = duration;
    activeSession.computeUnitsContributed = computeUnits;
    activeSession.kausEarned = kausEarned;
    activeSession.sleepModeMinutes = node.isSleeMode ? duration : 0;
    activeSession.status = 'COMPLETED';

    // Update node stats
    node.status = 'OFFLINE';
    node.totalMiningHours += duration / 60;
    node.totalKausEarned += kausEarned;
    node.todayKausEarned += kausEarned;
    node.networkTier = this.calculateNetworkTier(node.totalMiningHours);
    node.currentSessionStart = undefined;

    this.updateGlobalStats();
    return activeSession;
  }

  /**
   * Toggle sleep mode
   */
  toggleSleepMode(nodeId: string, enabled: boolean): void {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error('Node not found');

    node.isSleeMode = enabled;
    node.status = enabled ? 'SLEEPING' : (node.status === 'SLEEPING' ? 'ACTIVE' : node.status);
  }

  /**
   * Update performance tier
   */
  updatePerformanceTier(nodeId: string, tier: PerformanceTier): void {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error('Node not found');

    node.performanceTier = tier;
  }

  /**
   * Get user's nodes
   */
  getUserNodes(userId: string): MiniNode[] {
    return Array.from(this.nodes.values()).filter(n => n.userId === userId);
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): MiniNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get mining sessions for node
   */
  getNodeSessions(nodeId: string, limit: number = 20): MiningSession[] {
    return this.sessions
      .filter(s => s.nodeId === nodeId)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Calculate estimated earnings
   */
  estimateEarnings(params: {
    deviceType: DeviceType;
    performanceTier: PerformanceTier;
    hoursPerDay: number;
    sleepModePercentage: number;
    networkTier: MiniNode['networkTier'];
  }): {
    dailyKaus: number;
    weeklyKaus: number;
    monthlyKaus: number;
    yearlyKaus: number;
    yearlyUsd: number;
  } {
    const deviceConfig = MINING_CONFIG.DEVICE_POWER[params.deviceType];
    const computePower = deviceConfig.base;
    const tierMultiplier = MINING_CONFIG.PERFORMANCE_MULTIPLIER[params.performanceTier];

    const computeUnitsPerHour = computePower * tierMultiplier;
    let hourlyKaus = computeUnitsPerHour * MINING_CONFIG.BASE_REWARD_RATE;

    // Apply sleep bonus
    const sleepHours = params.hoursPerDay * params.sleepModePercentage;
    const normalHours = params.hoursPerDay * (1 - params.sleepModePercentage);
    const dailyKaus = (normalHours * hourlyKaus) + (sleepHours * hourlyKaus * MINING_CONFIG.SLEEP_MODE_BONUS);

    // Apply network bonus
    const networkBonus = MINING_CONFIG.NETWORK_BONUS[params.networkTier as keyof typeof MINING_CONFIG.NETWORK_BONUS];
    const bonusMultiplier = networkBonus ? (1 + networkBonus.bonus) : 1;
    const adjustedDailyKaus = dailyKaus * bonusMultiplier;

    const kausPrice = 0.15; // Current K-AUS price

    return {
      dailyKaus: adjustedDailyKaus,
      weeklyKaus: adjustedDailyKaus * 7,
      monthlyKaus: adjustedDailyKaus * 30,
      yearlyKaus: adjustedDailyKaus * 365,
      yearlyUsd: adjustedDailyKaus * 365 * kausPrice,
    };
  }

  /**
   * Get earnings report
   */
  getEarningsReport(userId: string, period: EarningsReport['period']): EarningsReport {
    const userNodes = this.getUserNodes(userId);
    const nodeIds = userNodes.map(n => n.nodeId);

    let startDate: number;
    const endDate = Date.now();

    switch (period) {
      case 'DAILY':
        startDate = Date.now() - 24 * 60 * 60 * 1000;
        break;
      case 'WEEKLY':
        startDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'MONTHLY':
        startDate = Date.now() - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'ALL_TIME':
        startDate = 0;
        break;
    }

    const periodSessions = this.sessions.filter(
      s => nodeIds.includes(s.nodeId) && s.startTime >= startDate && s.status === 'COMPLETED'
    );

    const totalKaus = periodSessions.reduce((sum, s) => sum + s.kausEarned, 0);
    const totalHours = periodSessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    const sleepMinutes = periodSessions.reduce((sum, s) => sum + s.sleepModeMinutes, 0);

    // Calculate device breakdown
    const deviceMap = new Map<DeviceType, { kaus: number; hours: number }>();
    periodSessions.forEach(s => {
      const node = this.nodes.get(s.nodeId);
      if (node) {
        const existing = deviceMap.get(node.deviceType) || { kaus: 0, hours: 0 };
        existing.kaus += s.kausEarned;
        existing.hours += s.duration / 60;
        deviceMap.set(node.deviceType, existing);
      }
    });

    return {
      period,
      startDate,
      endDate,
      totalKausEarned: totalKaus,
      totalMiningHours: totalHours,
      averageHourlyRate: totalHours > 0 ? totalKaus / totalHours : 0,
      sleepModeBonusEarned: totalKaus * 0.25 * (sleepMinutes / (totalHours * 60) || 0),
      networkBonusEarned: totalKaus * 0.1, // Simplified
      referralBonusEarned: 0,
      deviceBreakdown: Array.from(deviceMap.entries()).map(([deviceType, data]) => ({
        deviceType,
        kausEarned: data.kaus,
        hours: data.hours,
      })),
    };
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): MiningStats {
    return { ...this.globalStats };
  }
}

// Singleton instance
export const miniNodeMining = new MiniNodeMining();

// Convenience exports
export const registerMiniNode = (params: Parameters<typeof miniNodeMining.registerNode>[0]) =>
  miniNodeMining.registerNode(params);
export const startNodeMining = (nodeId: string) => miniNodeMining.startMining(nodeId);
export const stopNodeMining = (nodeId: string) => miniNodeMining.stopMining(nodeId);
export const getUserMiniNodes = (userId: string) => miniNodeMining.getUserNodes(userId);
export const estimateMiningEarnings = (params: Parameters<typeof miniNodeMining.estimateEarnings>[0]) =>
  miniNodeMining.estimateEarnings(params);
export const getMiningReport = (userId: string, period: EarningsReport['period']) =>
  miniNodeMining.getEarningsReport(userId, period);
export const getGlobalMiningStats = () => miniNodeMining.getGlobalStats();
