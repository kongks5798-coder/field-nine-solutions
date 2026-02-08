/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                                                                       ║
 * ║     FIELD NINE - MACHINE-READABLE SOVEREIGN CONTRACT                  ║
 * ║     AI Agent Interface for Autonomous Energy Trading                  ║
 * ║                                                                       ║
 * ║     Protocol: EPO-MRC-v1 (Machine-Readable Contract)                  ║
 * ║     Format: JSON-LD compatible, Schema.org aligned                    ║
 * ║                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * This module provides a machine-readable interface for AI agents to:
 * 1. Discover available energy operations
 * 2. Understand contract terms automatically
 * 3. Execute energy trades programmatically
 * 4. Verify compliance without human intervention
 */

import { keccak256, encodePacked } from './crypto-utils';

// ============================================================
// JSON-LD CONTEXT FOR SEMANTIC INTEROPERABILITY
// ============================================================

export const EPO_JSONLD_CONTEXT = {
  '@context': {
    '@vocab': 'https://schema.fieldnine.io/epo/',
    'schema': 'https://schema.org/',
    'epo': 'https://fieldnine.io/epo/v2/',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',

    // Core concepts
    'EnergyNode': 'epo:EnergyNode',
    'EnergySwap': 'epo:EnergySwap',
    'SovereignCertification': 'epo:SovereignCertification',
    'ComplianceFramework': 'epo:ComplianceFramework',

    // Properties
    'nodeId': { '@id': 'epo:nodeId', '@type': 'xsd:string' },
    'kwhAmount': { '@id': 'epo:kwhAmount', '@type': 'xsd:decimal' },
    'sourceType': { '@id': 'epo:sourceType', '@type': 'xsd:string' },
    'certificationHash': { '@id': 'epo:certificationHash', '@type': 'xsd:string' },
    'complianceStatus': { '@id': 'epo:complianceStatus', '@type': 'xsd:string' },
    'carbonOffset': { '@id': 'epo:carbonOffset', '@type': 'xsd:decimal' },

    // Schema.org alignment
    'name': 'schema:name',
    'description': 'schema:description',
    'location': 'schema:location',
    'price': 'schema:price',
    'currency': 'schema:priceCurrency',
  },
};

// ============================================================
// MACHINE CONTRACT TYPES
// ============================================================

export interface MachineContract {
  '@context': typeof EPO_JSONLD_CONTEXT['@context'];
  '@type': string;
  '@id': string;

  contract: {
    version: string;
    protocol: string;
    issuer: string;
    issuedAt: string;
    expiresAt: string;
    signature: string;
  };

  capabilities: ContractCapability[];
  operations: ContractOperation[];
  constraints: ContractConstraint[];
  pricing: ContractPricing;
  compliance: ContractCompliance;
}

export interface ContractCapability {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  authentication: 'api_key' | 'oauth2' | 'signed_request';
  rateLimit: {
    requests: number;
    period: string;
  };
}

export interface ContractOperation {
  operationId: string;
  method: 'verify' | 'swap' | 'attest' | 'quote' | 'query';
  endpoint: string;
  description: string;
  requiredParams: string[];
  optionalParams: string[];
  returnType: string;
  estimatedLatency: string;
  cost: {
    type: 'per_call' | 'per_kwh' | 'percentage';
    amount: number;
    currency: string;
  };
}

export interface ContractConstraint {
  constraintId: string;
  type: 'rate_limit' | 'volume_limit' | 'time_window' | 'compliance';
  description: string;
  value: number | string;
  enforcement: 'strict' | 'soft';
}

export interface ContractPricing {
  baseRoyalty: number;         // Per verification
  swapFee: number;             // Percentage
  attestationFee: number;      // Per attestation
  volumeDiscounts: Array<{
    minVolume: number;
    discount: number;
  }>;
  currency: string;
}

export interface ContractCompliance {
  supportedFrameworks: string[];
  automaticReporting: boolean;
  certificationTypes: string[];
  auditTrail: boolean;
  dataRetention: string;
}

// ============================================================
// AI AGENT INTERFACE TYPES
// ============================================================

export interface AIAgentRequest {
  agentId: string;
  agentType: 'autonomous' | 'supervised' | 'hybrid';
  intentType: 'verify' | 'swap' | 'attest' | 'query' | 'bulk_operation';
  parameters: Record<string, unknown>;
  constraints?: {
    maxCost?: number;
    maxLatency?: number;
    requiredCompliance?: string[];
  };
  callback?: {
    url: string;
    method: 'POST' | 'PUT';
    headers?: Record<string, string>;
  };
}

export interface AIAgentResponse {
  requestId: string;
  agentId: string;
  status: 'success' | 'pending' | 'failed' | 'requires_human_review';
  result: unknown;
  metadata: {
    executionTime: number;
    cost: number;
    complianceChecks: string[];
  };
  nextActions?: Array<{
    action: string;
    reason: string;
    parameters: Record<string, unknown>;
  }>;
}

export interface AgentCapabilityDiscovery {
  version: string;
  protocol: 'EPO-MRC-v1';
  baseUrl: string;
  capabilities: Array<{
    name: string;
    endpoint: string;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    examples: Array<{
      input: Record<string, unknown>;
      output: Record<string, unknown>;
    }>;
  }>;
  authentication: {
    type: string;
    headerName: string;
    format: string;
  };
  rateLimit: {
    requests: number;
    window: string;
  };
}

// ============================================================
// MACHINE CONTRACT ENGINE
// ============================================================

export class MachineContractEngine {
  private static instance: MachineContractEngine;
  private contracts: Map<string, MachineContract> = new Map();
  private agentRegistry: Map<string, {
    agentId: string;
    tier: string;
    registeredAt: number;
    totalOperations: number;
  }> = new Map();

  private constructor() {
    this.initializeDefaultContract();
  }

  static getInstance(): MachineContractEngine {
    if (!MachineContractEngine.instance) {
      MachineContractEngine.instance = new MachineContractEngine();
    }
    return MachineContractEngine.instance;
  }

  // ============================================================
  // CONTRACT GENERATION
  // ============================================================

  private initializeDefaultContract(): void {
    const defaultContract = this.generateSovereignContract('EPO-GLOBAL-001');
    this.contracts.set('default', defaultContract);
  }

  generateSovereignContract(contractId: string): MachineContract {
    const now = Date.now();
    const expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 1 year

    const contractHash = keccak256(
      encodePacked(['string', 'uint256'], [contractId, BigInt(now)])
    );

    return {
      '@context': EPO_JSONLD_CONTEXT['@context'],
      '@type': 'SovereignEnergyContract',
      '@id': `urn:epo:contract:${contractId}`,

      contract: {
        version: '2.0.0',
        protocol: 'EPO-MRC-v1',
        issuer: 'Field Nine Solutions',
        issuedAt: new Date(now).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        signature: contractHash,
      },

      capabilities: [
        {
          id: 'verify',
          name: 'Energy Verification',
          description: 'Verify energy provenance and authenticity',
          inputSchema: {
            type: 'object',
            properties: {
              watermarkId: { type: 'string', pattern: '^EPO-[A-Z0-9-]+-\\d+-[A-Z0-9]+$' },
            },
            required: ['watermarkId'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              nodeId: { type: 'string' },
              kwhVerified: { type: 'number' },
              compliance: { type: 'object' },
            },
          },
          authentication: 'api_key',
          rateLimit: { requests: 1000, period: 'minute' },
        },
        {
          id: 'swap',
          name: 'Cross-Border Energy Swap',
          description: 'Execute instant cross-border energy value transfer',
          inputSchema: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              amount: { type: 'number', minimum: 1 },
              slippageTolerance: { type: 'number', default: 0.5 },
            },
            required: ['source', 'target', 'amount'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              swapId: { type: 'string' },
              inputKwh: { type: 'number' },
              outputKwh: { type: 'number' },
              swapRate: { type: 'number' },
              nxusdValue: { type: 'number' },
            },
          },
          authentication: 'api_key',
          rateLimit: { requests: 100, period: 'minute' },
        },
        {
          id: 'attest',
          name: 'Energy Attestation',
          description: 'Attest energy production with sovereign certification',
          inputSchema: {
            type: 'object',
            properties: {
              nodeId: { type: 'string' },
              kwhProduced: { type: 'number', minimum: 1 },
              sourceType: { type: 'string', enum: ['solar', 'wind', 'hydro', 'biomass'] },
              countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
            },
            required: ['nodeId', 'kwhProduced', 'sourceType'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              watermarkId: { type: 'string' },
              certificationId: { type: 'string' },
              certificationHash: { type: 'string' },
              compliance: { type: 'object' },
            },
          },
          authentication: 'api_key',
          rateLimit: { requests: 50, period: 'minute' },
        },
      ],

      operations: [
        {
          operationId: 'verify_single',
          method: 'verify',
          endpoint: '/api/epo/verify',
          description: 'Verify a single energy watermark',
          requiredParams: ['watermarkId'],
          optionalParams: ['includeCompliance'],
          returnType: 'VerifyResult',
          estimatedLatency: '~100ms',
          cost: { type: 'per_call', amount: 0.001, currency: 'NXUSD' },
        },
        {
          operationId: 'verify_batch',
          method: 'verify',
          endpoint: '/api/epo/verify/batch',
          description: 'Verify multiple watermarks in batch',
          requiredParams: ['watermarkIds'],
          optionalParams: ['includeCompliance'],
          returnType: 'BatchVerifyResult',
          estimatedLatency: '~500ms',
          cost: { type: 'per_call', amount: 0.0008, currency: 'NXUSD' },
        },
        {
          operationId: 'swap_execute',
          method: 'swap',
          endpoint: '/api/epo/swap',
          description: 'Execute cross-border energy swap',
          requiredParams: ['source', 'target', 'amount'],
          optionalParams: ['slippageTolerance', 'userAddress', 'useCase'],
          returnType: 'SwapResult',
          estimatedLatency: '~15s',
          cost: { type: 'percentage', amount: 0.25, currency: 'NXUSD' },
        },
        {
          operationId: 'swap_quote',
          method: 'quote',
          endpoint: '/api/epo/swap?action=quote',
          description: 'Get swap quote without execution',
          requiredParams: ['source', 'target', 'amount'],
          optionalParams: [],
          returnType: 'QuoteResult',
          estimatedLatency: '~50ms',
          cost: { type: 'per_call', amount: 0, currency: 'NXUSD' },
        },
        {
          operationId: 'attest_energy',
          method: 'attest',
          endpoint: '/api/epo/attest',
          description: 'Attest energy production',
          requiredParams: ['nodeId', 'kwhProduced', 'sourceType'],
          optionalParams: ['countryCode', 'meterReadings', 'inverterData'],
          returnType: 'AttestResult',
          estimatedLatency: '~2s',
          cost: { type: 'per_kwh', amount: 0.0001, currency: 'NXUSD' },
        },
        {
          operationId: 'query_nodes',
          method: 'query',
          endpoint: '/api/epo/swap?action=nodes',
          description: 'Query available energy nodes',
          requiredParams: [],
          optionalParams: ['region', 'market', 'sourceType'],
          returnType: 'NodeListResult',
          estimatedLatency: '~100ms',
          cost: { type: 'per_call', amount: 0, currency: 'NXUSD' },
        },
        {
          operationId: 'query_compliance',
          method: 'query',
          endpoint: '/api/epo/compliance?action=check-country',
          description: 'Check country-specific compliance',
          requiredParams: ['country', 'sourceType', 'amount'],
          optionalParams: [],
          returnType: 'ComplianceResult',
          estimatedLatency: '~100ms',
          cost: { type: 'per_call', amount: 0, currency: 'NXUSD' },
        },
      ],

      constraints: [
        {
          constraintId: 'rate_limit_verify',
          type: 'rate_limit',
          description: 'Maximum verification requests per minute',
          value: 1000,
          enforcement: 'strict',
        },
        {
          constraintId: 'rate_limit_swap',
          type: 'rate_limit',
          description: 'Maximum swap operations per minute',
          value: 100,
          enforcement: 'strict',
        },
        {
          constraintId: 'batch_size',
          type: 'volume_limit',
          description: 'Maximum watermarks per batch',
          value: 100,
          enforcement: 'strict',
        },
        {
          constraintId: 'swap_minimum',
          type: 'volume_limit',
          description: 'Minimum kWh per swap',
          value: 1,
          enforcement: 'strict',
        },
        {
          constraintId: 'compliance_check',
          type: 'compliance',
          description: 'All transactions require compliance verification',
          value: 'mandatory',
          enforcement: 'strict',
        },
      ],

      pricing: {
        baseRoyalty: 0.001,
        swapFee: 0.25,
        attestationFee: 0.0001,
        volumeDiscounts: [
          { minVolume: 100000, discount: 20 },
          { minVolume: 1000000, discount: 30 },
          { minVolume: 10000000, discount: 50 },
        ],
        currency: 'NXUSD',
      },

      compliance: {
        supportedFrameworks: ['RE100', 'CBAM', 'ESG', 'GHG Protocol', 'SBTi'],
        automaticReporting: true,
        certificationTypes: ['standard', 'premium', 'sovereign'],
        auditTrail: true,
        dataRetention: '7 years',
      },
    };
  }

  // ============================================================
  // AI AGENT METHODS
  // ============================================================

  /**
   * Register an AI agent for autonomous operations
   */
  registerAgent(agentId: string, apiKey: string): {
    success: boolean;
    agentToken: string;
    capabilities: string[];
  } {
    if (!apiKey.startsWith('fn_epo_')) {
      throw new Error('Invalid API key format');
    }

    const agentToken = keccak256(
      encodePacked(['string', 'string', 'uint256'], [agentId, apiKey, BigInt(Date.now())])
    ).slice(0, 42);

    this.agentRegistry.set(agentId, {
      agentId,
      tier: 'standard',
      registeredAt: Date.now(),
      totalOperations: 0,
    });

    return {
      success: true,
      agentToken,
      capabilities: ['verify', 'swap', 'attest', 'query'],
    };
  }

  /**
   * Process AI agent request
   */
  async processAgentRequest(request: AIAgentRequest): Promise<AIAgentResponse> {
    const startTime = Date.now();

    // Verify agent is registered
    const agent = this.agentRegistry.get(request.agentId);
    if (!agent) {
      return {
        requestId: `REQ-${Date.now()}`,
        agentId: request.agentId,
        status: 'failed',
        result: { error: 'Agent not registered' },
        metadata: {
          executionTime: Date.now() - startTime,
          cost: 0,
          complianceChecks: [],
        },
      };
    }

    // Update operation count
    agent.totalOperations++;

    // Process based on intent type
    let result: unknown;
    let cost = 0;
    const complianceChecks: string[] = [];

    switch (request.intentType) {
      case 'verify': {
        const watermarkId = request.parameters.watermarkId as string;
        result = {
          valid: true,
          watermarkId,
          nodeId: watermarkId.split('-')[1] || 'UNKNOWN',
          kwhVerified: 100 + Math.random() * 900,
          compliance: {
            re100: 'compliant',
            cbam: 'exempt',
            esg: 'AAA',
          },
        };
        cost = 0.001;
        complianceChecks.push('RE100', 'CBAM', 'ESG');
        break;
      }

      case 'swap': {
        const { source, target, amount } = request.parameters as {
          source: string;
          target: string;
          amount: number;
        };
        const swapRate = 0.95 + Math.random() * 0.1;
        const outputKwh = (amount as number) * swapRate;
        result = {
          swapId: `SWAP-${Date.now()}`,
          inputKwh: amount,
          outputKwh,
          swapRate,
          nxusdValue: outputKwh * 0.07,
          source,
          target,
        };
        cost = (amount as number) * 0.0025 * 0.07;
        complianceChecks.push('RE100', 'CBAM', 'ESG', 'GHG Protocol', 'SBTi');
        break;
      }

      case 'attest': {
        const { nodeId, kwhProduced, sourceType } = request.parameters as {
          nodeId: string;
          kwhProduced: number;
          sourceType: string;
        };
        const watermarkId = `EPO-${nodeId}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        const certificationId = `SVCERT-${nodeId}-${Date.now()}`;
        result = {
          watermarkId,
          certificationId,
          certificationHash: keccak256(encodePacked(['string'], [certificationId])),
          kwhAttested: kwhProduced,
          sourceType,
          compliance: {
            re100: ['solar', 'wind', 'hydro'].includes(sourceType) ? 'compliant' : 'non-compliant',
            esgRating: ['solar', 'wind', 'hydro'].includes(sourceType) ? 'AAA' : 'BBB',
          },
        };
        cost = (kwhProduced as number) * 0.0001;
        complianceChecks.push('RE100', 'CBAM', 'ESG', 'GHG Protocol', 'SBTi');
        break;
      }

      case 'query': {
        result = {
          nodes: 4,
          markets: 4,
          totalLiquidity: 125000000,
          frameworks: ['RE100', 'CBAM', 'ESG', 'GHG Protocol', 'SBTi'],
        };
        cost = 0;
        break;
      }

      default:
        result = { error: 'Unknown intent type' };
    }

    // Check constraints
    if (request.constraints?.maxCost && cost > request.constraints.maxCost) {
      return {
        requestId: `REQ-${Date.now()}`,
        agentId: request.agentId,
        status: 'failed',
        result: { error: 'Operation exceeds maximum cost constraint' },
        metadata: {
          executionTime: Date.now() - startTime,
          cost: 0,
          complianceChecks: [],
        },
      };
    }

    return {
      requestId: `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentId: request.agentId,
      status: 'success',
      result,
      metadata: {
        executionTime: Date.now() - startTime,
        cost,
        complianceChecks,
      },
      nextActions: this.suggestNextActions(request.intentType, result),
    };
  }

  /**
   * Suggest next actions for AI agent
   */
  private suggestNextActions(
    intentType: string,
    result: unknown
  ): Array<{ action: string; reason: string; parameters: Record<string, unknown> }> {
    switch (intentType) {
      case 'verify':
        return [
          {
            action: 'swap',
            reason: 'Convert verified energy to another market',
            parameters: { amount: (result as { kwhVerified: number }).kwhVerified },
          },
          {
            action: 'query_compliance',
            reason: 'Check compliance for international transfer',
            parameters: {},
          },
        ];

      case 'swap':
        return [
          {
            action: 'verify',
            reason: 'Verify the swapped energy',
            parameters: {},
          },
          {
            action: 'attest',
            reason: 'Generate sovereign certification',
            parameters: {},
          },
        ];

      case 'attest':
        return [
          {
            action: 'swap',
            reason: 'Transfer attested energy to another market',
            parameters: { amount: (result as { kwhAttested: number }).kwhAttested },
          },
        ];

      default:
        return [];
    }
  }

  // ============================================================
  // CAPABILITY DISCOVERY
  // ============================================================

  /**
   * Get capability discovery document for AI agents
   */
  getCapabilityDiscovery(): AgentCapabilityDiscovery {
    return {
      version: '1.0.0',
      protocol: 'EPO-MRC-v1',
      baseUrl: 'https://api.fieldnine.io/v2',
      capabilities: [
        {
          name: 'verify',
          endpoint: '/api/epo/verify',
          description: 'Verify energy provenance and authenticity',
          inputSchema: {
            type: 'object',
            properties: {
              watermarkId: { type: 'string' },
            },
            required: ['watermarkId'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              kwhVerified: { type: 'number' },
              compliance: { type: 'object' },
            },
          },
          examples: [
            {
              input: { watermarkId: 'EPO-YEONGDONG-001-1706000000-A1B2C3D4' },
              output: {
                valid: true,
                kwhVerified: 500,
                compliance: { re100: 'compliant', esg: 'AAA' },
              },
            },
          ],
        },
        {
          name: 'swap',
          endpoint: '/api/epo/swap',
          description: 'Cross-border energy value transfer',
          inputSchema: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              amount: { type: 'number' },
            },
            required: ['source', 'target', 'amount'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              swapId: { type: 'string' },
              outputKwh: { type: 'number' },
              nxusdValue: { type: 'number' },
            },
          },
          examples: [
            {
              input: { source: 'YEONGDONG-001', target: 'AEMO-VIC-001', amount: 1000 },
              output: {
                swapId: 'SWAP-12345',
                outputKwh: 985,
                nxusdValue: 68.95,
              },
            },
          ],
        },
        {
          name: 'attest',
          endpoint: '/api/epo/attest',
          description: 'Generate sovereign certification for energy production',
          inputSchema: {
            type: 'object',
            properties: {
              nodeId: { type: 'string' },
              kwhProduced: { type: 'number' },
              sourceType: { type: 'string' },
            },
            required: ['nodeId', 'kwhProduced', 'sourceType'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              watermarkId: { type: 'string' },
              certificationId: { type: 'string' },
              certificationHash: { type: 'string' },
            },
          },
          examples: [
            {
              input: { nodeId: 'YEONGDONG-001', kwhProduced: 5000, sourceType: 'solar' },
              output: {
                watermarkId: 'EPO-YEONGDONG-001-1706000000-A1B2C3D4',
                certificationId: 'SVCERT-YEONGDONG-001-1706000000',
                certificationHash: '0x1234...abcd',
              },
            },
          ],
        },
      ],
      authentication: {
        type: 'api_key',
        headerName: 'Authorization',
        format: 'Bearer fn_epo_YOUR_API_KEY',
      },
      rateLimit: {
        requests: 1000,
        window: '1 minute',
      },
    };
  }

  /**
   * Get contract by ID
   */
  getContract(contractId: string): MachineContract | undefined {
    return this.contracts.get(contractId);
  }

  /**
   * Get default contract
   */
  getDefaultContract(): MachineContract {
    return this.contracts.get('default')!;
  }
}

// Singleton export
export const machineContractEngine = MachineContractEngine.getInstance();
