/**
 * BACKGROUND HARVEST PROTOCOL
 *
 * Phase 19: Personal AI Banker - Deliverable 3
 * 유저 기기의 유휴 자원을 자동으로 수익화
 *
 * "당신이 자는 동안에도 부는 자라납니다"
 */

// ============================================
// TYPES
// ============================================

export type HarvestSource =
  | 'COMPUTE_IDLE'
  | 'BANDWIDTH_SPARE'
  | 'STORAGE_UNUSED'
  | 'ENERGY_ARBITRAGE'
  | 'STAKING_COMPOUND';

export type DeviceType = 'LAPTOP' | 'DESKTOP' | 'SMARTPHONE' | 'TABLET' | 'ROUTER' | 'NAS';

export type HarvestMode = 'SLEEP' | 'ACTIVE_IDLE' | 'LOW_PRIORITY' | 'AGGRESSIVE';

export interface HarvestSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  deviceId: string;
  deviceType: DeviceType;
  mode: HarvestMode;
  sources: HarvestSource[];
  metrics: {
    cpuUsed: number; // %
    bandwidthUsed: number; // Mbps
    storageUsed: number; // GB
    energyConsumed: number; // Wh
  };
  earnings: {
    computeKaus: number;
    bandwidthKaus: number;
    storageKaus: number;
    arbitrageKaus: number;
    stakingKaus: number;
    totalKaus: number;
    totalUSD: number;
  };
  bonuses: {
    sleepBonus: number;
    consistencyBonus: number;
    networkTierBonus: number;
    totalBonus: number;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ERROR';
}

export interface DeviceHarvestConfig {
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  enabled: boolean;
  autoStart: boolean;
  maxCpuUsage: number; // %
  maxBandwidth: number; // Mbps
  maxStorage: number; // GB
  sleepHoursStart: number; // 0-23
  sleepHoursEnd: number; // 0-23
  preferredMode: HarvestMode;
  allowedSources: HarvestSource[];
}

export interface HarvestReward {
  source: HarvestSource;
  baseRate: number; // K-AUS per unit per hour
  unit: string;
  description: string;
}

export interface DailyHarvestSummary {
  date: Date;
  totalSessions: number;
  totalHours: number;
  totalKausEarned: number;
  totalUSDEarned: number;
  bySource: Record<HarvestSource, number>;
  byDevice: Record<string, number>;
  bonusesEarned: number;
  efficiencyScore: number; // 0-100
}

export interface HarvestProjection {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  assumedHoursPerDay: number;
  assumedDevices: number;
}

// ============================================
// CONSTANTS
// ============================================

const KAUS_PRICE = 2.47;

export const HARVEST_RATES: Record<HarvestSource, HarvestReward> = {
  COMPUTE_IDLE: {
    source: 'COMPUTE_IDLE',
    baseRate: 0.0001, // K-AUS per CPU% per hour
    unit: 'CPU%',
    description: '유휴 CPU 연산력 기여',
  },
  BANDWIDTH_SPARE: {
    source: 'BANDWIDTH_SPARE',
    baseRate: 0.00005, // K-AUS per Mbps per hour
    unit: 'Mbps',
    description: '여유 대역폭 공유',
  },
  STORAGE_UNUSED: {
    source: 'STORAGE_UNUSED',
    baseRate: 0.0002, // K-AUS per GB per hour
    unit: 'GB',
    description: '미사용 저장공간 제공',
  },
  ENERGY_ARBITRAGE: {
    source: 'ENERGY_ARBITRAGE',
    baseRate: 0.001, // K-AUS per kWh optimized
    unit: 'kWh',
    description: '에너지 가격 차익 거래',
  },
  STAKING_COMPOUND: {
    source: 'STAKING_COMPOUND',
    baseRate: 0.00014, // K-AUS per staked K-AUS per hour (≈12% APY)
    unit: 'K-AUS staked',
    description: '스테이킹 복리 자동화',
  },
};

export const MODE_MULTIPLIERS: Record<HarvestMode, number> = {
  SLEEP: 1.25, // 25% bonus during sleep
  ACTIVE_IDLE: 1.0, // Normal rate
  LOW_PRIORITY: 0.8, // 80% rate but minimal impact
  AGGRESSIVE: 1.5, // 50% bonus but higher resource usage
};

export const DEVICE_CAPABILITIES: Record<DeviceType, {
  maxCpu: number;
  maxBandwidth: number;
  maxStorage: number;
  efficiencyMultiplier: number;
}> = {
  DESKTOP: { maxCpu: 100, maxBandwidth: 1000, maxStorage: 500, efficiencyMultiplier: 1.2 },
  LAPTOP: { maxCpu: 80, maxBandwidth: 500, maxStorage: 200, efficiencyMultiplier: 1.0 },
  SMARTPHONE: { maxCpu: 30, maxBandwidth: 100, maxStorage: 50, efficiencyMultiplier: 0.8 },
  TABLET: { maxCpu: 40, maxBandwidth: 200, maxStorage: 100, efficiencyMultiplier: 0.9 },
  ROUTER: { maxCpu: 10, maxBandwidth: 2000, maxStorage: 0, efficiencyMultiplier: 1.5 },
  NAS: { maxCpu: 20, maxBandwidth: 500, maxStorage: 10000, efficiencyMultiplier: 1.3 },
};

// ============================================
// BACKGROUND HARVEST ENGINE CLASS
// ============================================

class BackgroundHarvestEngine {
  private sessions: HarvestSession[] = [];
  private configs: Map<string, DeviceHarvestConfig[]> = new Map();
  private activeSessions: Map<string, HarvestSession> = new Map();
  private networkTier: Map<string, { tier: string; bonus: number }> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Boss devices
    this.configs.set('USER-BOSS', [
      {
        deviceId: 'DEV-001',
        deviceType: 'DESKTOP',
        deviceName: 'Main Workstation',
        enabled: true,
        autoStart: true,
        maxCpuUsage: 80,
        maxBandwidth: 500,
        maxStorage: 200,
        sleepHoursStart: 23,
        sleepHoursEnd: 7,
        preferredMode: 'SLEEP',
        allowedSources: ['COMPUTE_IDLE', 'BANDWIDTH_SPARE', 'STORAGE_UNUSED', 'STAKING_COMPOUND'],
      },
      {
        deviceId: 'DEV-002',
        deviceType: 'LAPTOP',
        deviceName: 'MacBook Pro',
        enabled: true,
        autoStart: true,
        maxCpuUsage: 60,
        maxBandwidth: 200,
        maxStorage: 100,
        sleepHoursStart: 0,
        sleepHoursEnd: 6,
        preferredMode: 'LOW_PRIORITY',
        allowedSources: ['COMPUTE_IDLE', 'STAKING_COMPOUND'],
      },
      {
        deviceId: 'DEV-003',
        deviceType: 'SMARTPHONE',
        deviceName: 'iPhone 15 Pro',
        enabled: true,
        autoStart: true,
        maxCpuUsage: 20,
        maxBandwidth: 50,
        maxStorage: 20,
        sleepHoursStart: 1,
        sleepHoursEnd: 6,
        preferredMode: 'SLEEP',
        allowedSources: ['BANDWIDTH_SPARE', 'STAKING_COMPOUND'],
      },
      {
        deviceId: 'DEV-004',
        deviceType: 'ROUTER',
        deviceName: 'UniFi Dream Machine',
        enabled: true,
        autoStart: true,
        maxCpuUsage: 10,
        maxBandwidth: 1000,
        maxStorage: 0,
        sleepHoursStart: 0,
        sleepHoursEnd: 24,
        preferredMode: 'ACTIVE_IDLE',
        allowedSources: ['BANDWIDTH_SPARE'],
      },
    ]);

    // Network tier
    this.networkTier.set('USER-BOSS', { tier: 'GOLD', bonus: 0.15 });

    // Generate historical sessions
    for (let i = 0; i < 100; i++) {
      const devices = this.configs.get('USER-BOSS') || [];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const hoursAgo = i * 2 + Math.random() * 2;
      const duration = 1 + Math.random() * 6; // 1-7 hours

      const isSleep = Math.random() > 0.4;
      const mode: HarvestMode = isSleep ? 'SLEEP' : 'ACTIVE_IDLE';

      const cpuUsed = Math.random() * device.maxCpuUsage;
      const bandwidthUsed = Math.random() * device.maxBandwidth * 0.3;
      const storageUsed = Math.random() * device.maxStorage * 0.1;

      const computeKaus = cpuUsed * HARVEST_RATES.COMPUTE_IDLE.baseRate * duration;
      const bandwidthKaus = bandwidthUsed * HARVEST_RATES.BANDWIDTH_SPARE.baseRate * duration;
      const storageKaus = storageUsed * HARVEST_RATES.STORAGE_UNUSED.baseRate * duration;
      const stakingKaus = 10000 * HARVEST_RATES.STAKING_COMPOUND.baseRate * duration; // Assume 10k staked

      const modeMultiplier = MODE_MULTIPLIERS[mode];
      const deviceMultiplier = DEVICE_CAPABILITIES[device.deviceType].efficiencyMultiplier;
      const networkBonus = this.networkTier.get('USER-BOSS')?.bonus || 0;

      const baseTotal = (computeKaus + bandwidthKaus + storageKaus + stakingKaus) * deviceMultiplier;
      const sleepBonus = isSleep ? baseTotal * 0.25 : 0;
      const consistencyBonus = baseTotal * 0.05;
      const networkTierBonus = baseTotal * networkBonus;

      const totalKaus = baseTotal + sleepBonus + consistencyBonus + networkTierBonus;

      this.sessions.push({
        id: `HARVEST-${String(i + 1).padStart(5, '0')}`,
        startTime: new Date(Date.now() - hoursAgo * 3600000),
        endTime: new Date(Date.now() - (hoursAgo - duration) * 3600000),
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        mode,
        sources: device.allowedSources,
        metrics: {
          cpuUsed,
          bandwidthUsed,
          storageUsed,
          energyConsumed: cpuUsed * 0.5 * duration, // Rough estimate
        },
        earnings: {
          computeKaus,
          bandwidthKaus,
          storageKaus,
          arbitrageKaus: 0,
          stakingKaus,
          totalKaus,
          totalUSD: totalKaus * KAUS_PRICE,
        },
        bonuses: {
          sleepBonus,
          consistencyBonus,
          networkTierBonus,
          totalBonus: sleepBonus + consistencyBonus + networkTierBonus,
        },
        status: 'COMPLETED',
      });
    }

    // Create one active session
    const activeDevice = this.configs.get('USER-BOSS')?.[0];
    if (activeDevice) {
      const activeSession: HarvestSession = {
        id: `HARVEST-ACTIVE-001`,
        startTime: new Date(Date.now() - 2 * 3600000),
        deviceId: activeDevice.deviceId,
        deviceType: activeDevice.deviceType,
        mode: 'ACTIVE_IDLE',
        sources: activeDevice.allowedSources,
        metrics: {
          cpuUsed: 45,
          bandwidthUsed: 120,
          storageUsed: 85,
          energyConsumed: 45,
        },
        earnings: {
          computeKaus: 0.009,
          bandwidthKaus: 0.012,
          storageKaus: 0.034,
          arbitrageKaus: 0,
          stakingKaus: 2.8,
          totalKaus: 2.855,
          totalUSD: 2.855 * KAUS_PRICE,
        },
        bonuses: {
          sleepBonus: 0,
          consistencyBonus: 0.14,
          networkTierBonus: 0.43,
          totalBonus: 0.57,
        },
        status: 'ACTIVE',
      };
      this.activeSessions.set(activeDevice.deviceId, activeSession);
    }
  }

  // Get device configs for user
  getDeviceConfigs(userId: string): DeviceHarvestConfig[] {
    return this.configs.get(userId) || [];
  }

  // Update device config
  updateDeviceConfig(
    userId: string,
    deviceId: string,
    config: Partial<DeviceHarvestConfig>
  ): void {
    const configs = this.configs.get(userId);
    if (configs) {
      const index = configs.findIndex((c) => c.deviceId === deviceId);
      if (index !== -1) {
        configs[index] = { ...configs[index], ...config };
      }
    }
  }

  // Add new device
  registerDevice(userId: string, config: DeviceHarvestConfig): void {
    const configs = this.configs.get(userId) || [];
    configs.push(config);
    this.configs.set(userId, configs);
  }

  // Get active sessions
  getActiveSessions(userId: string): HarvestSession[] {
    const configs = this.configs.get(userId) || [];
    return configs
      .map((c) => this.activeSessions.get(c.deviceId))
      .filter((s): s is HarvestSession => s !== undefined);
  }

  // Get session history
  getSessionHistory(
    userId: string,
    options: { limit?: number; deviceId?: string; startDate?: Date; endDate?: Date } = {}
  ): HarvestSession[] {
    const configs = this.configs.get(userId) || [];
    const deviceIds = configs.map((c) => c.deviceId);

    let filtered = this.sessions.filter((s) => deviceIds.includes(s.deviceId));

    if (options.deviceId) {
      filtered = filtered.filter((s) => s.deviceId === options.deviceId);
    }

    if (options.startDate) {
      filtered = filtered.filter((s) => s.startTime >= options.startDate!);
    }

    if (options.endDate) {
      filtered = filtered.filter((s) => s.startTime <= options.endDate!);
    }

    filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return options.limit ? filtered.slice(0, options.limit) : filtered;
  }

  // Get daily summary
  getDailySummary(userId: string, date: Date = new Date()): DailyHarvestSummary {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const daySessions = this.getSessionHistory(userId, {
      startDate: startOfDay,
      endDate: endOfDay,
    });

    const bySource: Record<HarvestSource, number> = {
      COMPUTE_IDLE: 0,
      BANDWIDTH_SPARE: 0,
      STORAGE_UNUSED: 0,
      ENERGY_ARBITRAGE: 0,
      STAKING_COMPOUND: 0,
    };

    const byDevice: Record<string, number> = {};

    let totalHours = 0;
    let totalKaus = 0;
    let bonuses = 0;

    daySessions.forEach((s) => {
      const duration =
        ((s.endTime?.getTime() || Date.now()) - s.startTime.getTime()) / 3600000;
      totalHours += duration;
      totalKaus += s.earnings.totalKaus;
      bonuses += s.bonuses.totalBonus;

      bySource.COMPUTE_IDLE += s.earnings.computeKaus;
      bySource.BANDWIDTH_SPARE += s.earnings.bandwidthKaus;
      bySource.STORAGE_UNUSED += s.earnings.storageKaus;
      bySource.ENERGY_ARBITRAGE += s.earnings.arbitrageKaus;
      bySource.STAKING_COMPOUND += s.earnings.stakingKaus;

      byDevice[s.deviceId] = (byDevice[s.deviceId] || 0) + s.earnings.totalKaus;
    });

    const maxPossibleHours = 24 * (this.configs.get(userId)?.length || 1);
    const efficiencyScore = Math.min(100, (totalHours / maxPossibleHours) * 100);

    return {
      date,
      totalSessions: daySessions.length,
      totalHours,
      totalKausEarned: totalKaus,
      totalUSDEarned: totalKaus * KAUS_PRICE,
      bySource,
      byDevice,
      bonusesEarned: bonuses,
      efficiencyScore,
    };
  }

  // Project earnings
  projectEarnings(userId: string, hoursPerDay: number = 8): HarvestProjection {
    const configs = this.configs.get(userId) || [];
    const networkBonus = this.networkTier.get(userId)?.bonus || 0;

    let dailyEstimate = 0;

    configs.forEach((config) => {
      if (!config.enabled) return;

      const deviceCap = DEVICE_CAPABILITIES[config.deviceType];
      const avgCpu = config.maxCpuUsage * 0.5;
      const avgBandwidth = config.maxBandwidth * 0.2;
      const avgStorage = config.maxStorage * 0.1;

      const computeEarn = avgCpu * HARVEST_RATES.COMPUTE_IDLE.baseRate * hoursPerDay;
      const bandwidthEarn = avgBandwidth * HARVEST_RATES.BANDWIDTH_SPARE.baseRate * hoursPerDay;
      const storageEarn = avgStorage * HARVEST_RATES.STORAGE_UNUSED.baseRate * hoursPerDay;
      const stakingEarn = 10000 * HARVEST_RATES.STAKING_COMPOUND.baseRate * hoursPerDay;

      const base = (computeEarn + bandwidthEarn + storageEarn + stakingEarn) * deviceCap.efficiencyMultiplier;
      const withBonuses = base * (1 + 0.15 + networkBonus); // Sleep + network bonus

      dailyEstimate += withBonuses;
    });

    return {
      daily: dailyEstimate,
      weekly: dailyEstimate * 7,
      monthly: dailyEstimate * 30,
      yearly: dailyEstimate * 365,
      assumedHoursPerDay: hoursPerDay,
      assumedDevices: configs.filter((c) => c.enabled).length,
    };
  }

  // Get network tier
  getNetworkTier(userId: string): { tier: string; bonus: number } | undefined {
    return this.networkTier.get(userId);
  }

  // Start harvest session
  startSession(userId: string, deviceId: string): HarvestSession | null {
    const configs = this.configs.get(userId);
    const config = configs?.find((c) => c.deviceId === deviceId);

    if (!config || !config.enabled) return null;

    const session: HarvestSession = {
      id: `HARVEST-${Date.now()}`,
      startTime: new Date(),
      deviceId,
      deviceType: config.deviceType,
      mode: config.preferredMode,
      sources: config.allowedSources,
      metrics: { cpuUsed: 0, bandwidthUsed: 0, storageUsed: 0, energyConsumed: 0 },
      earnings: {
        computeKaus: 0,
        bandwidthKaus: 0,
        storageKaus: 0,
        arbitrageKaus: 0,
        stakingKaus: 0,
        totalKaus: 0,
        totalUSD: 0,
      },
      bonuses: { sleepBonus: 0, consistencyBonus: 0, networkTierBonus: 0, totalBonus: 0 },
      status: 'ACTIVE',
    };

    this.activeSessions.set(deviceId, session);
    return session;
  }

  // Stop harvest session
  stopSession(userId: string, deviceId: string): HarvestSession | null {
    const session = this.activeSessions.get(deviceId);
    if (!session) return null;

    session.endTime = new Date();
    session.status = 'COMPLETED';
    this.sessions.unshift(session);
    this.activeSessions.delete(deviceId);

    return session;
  }

  // Get total earnings
  getTotalEarnings(userId: string): {
    allTime: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
  } {
    const sessions = this.getSessionHistory(userId);
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let allTime = 0,
      thisMonth = 0,
      thisWeek = 0,
      today = 0;

    sessions.forEach((s) => {
      allTime += s.earnings.totalKaus;
      if (s.startTime >= startOfMonth) thisMonth += s.earnings.totalKaus;
      if (s.startTime >= startOfWeek) thisWeek += s.earnings.totalKaus;
      if (s.startTime >= startOfToday) today += s.earnings.totalKaus;
    });

    return { allTime, thisMonth, thisWeek, today };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const backgroundHarvestEngine = new BackgroundHarvestEngine();

// Convenience exports
export const getDeviceConfigs = (userId: string) => backgroundHarvestEngine.getDeviceConfigs(userId);
export const updateDeviceConfig = (
  userId: string,
  deviceId: string,
  config: Partial<DeviceHarvestConfig>
) => backgroundHarvestEngine.updateDeviceConfig(userId, deviceId, config);
export const registerDevice = (userId: string, config: DeviceHarvestConfig) =>
  backgroundHarvestEngine.registerDevice(userId, config);
export const getActiveSessions = (userId: string) => backgroundHarvestEngine.getActiveSessions(userId);
export const getSessionHistory = (userId: string, options?: Parameters<typeof backgroundHarvestEngine.getSessionHistory>[1]) =>
  backgroundHarvestEngine.getSessionHistory(userId, options);
export const getDailySummary = (userId: string, date?: Date) =>
  backgroundHarvestEngine.getDailySummary(userId, date);
export const projectEarnings = (userId: string, hoursPerDay?: number) =>
  backgroundHarvestEngine.projectEarnings(userId, hoursPerDay);
export const getNetworkTier = (userId: string) => backgroundHarvestEngine.getNetworkTier(userId);
export const startHarvestSession = (userId: string, deviceId: string) =>
  backgroundHarvestEngine.startSession(userId, deviceId);
export const stopHarvestSession = (userId: string, deviceId: string) =>
  backgroundHarvestEngine.stopSession(userId, deviceId);
export const getTotalHarvestEarnings = (userId: string) => backgroundHarvestEngine.getTotalEarnings(userId);
