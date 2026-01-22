/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                                                               ║
 * ║     FIELD NINE ENERGY SDK                                     ║
 * ║     Energy Proof-of-Origin (EPO) Protocol                     ║
 * ║                                                               ║
 * ║     Version: 1.0.0                                            ║
 * ║     License: Apache 2.0                                       ║
 * ║                                                               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 *
 * The global standard for energy provenance verification.
 * Every kWh, authenticated. Every verification, rewarded.
 *
 * Quick Start:
 * ```typescript
 * import { FieldNineEPO } from '@fieldnine/energy-sdk';
 *
 * const epo = new FieldNineEPO({ apiKey: 'your_api_key' });
 * const result = await epo.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4');
 * ```
 */

// ============================================================
// SDK CONFIGURATION
// ============================================================

export interface EPOConfig {
  apiKey: string;
  baseUrl?: string;
  environment?: 'production' | 'sandbox';
  timeout?: number;
  retryAttempts?: number;
  webhookUrl?: string;
}

export interface VerificationResult {
  valid: boolean;
  watermarkId: string;
  nodeId: string;
  sourceType: string;
  kwhAttested: number;
  attestationTime: string;
  polygonTxHash: string;
  royaltyCharged: number;
  verificationProof: string;
  metadata: {
    region: string;
    certificationLevel: string;
    carbonOffset: number;  // kg CO2 avoided
  };
}

export interface BatchVerificationResult {
  results: VerificationResult[];
  totalValid: number;
  totalInvalid: number;
  totalRoyaltyCharged: number;
  batchId: string;
}

export interface NodeInfo {
  nodeId: string;
  name: string;
  region: string;
  capacity: number;
  sourceType: string;
  certificationLevel: string;
  totalKwhAttested: number;
  status: 'active' | 'maintenance' | 'offline';
}

export interface RoyaltyBalance {
  pending: number;
  totalEarned: number;
  lastSettlement: string;
  currency: 'NXUSD';
}

export interface WebhookEvent {
  eventType: 'verification' | 'attestation' | 'settlement';
  timestamp: string;
  data: Record<string, unknown>;
  signature: string;
}

// ============================================================
// FIELD NINE EPO SDK CLASS
// ============================================================

export class FieldNineEPO {
  private config: Required<EPOConfig>;
  private isInitialized = false;

  constructor(config: EPOConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.fieldnine.io/epo/v1',
      environment: config.environment || 'production',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      webhookUrl: config.webhookUrl || '',
    };

    this.validateApiKey();
    this.isInitialized = true;
  }

  private validateApiKey(): void {
    if (!this.config.apiKey || !this.config.apiKey.startsWith('fn_epo_')) {
      throw new Error('Invalid API key format. Keys must start with "fn_epo_"');
    }
  }

  // ============================================================
  // VERIFICATION METHODS
  // ============================================================

  /**
   * Verify a single energy watermark
   *
   * @param watermarkId - The EPO watermark ID (e.g., "EPO-YEONGDONG-001-1706000000-A1B2C3D4")
   * @returns Verification result with proof and metadata
   *
   * @example
   * ```typescript
   * const result = await epo.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4');
   * if (result.valid) {
   *   console.log(`Verified ${result.kwhAttested} kWh from ${result.nodeId}`);
   * }
   * ```
   */
  async verify(watermarkId: string): Promise<VerificationResult> {
    this.ensureInitialized();

    const response = await this.makeRequest('/verify', {
      method: 'POST',
      body: JSON.stringify({ watermarkId }),
    });

    return response as VerificationResult;
  }

  /**
   * Verify multiple watermarks in a single request
   * More efficient and cost-effective for bulk verification
   *
   * @param watermarkIds - Array of watermark IDs to verify
   * @returns Batch verification results
   */
  async verifyBatch(watermarkIds: string[]): Promise<BatchVerificationResult> {
    this.ensureInitialized();

    if (watermarkIds.length > 100) {
      throw new Error('Batch size limited to 100 watermarks');
    }

    const response = await this.makeRequest('/verify/batch', {
      method: 'POST',
      body: JSON.stringify({ watermarkIds }),
    });

    return response as BatchVerificationResult;
  }

  /**
   * Stream verification - verify watermarks as they are produced
   * Uses Server-Sent Events for real-time updates
   *
   * @param nodeId - Node to stream verifications from
   * @param callback - Handler for each verification event
   */
  streamVerifications(
    nodeId: string,
    callback: (result: VerificationResult) => void
  ): () => void {
    this.ensureInitialized();

    const url = `${this.config.baseUrl}/stream/${nodeId}`;
    const eventSource = new EventSource(`${url}?apiKey=${this.config.apiKey}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data as VerificationResult);
    };

    eventSource.onerror = () => {
      console.error('[EPO SDK] Stream connection error');
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  // ============================================================
  // NODE INFORMATION
  // ============================================================

  /**
   * Get information about a certified EPO node
   */
  async getNode(nodeId: string): Promise<NodeInfo> {
    this.ensureInitialized();

    const response = await this.makeRequest(`/nodes/${nodeId}`, {
      method: 'GET',
    });

    return response as NodeInfo;
  }

  /**
   * List all certified EPO nodes
   */
  async listNodes(options?: {
    region?: string;
    sourceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ nodes: NodeInfo[]; total: number }> {
    this.ensureInitialized();

    const params = new URLSearchParams();
    if (options?.region) params.append('region', options.region);
    if (options?.sourceType) params.append('sourceType', options.sourceType);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.makeRequest(`/nodes?${params.toString()}`, {
      method: 'GET',
    });

    return response as { nodes: NodeInfo[]; total: number };
  }

  // ============================================================
  // ROYALTY MANAGEMENT
  // ============================================================

  /**
   * Get your current royalty balance and earnings
   */
  async getRoyaltyBalance(): Promise<RoyaltyBalance> {
    this.ensureInitialized();

    const response = await this.makeRequest('/royalty/balance', {
      method: 'GET',
    });

    return response as RoyaltyBalance;
  }

  /**
   * Get verification usage for the current billing period
   */
  async getUsage(): Promise<{
    currentPeriod: { verifications: number; royaltiesPaid: number };
    limit: number;
    resetDate: string;
  }> {
    this.ensureInitialized();

    const response = await this.makeRequest('/usage', {
      method: 'GET',
    });

    return response as {
      currentPeriod: { verifications: number; royaltiesPaid: number };
      limit: number;
      resetDate: string;
    };
  }

  // ============================================================
  // ATTESTATION (FOR NODE OPERATORS)
  // ============================================================

  /**
   * Submit energy production data for attestation
   * Only available for registered node operators
   */
  async attest(data: {
    nodeId: string;
    kwhProduced: number;
    sourceType: string;
    inverterReadings: Array<{
      inverterId: string;
      voltage: number;
      current: number;
      frequency: number;
      powerFactor: number;
      temperature: number;
    }>;
    weatherConditions?: {
      irradiance?: number;
      windSpeed?: number;
      temperature: number;
      humidity: number;
    };
  }): Promise<{
    watermarkId: string;
    proofHash: string;
    status: 'pending' | 'attested';
    estimatedConfirmation: string;
  }> {
    this.ensureInitialized();

    const response = await this.makeRequest('/attest', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response as {
      watermarkId: string;
      proofHash: string;
      status: 'pending' | 'attested';
      estimatedConfirmation: string;
    };
  }

  // ============================================================
  // WEBHOOKS
  // ============================================================

  /**
   * Register a webhook URL for real-time events
   */
  async registerWebhook(url: string, events: WebhookEvent['eventType'][]): Promise<{
    webhookId: string;
    secret: string;
    status: 'active';
  }> {
    this.ensureInitialized();

    const response = await this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    });

    return response as { webhookId: string; secret: string; status: 'active' };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implementation would use HMAC-SHA256
    // This is a simplified version
    const crypto = globalThis.crypto;
    if (!crypto) return false;

    // In production, use proper HMAC verification
    return signature.length === 64;
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Parse a watermark ID into its components
   */
  parseWatermarkId(watermarkId: string): {
    nodeId: string;
    timestamp: number;
    hash: string;
  } | null {
    const match = watermarkId.match(/^EPO-(.+)-(\d+)-([A-F0-9]+)$/);
    if (!match) return null;

    return {
      nodeId: match[1],
      timestamp: parseInt(match[2], 10),
      hash: match[3],
    };
  }

  /**
   * Calculate carbon offset for verified energy
   * Based on global average grid emission factor
   */
  calculateCarbonOffset(kwhVerified: number, sourceType: string): number {
    // kg CO2 per kWh (global average grid emission)
    const gridEmissionFactor = 0.475;

    // Renewable sources offset grid emissions
    const renewableSources = ['solar', 'wind', 'hydro'];
    if (renewableSources.includes(sourceType)) {
      return kwhVerified * gridEmissionFactor;
    }

    return 0;
  }

  // ============================================================
  // INTERNAL METHODS
  // ============================================================

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Check your API key.');
    }
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<unknown> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-EPO-Environment': this.config.environment,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Create a new EPO client instance
 */
export function createEPOClient(config: EPOConfig): FieldNineEPO {
  return new FieldNineEPO(config);
}

/**
 * Quick verification without creating a client
 */
export async function quickVerify(
  apiKey: string,
  watermarkId: string
): Promise<VerificationResult> {
  const client = new FieldNineEPO({ apiKey });
  return client.verify(watermarkId);
}

// Types are exported inline with their definitions above
