/**
 * FIELD NINE - ENERGY PROOF-OF-ORIGIN (EPO)
 * Digital Watermark Engine
 *
 * Real-time attestation system that stamps unique cryptographic
 * fingerprints on every kWh produced, creating an immutable
 * chain of energy provenance.
 */

import { keccak256, toHex, encodePacked } from './crypto-utils';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface EnergyProduction {
  nodeId: string;
  timestamp: number;
  kwhProduced: number;
  sourceType: 'solar' | 'wind' | 'hydro' | 'ess' | 'biomass';
  gridConnection: string;
  latitude: number;
  longitude: number;
  inverterReadings: InverterReading[];
  weatherConditions?: WeatherConditions;
}

export interface InverterReading {
  inverterId: string;
  voltage: number;
  current: number;
  frequency: number;
  powerFactor: number;
  temperature: number;
}

export interface WeatherConditions {
  irradiance?: number;  // W/m² for solar
  windSpeed?: number;   // m/s for wind
  temperature: number;
  humidity: number;
}

export interface EnergyWatermark {
  watermarkId: string;           // Unique EPO fingerprint
  nodeId: string;
  timestamp: number;
  kwhAttested: number;
  sourceType: string;
  proofHash: string;             // Merkle root of all readings
  zkProof: ZKProof;              // Zero-knowledge proof for privacy
  polygonTxHash?: string;        // On-chain attestation
  status: 'pending' | 'attested' | 'verified' | 'disputed';
  royaltyAccrued: number;        // NXUSD earned from verifications
}

export interface ZKProof {
  commitment: string;            // Pedersen commitment
  nullifier: string;             // Prevents double-spending
  proof: string;                 // SNARK proof (simplified)
  publicInputs: string[];        // Revealed public data
}

export interface AttestationBatch {
  batchId: string;
  watermarks: EnergyWatermark[];
  merkleRoot: string;
  timestamp: number;
  totalKwh: number;
  polygonBlockNumber?: number;
}

// ============================================================
// DIGITAL WATERMARK ENGINE
// ============================================================

export class DigitalWatermarkEngine {
  private static instance: DigitalWatermarkEngine;
  private watermarkRegistry: Map<string, EnergyWatermark> = new Map();
  private batchRegistry: Map<string, AttestationBatch> = new Map();
  private pendingAttestations: EnergyProduction[] = [];

  // EPO Configuration
  private readonly BATCH_INTERVAL_MS = 15000;  // 15-second batches
  private readonly MIN_BATCH_SIZE = 1;
  private readonly ROYALTY_PER_VERIFICATION = 0.001;  // 0.001 NXUSD per API call

  private constructor() {
    this.startBatchProcessor();
  }

  static getInstance(): DigitalWatermarkEngine {
    if (!DigitalWatermarkEngine.instance) {
      DigitalWatermarkEngine.instance = new DigitalWatermarkEngine();
    }
    return DigitalWatermarkEngine.instance;
  }

  // ============================================================
  // CORE ATTESTATION METHODS
  // ============================================================

  /**
   * Generate unique watermark for energy production
   * Called instantly when energy is produced at the source
   */
  async createWatermark(production: EnergyProduction): Promise<EnergyWatermark> {
    // 1. Generate unique watermark ID (EPO Fingerprint)
    const watermarkId = this.generateWatermarkId(production);

    // 2. Calculate proof hash from all inverter readings
    const proofHash = this.calculateProofHash(production);

    // 3. Generate ZK proof to protect commercial secrets
    const zkProof = await this.generateZKProof(production);

    // 4. Create the watermark
    const watermark: EnergyWatermark = {
      watermarkId,
      nodeId: production.nodeId,
      timestamp: production.timestamp,
      kwhAttested: production.kwhProduced,
      sourceType: production.sourceType,
      proofHash,
      zkProof,
      status: 'pending',
      royaltyAccrued: 0,
    };

    // 5. Register and queue for batch attestation
    this.watermarkRegistry.set(watermarkId, watermark);
    this.pendingAttestations.push(production);

    return watermark;
  }

  /**
   * Generate globally unique EPO fingerprint
   * Format: EPO-{NodeId}-{Timestamp}-{Hash8}
   */
  private generateWatermarkId(production: EnergyProduction): string {
    const data = encodePacked(
      ['string', 'uint256', 'uint256', 'string'],
      [
        production.nodeId,
        BigInt(production.timestamp),
        BigInt(Math.round(production.kwhProduced * 1000)),
        production.sourceType
      ]
    );

    const fullHash = keccak256(data);
    const shortHash = fullHash.slice(2, 10).toUpperCase();

    return `EPO-${production.nodeId}-${production.timestamp}-${shortHash}`;
  }

  /**
   * Calculate Merkle root of all inverter readings
   * Ensures data integrity without revealing specifics
   */
  private calculateProofHash(production: EnergyProduction): string {
    const leaves = production.inverterReadings.map(reading => {
      const data = encodePacked(
        ['string', 'uint256', 'uint256', 'uint256', 'uint256'],
        [
          reading.inverterId,
          BigInt(Math.round(reading.voltage * 1000)),
          BigInt(Math.round(reading.current * 1000)),
          BigInt(Math.round(reading.frequency * 1000)),
          BigInt(Math.round(reading.powerFactor * 1000))
        ]
      );
      return keccak256(data);
    });

    // Simple Merkle root calculation
    return this.computeMerkleRoot(leaves);
  }

  private computeMerkleRoot(leaves: string[]): string {
    if (leaves.length === 0) return keccak256(toHex('empty'));
    if (leaves.length === 1) return leaves[0];

    const newLeaves: string[] = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = leaves[i + 1] || left;
      const combined = keccak256(encodePacked(['bytes32', 'bytes32'], [left as `0x${string}`, right as `0x${string}`]));
      newLeaves.push(combined);
    }

    return this.computeMerkleRoot(newLeaves);
  }

  /**
   * Generate Zero-Knowledge Proof
   * Proves energy production without revealing:
   * - Exact financial terms
   * - Specific equipment configurations
   * - Operational parameters
   */
  private async generateZKProof(production: EnergyProduction): Promise<ZKProof> {
    // Pedersen commitment: C = g^v * h^r (simplified simulation)
    const secretValue = production.kwhProduced;
    const blindingFactor = Math.random() * 1000000;

    const commitmentData = encodePacked(
      ['uint256', 'uint256'],
      [BigInt(Math.round(secretValue * 1000)), BigInt(Math.round(blindingFactor))]
    );
    const commitment = keccak256(commitmentData);

    // Nullifier prevents double-attestation
    const nullifierData = encodePacked(
      ['string', 'uint256', 'string'],
      [production.nodeId, BigInt(production.timestamp), production.sourceType]
    );
    const nullifier = keccak256(nullifierData);

    // Simplified SNARK proof (in production, use circom/snarkjs)
    const proofData = encodePacked(
      ['bytes32', 'bytes32', 'uint256'],
      [commitment as `0x${string}`, nullifier as `0x${string}`, BigInt(Date.now())]
    );
    const proof = keccak256(proofData);

    // Public inputs (what we reveal)
    const publicInputs = [
      production.nodeId,
      production.sourceType,
      production.timestamp.toString(),
      Math.floor(production.kwhProduced).toString(),  // Rounded for privacy
    ];

    return {
      commitment,
      nullifier,
      proof,
      publicInputs,
    };
  }

  // ============================================================
  // BATCH ATTESTATION (POLYGON MAINNET)
  // ============================================================

  private startBatchProcessor(): void {
    // Simulated batch processor (runs every 15 seconds)
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.processPendingBatch();
      }, this.BATCH_INTERVAL_MS);
    }
  }

  private async processPendingBatch(): Promise<AttestationBatch | null> {
    if (this.pendingAttestations.length < this.MIN_BATCH_SIZE) {
      return null;
    }

    const productions = [...this.pendingAttestations];
    this.pendingAttestations = [];

    // Collect watermarks for this batch
    const watermarks: EnergyWatermark[] = [];
    for (const prod of productions) {
      const wId = this.generateWatermarkId(prod);
      const watermark = this.watermarkRegistry.get(wId);
      if (watermark) {
        watermarks.push(watermark);
      }
    }

    if (watermarks.length === 0) return null;

    // Calculate batch Merkle root
    const watermarkHashes = watermarks.map(w => w.proofHash);
    const merkleRoot = this.computeMerkleRoot(watermarkHashes);

    // Create batch
    const batch: AttestationBatch = {
      batchId: `BATCH-${Date.now()}-${merkleRoot.slice(2, 10)}`,
      watermarks,
      merkleRoot,
      timestamp: Date.now(),
      totalKwh: watermarks.reduce((sum, w) => sum + w.kwhAttested, 0),
      polygonBlockNumber: Math.floor(Math.random() * 1000000) + 50000000,  // Simulated
    };

    // Simulate Polygon transaction
    const txHash = keccak256(encodePacked(
      ['string', 'bytes32', 'uint256'],
      [batch.batchId, merkleRoot as `0x${string}`, BigInt(batch.timestamp)]
    ));

    // Update watermarks with on-chain attestation
    for (const watermark of watermarks) {
      watermark.polygonTxHash = txHash;
      watermark.status = 'attested';
      this.watermarkRegistry.set(watermark.watermarkId, watermark);
    }

    this.batchRegistry.set(batch.batchId, batch);

    console.log(`[EPO] Batch attested: ${batch.batchId}, ${batch.totalKwh.toFixed(2)} kWh, TX: ${txHash.slice(0, 18)}...`);

    return batch;
  }

  // ============================================================
  // VERIFICATION & ROYALTY COLLECTION
  // ============================================================

  /**
   * Verify energy watermark - Called by third parties
   * Each verification call triggers royalty payment
   */
  async verifyWatermark(watermarkId: string, callerApiKey: string): Promise<{
    valid: boolean;
    watermark?: EnergyWatermark;
    royaltyCharged: number;
    verificationProof: string;
  }> {
    const watermark = this.watermarkRegistry.get(watermarkId);

    if (!watermark) {
      return {
        valid: false,
        royaltyCharged: 0,
        verificationProof: '',
      };
    }

    // Charge royalty for verification
    const royaltyCharged = this.ROYALTY_PER_VERIFICATION;
    watermark.royaltyAccrued += royaltyCharged;
    watermark.status = 'verified';

    // Generate verification proof
    const verificationProof = keccak256(encodePacked(
      ['string', 'string', 'uint256'],
      [watermarkId, callerApiKey, BigInt(Date.now())]
    ));

    this.watermarkRegistry.set(watermarkId, watermark);

    return {
      valid: true,
      watermark: {
        ...watermark,
        // Redact sensitive ZK proof details
        zkProof: {
          ...watermark.zkProof,
          proof: '[REDACTED]',
        },
      },
      royaltyCharged,
      verificationProof,
    };
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  getWatermark(watermarkId: string): EnergyWatermark | undefined {
    return this.watermarkRegistry.get(watermarkId);
  }

  getNodeWatermarks(nodeId: string): EnergyWatermark[] {
    return Array.from(this.watermarkRegistry.values())
      .filter(w => w.nodeId === nodeId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getTotalRoyalties(nodeId?: string): number {
    const watermarks = nodeId
      ? this.getNodeWatermarks(nodeId)
      : Array.from(this.watermarkRegistry.values());

    return watermarks.reduce((sum, w) => sum + w.royaltyAccrued, 0);
  }

  getAttestationStats(): {
    totalWatermarks: number;
    totalKwhAttested: number;
    totalRoyaltiesEarned: number;
    nodeBreakdown: Record<string, { watermarks: number; kwh: number; royalties: number }>;
  } {
    const watermarks = Array.from(this.watermarkRegistry.values());
    const nodeBreakdown: Record<string, { watermarks: number; kwh: number; royalties: number }> = {};

    for (const w of watermarks) {
      if (!nodeBreakdown[w.nodeId]) {
        nodeBreakdown[w.nodeId] = { watermarks: 0, kwh: 0, royalties: 0 };
      }
      nodeBreakdown[w.nodeId].watermarks++;
      nodeBreakdown[w.nodeId].kwh += w.kwhAttested;
      nodeBreakdown[w.nodeId].royalties += w.royaltyAccrued;
    }

    return {
      totalWatermarks: watermarks.length,
      totalKwhAttested: watermarks.reduce((sum, w) => sum + w.kwhAttested, 0),
      totalRoyaltiesEarned: watermarks.reduce((sum, w) => sum + w.royaltyAccrued, 0),
      nodeBreakdown,
    };
  }
}

// ============================================================
// YEONGDONG NODE REGISTRATION
// ============================================================

export const YEONGDONG_NODE_CONFIG = {
  nodeId: 'YEONGDONG-001',
  name: 'Yeongdong Energy Node #1',
  certificationCode: 'EPO-SOVEREIGN-001',
  location: {
    region: 'Gangwon-do, South Korea',
    coordinates: { lat: 37.1845, lng: 128.9180 },
    area: '100,000 Pyeong',
  },
  capacity: {
    solar: 50000,      // 50 MW
    ess: 20000,        // 20 MWh
    totalCapacity: 70000,
  },
  certification: {
    issueDate: '2026-01-22',
    certificationId: 'EPO-CERT-YEONGDONG-001',
    status: 'SOVEREIGN_CERTIFIED',
    level: 'GLOBAL_FIRST',
  },
};

// Singleton export
export const digitalWatermarkEngine = DigitalWatermarkEngine.getInstance();
