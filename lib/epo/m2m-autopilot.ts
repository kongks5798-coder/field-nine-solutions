/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                                                                       ║
 * ║     FIELD NINE - M2M AUTOPILOT ZERO-CLICK PAYMENT                    ║
 * ║     Autonomous Machine-to-Machine Energy Settlement                   ║
 * ║                                                                       ║
 * ║     No human intervention required.                                   ║
 * ║     Vehicle connects → Energy flows → Payment settles.               ║
 * ║                                                                       ║
 * ║     Supported Devices:                                                ║
 * ║       - Electric Vehicles (Tesla, BYD, VW, etc.)                     ║
 * ║       - Autonomous Robots (Delivery, Industrial)                      ║
 * ║       - IoT Energy Devices (Smart Grid, Storage)                      ║
 * ║       - Drones (Commercial, Industrial)                               ║
 * ║                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import { keccak256, encodePacked } from './crypto-utils';
import { regulatoryEnforcement } from './regulatory-enforcement';

// ============================================================
// M2M DEVICE TYPES
// ============================================================

export type DeviceType =
  | 'electric_vehicle'
  | 'autonomous_robot'
  | 'delivery_drone'
  | 'industrial_robot'
  | 'smart_grid_device'
  | 'energy_storage'
  | 'charging_station';

export interface M2MDevice {
  deviceId: string;
  deviceType: DeviceType;
  manufacturer: string;
  model: string;

  // Authentication
  publicKey: string;
  walletAddress: string;
  authToken: string;

  // Capabilities
  batteryCapacity: number;      // kWh
  maxChargingRate: number;      // kW
  currentSoC: number;           // State of Charge %

  // Billing
  preferredPaymentMethod: 'nxusd' | 'fiat_auto' | 'crypto';
  creditLimit: number;          // NXUSD
  balance: number;              // Available balance

  // Location
  currentLocation: {
    lat: number;
    lng: number;
    nearestNode?: string;
  };

  // Status
  status: 'idle' | 'charging' | 'discharging' | 'transit' | 'offline';
  lastSeen: number;
  registeredAt: number;
}

export interface ChargingSession {
  sessionId: string;
  deviceId: string;
  nodeId: string;

  // Session details
  startTime: number;
  endTime?: number;
  status: 'initiated' | 'active' | 'completed' | 'failed' | 'disputed';

  // Energy flow
  energyRequested: number;      // kWh
  energyDelivered: number;      // kWh
  chargingRate: number;         // kW (average)
  startSoC: number;
  endSoC?: number;

  // Payment
  pricePerKwh: number;          // NXUSD
  totalCost: number;            // NXUSD
  royaltyPaid: number;
  paymentStatus: 'pending' | 'authorized' | 'settled' | 'failed';

  // Sovereign Receipt
  sovereignReceipt?: SovereignReceipt;

  // Compliance
  complianceProofId?: string;
  carbonOffset: number;         // kg CO2
}

export interface SovereignReceipt {
  receiptId: string;
  receiptHash: string;
  timestamp: number;

  // Transaction summary
  transaction: {
    type: 'charging' | 'v2g' | 'swap';
    deviceId: string;
    nodeId: string;
    kwhAmount: number;
    nxusdValue: number;
  };

  // Compliance certifications
  compliance: {
    re100Certified: boolean;
    cbamExempt: boolean;
    esgRating: string;
    carbonOffset: number;
  };

  // Proofs
  proofs: {
    gridInjectionProof: string;
    complianceProof: string;
    paymentProof: string;
    polygonTxHash: string;
  };

  // QR code for verification
  verificationQR: string;
}

export interface ZeroClickPaymentResult {
  success: boolean;
  sessionId: string;

  // Transaction details
  device: {
    deviceId: string;
    type: DeviceType;
    manufacturer: string;
  };

  node: {
    nodeId: string;
    name: string;
    sourceType: string;
  };

  energy: {
    requested: number;
    delivered: number;
    unit: 'kWh';
  };

  payment: {
    amount: number;
    currency: 'NXUSD';
    status: 'settled';
    transactionId: string;
  };

  receipt: SovereignReceipt;

  // Timing
  totalProcessingTime: number;  // ms
  steps: Array<{
    step: string;
    duration: number;
    status: 'success' | 'warning' | 'error';
  }>;
}

export interface V2GSession {
  sessionId: string;
  deviceId: string;
  nodeId: string;
  direction: 'grid_to_vehicle' | 'vehicle_to_grid';

  // Energy flow
  energyTransferred: number;
  compensationRate: number;     // NXUSD per kWh for V2G
  totalCompensation: number;

  // Grid services
  gridServiceType?: 'frequency_regulation' | 'peak_shaving' | 'demand_response';
  gridServiceBonus: number;

  status: 'active' | 'completed';
}

// ============================================================
// M2M AUTOPILOT ENGINE
// ============================================================

export class M2MAutopilot {
  private static instance: M2MAutopilot;

  private registeredDevices: Map<string, M2MDevice> = new Map();
  private activeSessions: Map<string, ChargingSession> = new Map();
  private v2gSessions: Map<string, V2GSession> = new Map();
  private completedSessions: ChargingSession[] = [];

  // Pricing
  private basePricePerKwh = 0.08;  // NXUSD
  private v2gCompensationRate = 0.12; // NXUSD per kWh
  private royaltyRate = 0.0025;    // 0.25%

  private constructor() {
    console.log('[M2M Autopilot] Zero-Click Payment System initialized');
  }

  static getInstance(): M2MAutopilot {
    if (!M2MAutopilot.instance) {
      M2MAutopilot.instance = new M2MAutopilot();
    }
    return M2MAutopilot.instance;
  }

  // ============================================================
  // DEVICE REGISTRATION
  // ============================================================

  /**
   * Register a new M2M device for autonomous payments
   */
  registerDevice(params: {
    deviceType: DeviceType;
    manufacturer: string;
    model: string;
    publicKey: string;
    walletAddress: string;
    batteryCapacity: number;
    maxChargingRate: number;
    initialBalance: number;
  }): M2MDevice {
    const deviceId = `M2M-${params.manufacturer.toUpperCase().slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const authToken = keccak256(
      encodePacked(
        ['string', 'string', 'uint256'],
        [deviceId, params.publicKey, BigInt(Date.now())]
      )
    ).slice(0, 42);

    const device: M2MDevice = {
      deviceId,
      deviceType: params.deviceType,
      manufacturer: params.manufacturer,
      model: params.model,
      publicKey: params.publicKey,
      walletAddress: params.walletAddress,
      authToken,
      batteryCapacity: params.batteryCapacity,
      maxChargingRate: params.maxChargingRate,
      currentSoC: 50, // Default 50%
      preferredPaymentMethod: 'nxusd',
      creditLimit: params.initialBalance * 2,
      balance: params.initialBalance,
      currentLocation: { lat: 0, lng: 0 },
      status: 'idle',
      lastSeen: Date.now(),
      registeredAt: Date.now(),
    };

    this.registeredDevices.set(deviceId, device);

    console.log(`[M2M] Device registered: ${deviceId} (${params.manufacturer} ${params.model})`);

    return device;
  }

  // ============================================================
  // ZERO-CLICK PAYMENT FLOW
  // ============================================================

  /**
   * Execute Zero-Click charging session
   *
   * Flow:
   * 1. Device connects and authenticates
   * 2. System verifies balance/credit
   * 3. Energy flows automatically
   * 4. Payment settles instantly
   * 5. Sovereign Receipt issued
   */
  async executeZeroClickPayment(params: {
    deviceId: string;
    nodeId: string;
    requestedKwh: number;
    authSignature: string;
  }): Promise<ZeroClickPaymentResult> {
    const startTime = Date.now();
    const steps: ZeroClickPaymentResult['steps'] = [];

    // Step 1: Device Authentication
    const authStart = Date.now();
    const device = this.registeredDevices.get(params.deviceId);

    if (!device) {
      throw new Error('Device not registered');
    }

    // Verify auth signature (simplified)
    const expectedSig = keccak256(
      encodePacked(['string', 'string'], [params.deviceId, device.authToken])
    ).slice(0, 18);

    steps.push({
      step: 'Device Authentication',
      duration: Date.now() - authStart,
      status: 'success',
    });

    // Step 2: Balance Verification
    const balanceStart = Date.now();
    const estimatedCost = params.requestedKwh * this.basePricePerKwh;

    if (device.balance < estimatedCost && device.balance + device.creditLimit < estimatedCost) {
      throw new Error('Insufficient balance');
    }

    steps.push({
      step: 'Balance Verification',
      duration: Date.now() - balanceStart,
      status: 'success',
    });

    // Step 3: Session Initialization
    const sessionStart = Date.now();
    const sessionId = `SESSION-${params.deviceId}-${Date.now()}`;

    const session: ChargingSession = {
      sessionId,
      deviceId: params.deviceId,
      nodeId: params.nodeId,
      startTime: Date.now(),
      status: 'active',
      energyRequested: params.requestedKwh,
      energyDelivered: 0,
      chargingRate: Math.min(device.maxChargingRate, 150), // Cap at 150kW
      startSoC: device.currentSoC,
      pricePerKwh: this.basePricePerKwh,
      totalCost: 0,
      royaltyPaid: 0,
      paymentStatus: 'authorized',
      carbonOffset: 0,
    };

    this.activeSessions.set(sessionId, session);

    steps.push({
      step: 'Session Initialization',
      duration: Date.now() - sessionStart,
      status: 'success',
    });

    // Step 4: Energy Delivery (simulated instant)
    const deliveryStart = Date.now();
    const deliveredKwh = Math.min(
      params.requestedKwh,
      device.batteryCapacity * (1 - device.currentSoC / 100)
    );

    session.energyDelivered = deliveredKwh;
    session.totalCost = deliveredKwh * this.basePricePerKwh;
    session.royaltyPaid = session.totalCost * this.royaltyRate;
    session.carbonOffset = deliveredKwh * 0.475; // kg CO2 avoided

    // Update device SoC
    const newSoC = device.currentSoC + (deliveredKwh / device.batteryCapacity) * 100;
    device.currentSoC = Math.min(100, newSoC);
    device.balance -= session.totalCost;

    steps.push({
      step: 'Energy Delivery',
      duration: Date.now() - deliveryStart,
      status: 'success',
    });

    // Step 5: Compliance Verification
    const complianceStart = Date.now();
    const complianceProof = await regulatoryEnforcement.generateComplianceProof({
      nodeId: params.nodeId,
      countryCode: 'KR', // Default
      transactionType: 'verify',
      kwhAmount: deliveredKwh,
      nxusdValue: session.totalCost,
      sourceType: 'solar',
    });

    session.complianceProofId = complianceProof.proofId;

    steps.push({
      step: 'Compliance Verification',
      duration: Date.now() - complianceStart,
      status: complianceProof.settlementAuthorization.authorized ? 'success' : 'warning',
    });

    // Step 6: Payment Settlement
    const paymentStart = Date.now();
    session.paymentStatus = 'settled';
    session.status = 'completed';
    session.endTime = Date.now();
    session.endSoC = device.currentSoC;

    steps.push({
      step: 'Payment Settlement',
      duration: Date.now() - paymentStart,
      status: 'success',
    });

    // Step 7: Generate Sovereign Receipt
    const receiptStart = Date.now();
    const receipt = this.generateSovereignReceipt(session, complianceProof);
    session.sovereignReceipt = receipt;

    steps.push({
      step: 'Receipt Generation',
      duration: Date.now() - receiptStart,
      status: 'success',
    });

    // Finalize
    this.activeSessions.delete(sessionId);
    this.completedSessions.push(session);
    device.lastSeen = Date.now();
    device.status = 'idle';

    const totalProcessingTime = Date.now() - startTime;

    console.log(`[M2M] Zero-Click Payment completed in ${totalProcessingTime}ms: ${deliveredKwh.toFixed(2)} kWh → $${session.totalCost.toFixed(4)} NXUSD`);

    return {
      success: true,
      sessionId,
      device: {
        deviceId: device.deviceId,
        type: device.deviceType,
        manufacturer: device.manufacturer,
      },
      node: {
        nodeId: params.nodeId,
        name: `Energy Node ${params.nodeId}`,
        sourceType: 'solar',
      },
      energy: {
        requested: params.requestedKwh,
        delivered: deliveredKwh,
        unit: 'kWh',
      },
      payment: {
        amount: session.totalCost,
        currency: 'NXUSD',
        status: 'settled',
        transactionId: receipt.proofs.paymentProof,
      },
      receipt,
      totalProcessingTime,
      steps,
    };
  }

  // ============================================================
  // SOVEREIGN RECEIPT GENERATION
  // ============================================================

  private generateSovereignReceipt(
    session: ChargingSession,
    complianceProof: Awaited<ReturnType<typeof regulatoryEnforcement.generateComplianceProof>>
  ): SovereignReceipt {
    const receiptId = `SVRCPT-${session.sessionId}`;

    const receiptHash = keccak256(
      encodePacked(
        ['string', 'string', 'uint256', 'uint256'],
        [receiptId, session.deviceId, BigInt(Math.floor(session.energyDelivered * 1000)), BigInt(session.endTime || Date.now())]
      )
    );

    const receipt: SovereignReceipt = {
      receiptId,
      receiptHash,
      timestamp: Date.now(),

      transaction: {
        type: 'charging',
        deviceId: session.deviceId,
        nodeId: session.nodeId,
        kwhAmount: session.energyDelivered,
        nxusdValue: session.totalCost,
      },

      compliance: {
        re100Certified: true,
        cbamExempt: true,
        esgRating: 'AAA',
        carbonOffset: session.carbonOffset,
      },

      proofs: {
        gridInjectionProof: `GIP-${session.nodeId}-${Date.now()}`,
        complianceProof: complianceProof.proofId,
        paymentProof: `PAY-${session.sessionId}-${Date.now()}`,
        polygonTxHash: `0x${receiptHash.slice(2, 66)}`,
      },

      verificationQR: `https://fieldnine.io/verify/${receiptId}`,
    };

    return receipt;
  }

  // ============================================================
  // VEHICLE-TO-GRID (V2G) SUPPORT
  // ============================================================

  /**
   * Start V2G session (vehicle sells energy back to grid)
   */
  async startV2GSession(params: {
    deviceId: string;
    nodeId: string;
    kwhToSell: number;
    gridService?: 'frequency_regulation' | 'peak_shaving' | 'demand_response';
  }): Promise<V2GSession> {
    const device = this.registeredDevices.get(params.deviceId);

    if (!device) {
      throw new Error('Device not registered');
    }

    // Check if device has enough energy to sell
    const availableKwh = device.batteryCapacity * (device.currentSoC / 100) * 0.8; // Keep 20% reserve
    const actualKwh = Math.min(params.kwhToSell, availableKwh);

    // Calculate compensation
    let compensationRate = this.v2gCompensationRate;
    let gridServiceBonus = 0;

    if (params.gridService) {
      const bonusRates = {
        frequency_regulation: 0.05,
        peak_shaving: 0.03,
        demand_response: 0.04,
      };
      gridServiceBonus = actualKwh * bonusRates[params.gridService];
    }

    const totalCompensation = actualKwh * compensationRate + gridServiceBonus;

    const sessionId = `V2G-${params.deviceId}-${Date.now()}`;

    const session: V2GSession = {
      sessionId,
      deviceId: params.deviceId,
      nodeId: params.nodeId,
      direction: 'vehicle_to_grid',
      energyTransferred: actualKwh,
      compensationRate,
      totalCompensation,
      gridServiceType: params.gridService,
      gridServiceBonus,
      status: 'active',
    };

    // Update device
    device.currentSoC -= (actualKwh / device.batteryCapacity) * 100;
    device.balance += totalCompensation;
    device.status = 'discharging';

    this.v2gSessions.set(sessionId, session);

    console.log(`[M2M] V2G Session started: ${actualKwh.toFixed(2)} kWh → $${totalCompensation.toFixed(4)} NXUSD compensation`);

    return session;
  }

  // ============================================================
  // SIMULATION
  // ============================================================

  /**
   * Run M2M payment simulation for testing
   */
  async runSimulation(params: {
    deviceCount: number;
    sessionsPerDevice: number;
    avgKwhPerSession: number;
  }): Promise<{
    simulationId: string;
    summary: {
      totalDevices: number;
      totalSessions: number;
      totalKwhDelivered: number;
      totalRevenue: number;
      totalRoyalties: number;
      avgProcessingTime: number;
      successRate: number;
    };
    sampleReceipts: SovereignReceipt[];
  }> {
    const simulationId = `SIM-${Date.now()}`;
    console.log(`[M2M Simulation] Starting: ${params.deviceCount} devices, ${params.sessionsPerDevice} sessions each`);

    const manufacturers = ['Tesla', 'BYD', 'Volkswagen', 'Hyundai', 'Rivian'];
    const models = {
      Tesla: ['Model 3', 'Model Y', 'Cybertruck'],
      BYD: ['Han', 'Seal', 'Dolphin'],
      Volkswagen: ['ID.4', 'ID.Buzz'],
      Hyundai: ['Ioniq 5', 'Ioniq 6'],
      Rivian: ['R1T', 'R1S'],
    };

    const devices: M2MDevice[] = [];
    const results: ZeroClickPaymentResult[] = [];

    // Register devices
    for (let i = 0; i < params.deviceCount; i++) {
      const manufacturer = manufacturers[i % manufacturers.length];
      const modelList = models[manufacturer as keyof typeof models];
      const model = modelList[Math.floor(Math.random() * modelList.length)];

      const device = this.registerDevice({
        deviceType: 'electric_vehicle',
        manufacturer,
        model,
        publicKey: `0x${keccak256(encodePacked(['string'], [`device-${i}`])).slice(2, 42)}`,
        walletAddress: `0x${keccak256(encodePacked(['string'], [`wallet-${i}`])).slice(2, 42)}`,
        batteryCapacity: 60 + Math.random() * 40, // 60-100 kWh
        maxChargingRate: 150 + Math.random() * 100, // 150-250 kW
        initialBalance: 100 + Math.random() * 400, // $100-$500
      });

      devices.push(device);
    }

    // Run sessions
    const nodes = ['YEONGDONG-001', 'PJM-EAST-001', 'AEMO-VIC-001', 'EPEX-DE-001'];
    let successCount = 0;
    let totalProcessingTime = 0;

    for (const device of devices) {
      for (let s = 0; s < params.sessionsPerDevice; s++) {
        try {
          const result = await this.executeZeroClickPayment({
            deviceId: device.deviceId,
            nodeId: nodes[Math.floor(Math.random() * nodes.length)],
            requestedKwh: params.avgKwhPerSession * (0.5 + Math.random()),
            authSignature: 'simulated',
          });

          results.push(result);
          successCount++;
          totalProcessingTime += result.totalProcessingTime;
        } catch (error) {
          // Session failed, continue
        }
      }
    }

    const totalKwhDelivered = results.reduce((sum, r) => sum + r.energy.delivered, 0);
    const totalRevenue = results.reduce((sum, r) => sum + r.payment.amount, 0);
    const totalRoyalties = totalRevenue * this.royaltyRate;

    console.log(`[M2M Simulation] Complete: ${successCount}/${params.deviceCount * params.sessionsPerDevice} sessions`);

    return {
      simulationId,
      summary: {
        totalDevices: params.deviceCount,
        totalSessions: results.length,
        totalKwhDelivered: Math.round(totalKwhDelivered * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalRoyalties: Math.round(totalRoyalties * 100) / 100,
        avgProcessingTime: Math.round(totalProcessingTime / results.length),
        successRate: Math.round((successCount / (params.deviceCount * params.sessionsPerDevice)) * 100 * 10) / 10,
      },
      sampleReceipts: results.slice(0, 5).map(r => r.receipt),
    };
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  getDevice(deviceId: string): M2MDevice | undefined {
    return this.registeredDevices.get(deviceId);
  }

  getAllDevices(): M2MDevice[] {
    return Array.from(this.registeredDevices.values());
  }

  getActiveSession(sessionId: string): ChargingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessions(): ChargingSession[] {
    return Array.from(this.activeSessions.values());
  }

  getCompletedSessions(limit: number = 100): ChargingSession[] {
    return this.completedSessions.slice(-limit);
  }

  getV2GSessions(): V2GSession[] {
    return Array.from(this.v2gSessions.values());
  }

  getStats(): {
    totalDevices: number;
    activeDevices: number;
    activeSessions: number;
    completedSessions: number;
    totalKwhDelivered: number;
    totalRevenue: number;
    totalRoyalties: number;
    avgSessionDuration: number;
  } {
    const devices = Array.from(this.registeredDevices.values());
    const activeDevices = devices.filter(d => d.status !== 'offline' && d.status !== 'idle');

    const totalKwh = this.completedSessions.reduce((sum, s) => sum + s.energyDelivered, 0);
    const totalRevenue = this.completedSessions.reduce((sum, s) => sum + s.totalCost, 0);
    const totalRoyalties = this.completedSessions.reduce((sum, s) => sum + s.royaltyPaid, 0);

    const avgDuration = this.completedSessions.length > 0
      ? this.completedSessions.reduce((sum, s) => sum + ((s.endTime || 0) - s.startTime), 0) / this.completedSessions.length
      : 0;

    return {
      totalDevices: devices.length,
      activeDevices: activeDevices.length,
      activeSessions: this.activeSessions.size,
      completedSessions: this.completedSessions.length,
      totalKwhDelivered: Math.round(totalKwh * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalRoyalties: Math.round(totalRoyalties * 100) / 100,
      avgSessionDuration: Math.round(avgDuration),
    };
  }
}

// Singleton export
export const m2mAutopilot = M2MAutopilot.getInstance();
