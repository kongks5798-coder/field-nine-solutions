/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESLA V2G & POWERWALL INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 24: Partnership Integration
 *
 * Tesla Fleet API 연동을 통한 V2G (Vehicle-to-Grid) 에너지 거래
 *
 * FEATURES:
 * - Tesla Fleet API 연동
 * - V2G 양방향 에너지 거래
 * - Powerwall 가상 발전소 운영
 * - 자동 충전/방전 최적화
 * - K-AUS 보상 자동 지급
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TeslaCredentials {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

export interface TeslaVehicle {
  id: string;
  vin: string;
  displayName: string;
  model: 'Model S' | 'Model 3' | 'Model X' | 'Model Y' | 'Cybertruck';
  batteryCapacity: number; // kWh
  currentCharge: number; // %
  chargeLimit: number; // %
  v2gEnabled: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  lastSeen: string;
}

export interface Powerwall {
  id: string;
  siteName: string;
  capacity: number; // kWh
  currentCharge: number; // %
  solarPanels: {
    installed: boolean;
    capacity: number; // kW
    currentOutput: number; // kW
  };
  gridStatus: 'connected' | 'islanded' | 'offline';
  backupReserve: number; // %
}

export interface V2GSession {
  sessionId: string;
  vehicleId: string;
  type: 'CHARGE' | 'DISCHARGE';
  startTime: string;
  endTime?: string;
  energyTransferred: number; // kWh
  ratePerKwh: number; // USD
  totalEarnings: number; // USD
  kausReward: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface VPPContribution {
  contributionId: string;
  sourceType: 'VEHICLE' | 'POWERWALL';
  sourceId: string;
  periodStart: string;
  periodEnd: string;
  energyContributed: number; // kWh
  gridStabilizationEvents: number;
  earnings: number; // USD
  kausReward: number;
}

export interface EnergyOptimizationPlan {
  planId: string;
  vehicleId?: string;
  powerwallId?: string;
  createdAt: string;
  schedule: {
    time: string;
    action: 'CHARGE' | 'DISCHARGE' | 'HOLD';
    targetSoC: number;
    reason: string;
  }[];
  expectedSavings: number; // USD
  expectedKausReward: number;
}

export interface TeslaFleetStats {
  totalVehicles: number;
  totalPowerwalls: number;
  totalBatteryCapacity: number; // MWh
  availableCapacity: number; // MWh
  activeV2GSessions: number;
  todayEnergyTraded: number; // MWh
  todayEarnings: number; // USD
  todayKausDistributed: number;
  gridContributions: {
    peakShaving: number; // MWh
    frequencyRegulation: number; // MWh
    demandResponse: number; // events
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const TESLA_CONFIG = {
  // API Endpoints
  API_BASE_URL: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
  AUTH_URL: 'https://auth.tesla.com/oauth2/v3',

  // V2G Parameters
  V2G: {
    MIN_SOC_FOR_DISCHARGE: 30, // Don't discharge below 30%
    MAX_DISCHARGE_RATE: 11.5, // kW
    MAX_CHARGE_RATE: 250, // kW (Supercharger)
    HOME_CHARGE_RATE: 11.5, // kW (Wall Connector)
  },

  // Powerwall Parameters
  POWERWALL: {
    MIN_BACKUP_RESERVE: 20, // %
    MAX_GRID_EXPORT: 5, // kW
    STORM_WATCH_RESERVE: 100, // %
  },

  // Pricing
  PRICING: {
    PEAK_RATE: 0.35, // USD/kWh
    OFF_PEAK_RATE: 0.12, // USD/kWh
    V2G_PREMIUM: 1.5, // 50% premium for V2G discharge
    GRID_SERVICE_BONUS: 0.05, // USD/kWh for grid stabilization
  },

  // K-AUS Rewards
  KAUS_REWARDS: {
    PER_KWH_DISCHARGED: 10, // 10 K-AUS per kWh discharged to grid
    PER_KWH_SOLAR: 5, // 5 K-AUS per kWh solar generated
    GRID_EVENT_BONUS: 100, // 100 K-AUS per grid stabilization event
    DAILY_PARTICIPATION: 25, // 25 K-AUS for daily VPP participation
  },

  // Peak Hours (for optimization)
  PEAK_HOURS: {
    MORNING: { start: 7, end: 9 },
    EVENING: { start: 18, end: 21 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESLA INTEGRATION CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TeslaIntegration {
  private credentials: TeslaCredentials | null = null;
  private connected: boolean = false;
  private vehicles: Map<string, TeslaVehicle> = new Map();
  private powerwalls: Map<string, Powerwall> = new Map();
  private activeSessions: Map<string, V2GSession> = new Map();
  private fleetStats: TeslaFleetStats | null = null;

  constructor() {
    console.log('[TESLA] Tesla V2G & Powerwall Integration initialized');
  }

  /**
   * Connect to Tesla Fleet API
   */
  async connect(credentials: TeslaCredentials): Promise<boolean> {
    console.log('[TESLA] Connecting to Tesla Fleet API...');

    // Simulate API authentication
    await this.simulateDelay(500);

    this.credentials = credentials;
    this.connected = true;

    // Initialize mock fleet data
    await this.initializeFleetData();

    console.log('[TESLA] Connected successfully. Fleet loaded.');
    return true;
  }

  /**
   * Initialize fleet data with realistic mock values
   */
  private async initializeFleetData(): Promise<void> {
    // Add vehicles
    const vehicleModels: TeslaVehicle['model'][] = ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'];
    const batteryCapacities: Record<TeslaVehicle['model'], number> = {
      'Model S': 100,
      'Model 3': 82,
      'Model X': 100,
      'Model Y': 75,
      'Cybertruck': 123,
    };

    for (let i = 0; i < 2500; i++) {
      const model = vehicleModels[Math.floor(Math.random() * vehicleModels.length)];
      const id = `VEHICLE-${String(i + 1).padStart(5, '0')}`;

      this.vehicles.set(id, {
        id,
        vin: `5YJ${model[6]}${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
        displayName: `${model} #${i + 1}`,
        model,
        batteryCapacity: batteryCapacities[model],
        currentCharge: 30 + Math.floor(Math.random() * 60),
        chargeLimit: 80 + Math.floor(Math.random() * 20),
        v2gEnabled: Math.random() > 0.3, // 70% V2G enabled
        location: {
          latitude: 37.5 + (Math.random() - 0.5) * 2,
          longitude: 127 + (Math.random() - 0.5) * 2,
        },
        lastSeen: new Date().toISOString(),
      });
    }

    // Add Powerwalls
    for (let i = 0; i < 850; i++) {
      const id = `POWERWALL-${String(i + 1).padStart(4, '0')}`;
      const hasSolar = Math.random() > 0.2; // 80% have solar

      this.powerwalls.set(id, {
        id,
        siteName: `Site ${i + 1}`,
        capacity: 13.5 * (1 + Math.floor(Math.random() * 3)), // 1-3 Powerwalls stacked
        currentCharge: 20 + Math.floor(Math.random() * 70),
        solarPanels: {
          installed: hasSolar,
          capacity: hasSolar ? 5 + Math.floor(Math.random() * 15) : 0,
          currentOutput: hasSolar ? Math.floor(Math.random() * 10) : 0,
        },
        gridStatus: 'connected',
        backupReserve: 20,
      });
    }

    // Calculate fleet stats
    this.updateFleetStats();

    console.log(`[TESLA] Fleet initialized: ${this.vehicles.size} vehicles, ${this.powerwalls.size} Powerwalls`);
  }

  /**
   * Update fleet statistics
   */
  private updateFleetStats(): void {
    const vehiclesArray = Array.from(this.vehicles.values());
    const powerwallsArray = Array.from(this.powerwalls.values());

    const totalVehicleCapacity = vehiclesArray.reduce((sum, v) => sum + v.batteryCapacity, 0);
    const totalPowerwallCapacity = powerwallsArray.reduce((sum, p) => sum + p.capacity, 0);
    const totalCapacity = (totalVehicleCapacity + totalPowerwallCapacity) / 1000; // Convert to MWh

    const availableVehicleCapacity = vehiclesArray
      .filter(v => v.v2gEnabled && v.currentCharge > TESLA_CONFIG.V2G.MIN_SOC_FOR_DISCHARGE)
      .reduce((sum, v) => sum + (v.batteryCapacity * (v.currentCharge - TESLA_CONFIG.V2G.MIN_SOC_FOR_DISCHARGE) / 100), 0);

    const availablePowerwallCapacity = powerwallsArray
      .reduce((sum, p) => sum + (p.capacity * (p.currentCharge - p.backupReserve) / 100), 0);

    const availableCapacity = (availableVehicleCapacity + availablePowerwallCapacity) / 1000;

    this.fleetStats = {
      totalVehicles: vehiclesArray.length,
      totalPowerwalls: powerwallsArray.length,
      totalBatteryCapacity: totalCapacity,
      availableCapacity,
      activeV2GSessions: this.activeSessions.size,
      todayEnergyTraded: 45.7 + Math.random() * 10,
      todayEarnings: 15800 + Math.floor(Math.random() * 2000),
      todayKausDistributed: 125000 + Math.floor(Math.random() * 10000),
      gridContributions: {
        peakShaving: 28.5 + Math.random() * 5,
        frequencyRegulation: 12.3 + Math.random() * 3,
        demandResponse: 15 + Math.floor(Math.random() * 5),
      },
    };
  }

  /**
   * Get all vehicles
   */
  getVehicles(): TeslaVehicle[] {
    this.checkConnection();
    return Array.from(this.vehicles.values());
  }

  /**
   * Get all Powerwalls
   */
  getPowerwalls(): Powerwall[] {
    this.checkConnection();
    return Array.from(this.powerwalls.values());
  }

  /**
   * Get fleet statistics
   */
  getFleetStats(): TeslaFleetStats {
    this.checkConnection();
    this.updateFleetStats();
    return this.fleetStats!;
  }

  /**
   * Start V2G discharge session
   */
  async startV2GDischarge(
    vehicleId: string,
    targetKwh: number
  ): Promise<V2GSession> {
    this.checkConnection();

    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }
    if (!vehicle.v2gEnabled) {
      throw new Error(`Vehicle ${vehicleId} does not have V2G enabled`);
    }
    if (vehicle.currentCharge <= TESLA_CONFIG.V2G.MIN_SOC_FOR_DISCHARGE) {
      throw new Error(`Vehicle charge too low for V2G discharge`);
    }

    const maxDischarge = vehicle.batteryCapacity * (vehicle.currentCharge - TESLA_CONFIG.V2G.MIN_SOC_FOR_DISCHARGE) / 100;
    const actualDischarge = Math.min(targetKwh, maxDischarge);

    const isPeakHour = this.isPeakHour();
    const rate = isPeakHour
      ? TESLA_CONFIG.PRICING.PEAK_RATE * TESLA_CONFIG.PRICING.V2G_PREMIUM
      : TESLA_CONFIG.PRICING.OFF_PEAK_RATE * TESLA_CONFIG.PRICING.V2G_PREMIUM;

    const session: V2GSession = {
      sessionId: `V2G-${Date.now()}`,
      vehicleId,
      type: 'DISCHARGE',
      startTime: new Date().toISOString(),
      energyTransferred: actualDischarge,
      ratePerKwh: rate,
      totalEarnings: actualDischarge * rate,
      kausReward: actualDischarge * TESLA_CONFIG.KAUS_REWARDS.PER_KWH_DISCHARGED,
      status: 'active',
    };

    this.activeSessions.set(session.sessionId, session);

    // Update vehicle charge
    vehicle.currentCharge -= (actualDischarge / vehicle.batteryCapacity) * 100;

    console.log(`[TESLA] V2G session started: ${actualDischarge.toFixed(1)} kWh @ $${rate.toFixed(2)}/kWh`);
    return session;
  }

  /**
   * Start vehicle charging session
   */
  async startCharging(
    vehicleId: string,
    targetSoC: number
  ): Promise<V2GSession> {
    this.checkConnection();

    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }

    const energyNeeded = vehicle.batteryCapacity * (targetSoC - vehicle.currentCharge) / 100;
    const isPeakHour = this.isPeakHour();
    const rate = isPeakHour
      ? TESLA_CONFIG.PRICING.PEAK_RATE
      : TESLA_CONFIG.PRICING.OFF_PEAK_RATE;

    const session: V2GSession = {
      sessionId: `CHG-${Date.now()}`,
      vehicleId,
      type: 'CHARGE',
      startTime: new Date().toISOString(),
      energyTransferred: energyNeeded,
      ratePerKwh: rate,
      totalEarnings: -energyNeeded * rate, // Negative = cost
      kausReward: 0,
      status: 'active',
    };

    this.activeSessions.set(session.sessionId, session);

    console.log(`[TESLA] Charging session started: ${energyNeeded.toFixed(1)} kWh @ $${rate.toFixed(2)}/kWh`);
    return session;
  }

  /**
   * Get Powerwall contribution to VPP
   */
  async getPowerwallVPPContribution(powerwallId: string): Promise<VPPContribution> {
    this.checkConnection();

    const powerwall = this.powerwalls.get(powerwallId);
    if (!powerwall) {
      throw new Error(`Powerwall ${powerwallId} not found`);
    }

    const energyContributed = Math.random() * 20 + 5; // 5-25 kWh
    const gridEvents = Math.floor(Math.random() * 5);

    const contribution: VPPContribution = {
      contributionId: `VPP-${Date.now()}`,
      sourceType: 'POWERWALL',
      sourceId: powerwallId,
      periodStart: new Date(Date.now() - 86400000).toISOString(),
      periodEnd: new Date().toISOString(),
      energyContributed,
      gridStabilizationEvents: gridEvents,
      earnings: energyContributed * TESLA_CONFIG.PRICING.GRID_SERVICE_BONUS + gridEvents * 5,
      kausReward: (powerwall.solarPanels.installed ? energyContributed * TESLA_CONFIG.KAUS_REWARDS.PER_KWH_SOLAR : 0) +
                  gridEvents * TESLA_CONFIG.KAUS_REWARDS.GRID_EVENT_BONUS +
                  TESLA_CONFIG.KAUS_REWARDS.DAILY_PARTICIPATION,
    };

    return contribution;
  }

  /**
   * Generate energy optimization plan
   */
  generateOptimizationPlan(vehicleId: string): EnergyOptimizationPlan {
    this.checkConnection();

    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }

    const schedule: EnergyOptimizationPlan['schedule'] = [];
    const now = new Date();

    // Add optimization schedule
    for (let i = 0; i < 24; i++) {
      const hour = (now.getHours() + i) % 24;
      const time = new Date(now.getTime() + i * 3600000).toISOString();

      if (hour >= 1 && hour < 6) {
        // Off-peak: Charge
        schedule.push({
          time,
          action: 'CHARGE',
          targetSoC: 90,
          reason: 'Off-peak rates - optimal charging window',
        });
      } else if ((hour >= 7 && hour < 9) || (hour >= 18 && hour < 21)) {
        // Peak hours: Discharge if above minimum
        schedule.push({
          time,
          action: vehicle.currentCharge > 50 ? 'DISCHARGE' : 'HOLD',
          targetSoC: 40,
          reason: 'Peak demand - V2G revenue opportunity',
        });
      } else {
        schedule.push({
          time,
          action: 'HOLD',
          targetSoC: vehicle.currentCharge,
          reason: 'Mid-rate period - maintain charge',
        });
      }
    }

    const expectedSavings = 15 + Math.random() * 10; // $15-25 daily
    const expectedKaus = Math.floor(200 + Math.random() * 100); // 200-300 K-AUS

    return {
      planId: `OPT-${Date.now()}`,
      vehicleId,
      createdAt: now.toISOString(),
      schedule,
      expectedSavings,
      expectedKausReward: expectedKaus,
    };
  }

  /**
   * Check if current time is peak hour
   */
  private isPeakHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= TESLA_CONFIG.PEAK_HOURS.MORNING.start && hour < TESLA_CONFIG.PEAK_HOURS.MORNING.end) ||
           (hour >= TESLA_CONFIG.PEAK_HOURS.EVENING.start && hour < TESLA_CONFIG.PEAK_HOURS.EVENING.end);
  }

  /**
   * Check connection status
   */
  private checkConnection(): void {
    if (!this.connected) {
      throw new Error('[TESLA] Not connected. Call connect() first.');
    }
  }

  /**
   * Simulate API delay
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Disconnect from Tesla API
   */
  disconnect(): void {
    this.connected = false;
    this.credentials = null;
    console.log('[TESLA] Disconnected from Tesla Fleet API');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const teslaIntegration = new TeslaIntegration();

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function initTeslaConnection(): Promise<boolean> {
  return teslaIntegration.connect({
    accessToken: process.env.TESLA_ACCESS_TOKEN || 'demo-token',
    refreshToken: process.env.TESLA_REFRESH_TOKEN || 'demo-refresh',
    clientId: process.env.TESLA_CLIENT_ID || 'demo-client',
    clientSecret: process.env.TESLA_CLIENT_SECRET || 'demo-secret',
  });
}

export function getTeslaFleetStats(): TeslaFleetStats {
  return teslaIntegration.getFleetStats();
}

export function getTeslaVehicles(): TeslaVehicle[] {
  return teslaIntegration.getVehicles();
}

export function getPowerwalls(): Powerwall[] {
  return teslaIntegration.getPowerwalls();
}

export async function startV2GSession(
  vehicleId: string,
  targetKwh: number
): Promise<V2GSession> {
  return teslaIntegration.startV2GDischarge(vehicleId, targetKwh);
}

export function getOptimizationPlan(vehicleId: string): EnergyOptimizationPlan {
  return teslaIntegration.generateOptimizationPlan(vehicleId);
}
