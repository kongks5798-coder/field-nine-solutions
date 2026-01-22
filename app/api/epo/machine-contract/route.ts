/**
 * EPO MACHINE-READABLE CONTRACT API
 *
 * AI Agent Interface for autonomous energy trading operations.
 * Protocol: EPO-MRC-v1
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  machineContractEngine,
  EPO_JSONLD_CONTEXT,
} from '@/lib/epo/machine-contract';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'discovery': {
      // AI Agent capability discovery
      const discovery = machineContractEngine.getCapabilityDiscovery();

      return NextResponse.json(discovery, {
        headers: {
          'Content-Type': 'application/json',
          'X-Protocol': 'EPO-MRC-v1',
          'X-Version': '1.0.0',
        },
      });
    }

    case 'contract': {
      const contractId = searchParams.get('id');
      const contract = contractId
        ? machineContractEngine.getContract(contractId)
        : machineContractEngine.getDefaultContract();

      if (!contract) {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(contract, {
        headers: {
          'Content-Type': 'application/ld+json',
          'X-Protocol': 'EPO-MRC-v1',
        },
      });
    }

    case 'context': {
      return NextResponse.json(EPO_JSONLD_CONTEXT, {
        headers: {
          'Content-Type': 'application/ld+json',
        },
      });
    }

    case 'capabilities': {
      const contract = machineContractEngine.getDefaultContract();

      return NextResponse.json({
        capabilities: contract.capabilities,
        operations: contract.operations,
        totalCapabilities: contract.capabilities.length,
        totalOperations: contract.operations.length,
      });
    }

    case 'pricing': {
      const contract = machineContractEngine.getDefaultContract();

      return NextResponse.json({
        pricing: contract.pricing,
        constraints: contract.constraints,
        note: 'All prices in NXUSD unless otherwise specified',
      });
    }

    case 'compliance': {
      const contract = machineContractEngine.getDefaultContract();

      return NextResponse.json({
        compliance: contract.compliance,
        frameworks: contract.compliance.supportedFrameworks,
        certificationTypes: contract.compliance.certificationTypes,
      });
    }

    case 'openapi': {
      // Return OpenAPI 3.0 specification for the API
      const openApiSpec = {
        openapi: '3.0.3',
        info: {
          title: 'Field Nine EPO API',
          version: '2.0.0',
          description: 'Energy Proof-of-Origin Protocol API for AI Agents',
          contact: {
            name: 'Field Nine Solutions',
            url: 'https://fieldnine.io',
            email: 'api@fieldnine.io',
          },
          license: {
            name: 'Apache 2.0',
            url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
          },
        },
        servers: [
          {
            url: 'https://api.fieldnine.io/v2',
            description: 'Production server',
          },
          {
            url: 'https://sandbox.fieldnine.io/v2',
            description: 'Sandbox server',
          },
        ],
        paths: {
          '/verify': {
            post: {
              summary: 'Verify energy watermark',
              operationId: 'verify',
              tags: ['Verification'],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        watermarkId: { type: 'string' },
                      },
                      required: ['watermarkId'],
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Verification result',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          valid: { type: 'boolean' },
                          nodeId: { type: 'string' },
                          kwhVerified: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '/swap': {
            post: {
              summary: 'Execute energy swap',
              operationId: 'swap',
              tags: ['Swap'],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        source: { type: 'string' },
                        target: { type: 'string' },
                        amount: { type: 'number' },
                      },
                      required: ['source', 'target', 'amount'],
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Swap result',
                },
              },
            },
          },
          '/attest': {
            post: {
              summary: 'Attest energy production',
              operationId: 'attest',
              tags: ['Attestation'],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        nodeId: { type: 'string' },
                        kwhProduced: { type: 'number' },
                        sourceType: { type: 'string' },
                      },
                      required: ['nodeId', 'kwhProduced', 'sourceType'],
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Attestation result',
                },
              },
            },
          },
        },
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'Authorization',
              description: 'API key with format: Bearer fn_epo_YOUR_KEY',
            },
          },
        },
        security: [{ ApiKeyAuth: [] }],
      };

      return NextResponse.json(openApiSpec, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    default:
      return NextResponse.json({
        api: 'Machine-Readable Sovereign Contract API',
        version: '1.0',
        protocol: 'EPO-MRC-v1',
        description: 'AI Agent interface for autonomous energy trading',
        endpoints: {
          'GET ?action=discovery': 'AI Agent capability discovery',
          'GET ?action=contract': 'Get sovereign contract (JSON-LD)',
          'GET ?action=context': 'Get JSON-LD context',
          'GET ?action=capabilities': 'List available capabilities',
          'GET ?action=pricing': 'Get pricing and constraints',
          'GET ?action=compliance': 'Get compliance frameworks',
          'GET ?action=openapi': 'Get OpenAPI 3.0 specification',
          'POST (register)': 'Register AI agent',
          'POST (execute)': 'Execute agent request',
        },
        machineReadable: true,
        jsonLd: true,
        schemaOrg: true,
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'register': {
        const { agentId, agentType } = body;

        if (!agentId) {
          return NextResponse.json(
            { error: 'Missing required field: agentId' },
            { status: 400 }
          );
        }

        const registration = machineContractEngine.registerAgent(agentId, apiKey);

        return NextResponse.json({
          success: true,
          registration,
          message: `AI Agent ${agentId} registered successfully`,
          nextStep: 'Use the agent token to execute operations',
        });
      }

      case 'execute': {
        const { agentId, intentType, parameters, constraints, callback } = body;

        if (!agentId || !intentType) {
          return NextResponse.json(
            { error: 'Missing required fields: agentId, intentType' },
            { status: 400 }
          );
        }

        const response = await machineContractEngine.processAgentRequest({
          agentId,
          agentType: body.agentType || 'autonomous',
          intentType,
          parameters: parameters || {},
          constraints,
          callback,
        });

        return NextResponse.json({
          success: response.status === 'success',
          response,
          timestamp: new Date().toISOString(),
        });
      }

      case 'bulk_execute': {
        const { agentId, requests } = body;

        if (!agentId || !requests || !Array.isArray(requests)) {
          return NextResponse.json(
            { error: 'Missing required fields: agentId, requests (array)' },
            { status: 400 }
          );
        }

        if (requests.length > 50) {
          return NextResponse.json(
            { error: 'Bulk request limited to 50 operations' },
            { status: 400 }
          );
        }

        const results = await Promise.all(
          requests.map((req: { intentType: string; parameters: Record<string, unknown> }) =>
            machineContractEngine.processAgentRequest({
              agentId,
              agentType: 'autonomous',
              intentType: req.intentType as 'verify' | 'swap' | 'attest' | 'query' | 'bulk_operation',
              parameters: req.parameters,
            })
          )
        );

        const successCount = results.filter(r => r.status === 'success').length;
        const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);

        return NextResponse.json({
          success: true,
          bulk: {
            total: requests.length,
            succeeded: successCount,
            failed: requests.length - successCount,
            totalCost,
          },
          results,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: register, execute, bulk_execute' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Machine Contract Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
