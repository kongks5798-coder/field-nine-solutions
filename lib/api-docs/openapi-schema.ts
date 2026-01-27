/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: OPENAPI SCHEMA DEFINITION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * OpenAPI 3.1 specification for Field Nine Solutions API
 */

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
    responses: Record<string, unknown>;
  };
}

// Generate OpenAPI Schema
export function generateOpenAPISchema(): OpenAPISchema {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Field Nine Solutions API',
      version: '1.0.0',
      description: `
# Field Nine Solutions API Documentation

Enterprise-grade API for K-Universal platform services.

## Features
- 🔐 OAuth 2.0 & API Key Authentication
- 💳 Payment Processing (Stripe, Toss, PayPal)
- 🎨 NFT Marketplace & Web3 Integration
- 📊 Analytics & Monitoring
- 🌍 Multi-language Support (ko, en, ja, zh)

## Rate Limits
- Standard: 100 requests/minute
- Auth endpoints: 5 requests/5 minutes
- Payment endpoints: 20 requests/minute
- Public API: 1000 requests/hour

## Support
Contact our API team for integration assistance.
      `.trim(),
      contact: {
        name: 'Field Nine API Support',
        email: 'api@fieldnine.io',
        url: 'https://fieldnine.io/developers',
      },
      license: {
        name: 'Proprietary',
        url: 'https://fieldnine.io/terms',
      },
    },
    servers: [
      {
        url: 'https://fieldnine.io',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & Authorization' },
      { name: 'Users', description: 'User Management' },
      { name: 'Wallet', description: 'Digital Wallet Operations' },
      { name: 'Payments', description: 'Payment Processing' },
      { name: 'NFT', description: 'NFT Marketplace' },
      { name: 'Trading', description: 'Trading & Exchange' },
      { name: 'Admin', description: 'Administrative Operations' },
      { name: 'Analytics', description: 'Analytics & Metrics' },
      { name: 'Health', description: 'System Health & Status' },
    ],
    paths: {
      // Health & Status
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health Check',
          description: 'Check API health status',
          operationId: 'getHealth',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
          },
        },
      },

      // Authentication
      '/api/auth/session': {
        get: {
          tags: ['Auth'],
          summary: 'Get Current Session',
          description: 'Retrieve the current user session',
          operationId: 'getSession',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Session retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SessionResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // Wallet
      '/api/wallet/balance': {
        get: {
          tags: ['Wallet'],
          summary: 'Get Wallet Balance',
          description: 'Retrieve user wallet balance and currency breakdown',
          operationId: 'getWalletBalance',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Balance retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WalletBalanceResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/wallet/topup': {
        post: {
          tags: ['Wallet'],
          summary: 'Top Up Wallet',
          description: 'Add funds to user wallet',
          operationId: 'topUpWallet',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TopUpRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Top up initiated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TopUpResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/wallet/transactions': {
        get: {
          tags: ['Wallet'],
          summary: 'Get Transactions',
          description: 'Retrieve wallet transaction history',
          operationId: 'getTransactions',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
              description: 'Number of transactions to return',
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0 },
              description: 'Pagination offset',
            },
          ],
          responses: {
            '200': {
              description: 'Transactions retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TransactionsResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // Payments
      '/api/payment/toss/confirm': {
        post: {
          tags: ['Payments'],
          summary: 'Confirm Toss Payment',
          description: 'Confirm and finalize a Toss payment',
          operationId: 'confirmTossPayment',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TossConfirmRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Payment confirmed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaymentResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },

      '/api/stripe/webhook': {
        post: {
          tags: ['Payments'],
          summary: 'Stripe Webhook',
          description: 'Handle Stripe webhook events',
          operationId: 'stripeWebhook',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '200': { description: 'Webhook processed successfully' },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },

      // NFT Marketplace
      '/api/nft/marketplace': {
        get: {
          tags: ['NFT'],
          summary: 'Get NFT Listings',
          description: 'Retrieve active NFT marketplace listings',
          operationId: 'getNFTListings',
          parameters: [
            {
              name: 'collection',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by collection address',
            },
            {
              name: 'minPrice',
              in: 'query',
              schema: { type: 'number' },
              description: 'Minimum price filter (ETH)',
            },
            {
              name: 'maxPrice',
              in: 'query',
              schema: { type: 'number' },
              description: 'Maximum price filter (ETH)',
            },
          ],
          responses: {
            '200': {
              description: 'Listings retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NFTListingsResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['NFT'],
          summary: 'Create NFT Listing',
          description: 'List an NFT for sale on the marketplace',
          operationId: 'createNFTListing',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateListingRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Listing created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NFTListingResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // Trading
      '/api/trading/engine': {
        post: {
          tags: ['Trading'],
          summary: 'Execute Trade',
          description: 'Execute a trading operation',
          operationId: 'executeTrade',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TradeRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Trade executed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TradeResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // Admin Observability
      '/api/admin/observability': {
        get: {
          tags: ['Admin'],
          summary: 'Get System Observability',
          description: 'Retrieve comprehensive system observability data',
          operationId: 'getObservability',
          security: [{ bearerAuth: [] }, { apiKey: [] }],
          responses: {
            '200': {
              description: 'Observability data retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ObservabilityResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      '/api/admin/observability/logs': {
        get: {
          tags: ['Admin'],
          summary: 'Get System Logs',
          description: 'Retrieve and filter system logs',
          operationId: 'getLogs',
          security: [{ bearerAuth: [] }, { apiKey: [] }],
          parameters: [
            {
              name: 'level',
              in: 'query',
              schema: { type: 'string', enum: ['debug', 'info', 'warn', 'error', 'fatal'] },
              description: 'Filter by log level',
            },
            {
              name: 'service',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by service name',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search query',
            },
          ],
          responses: {
            '200': {
              description: 'Logs retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LogsResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // Analytics
      '/api/admin/metrics': {
        get: {
          tags: ['Analytics'],
          summary: 'Get System Metrics',
          description: 'Retrieve real-time system metrics',
          operationId: 'getMetrics',
          security: [{ bearerAuth: [] }, { apiKey: [] }],
          responses: {
            '200': {
              description: 'Metrics retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MetricsResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
    },
    components: {
      schemas: {
        // Common
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
          },
          required: ['success', 'error'],
        },

        // Health
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            version: { type: 'string' },
            uptime: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },

        // Auth
        SessionResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
            expires: { type: 'string', format: 'date-time' },
          },
        },

        // Wallet
        WalletBalanceResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            balance: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                available: { type: 'number' },
                pending: { type: 'number' },
                currency: { type: 'string' },
              },
            },
          },
        },

        TopUpRequest: {
          type: 'object',
          properties: {
            amount: { type: 'number', minimum: 1000 },
            currency: { type: 'string', default: 'KRW' },
            paymentMethod: { type: 'string', enum: ['card', 'bank', 'virtual'] },
          },
          required: ['amount'],
        },

        TopUpResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            transactionId: { type: 'string' },
            paymentUrl: { type: 'string' },
          },
        },

        TransactionsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  amount: { type: 'number' },
                  currency: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
              },
            },
          },
        },

        // Payments
        TossConfirmRequest: {
          type: 'object',
          properties: {
            paymentKey: { type: 'string' },
            orderId: { type: 'string' },
            amount: { type: 'number' },
          },
          required: ['paymentKey', 'orderId', 'amount'],
        },

        PaymentResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            payment: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                amount: { type: 'number' },
                method: { type: 'string' },
              },
            },
          },
        },

        // NFT
        NFTListingsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            listings: {
              type: 'array',
              items: { $ref: '#/components/schemas/NFTListing' },
            },
          },
        },

        NFTListing: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            tokenId: { type: 'string' },
            collectionAddress: { type: 'string' },
            seller: { type: 'string' },
            price: { type: 'string' },
            currency: { type: 'string' },
            status: { type: 'string', enum: ['active', 'sold', 'cancelled'] },
            metadata: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                image: { type: 'string' },
              },
            },
          },
        },

        CreateListingRequest: {
          type: 'object',
          properties: {
            tokenId: { type: 'string' },
            collectionAddress: { type: 'string' },
            price: { type: 'string' },
            currency: { type: 'string', default: 'ETH' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
          required: ['tokenId', 'collectionAddress', 'price'],
        },

        NFTListingResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            listing: { $ref: '#/components/schemas/NFTListing' },
          },
        },

        // Trading
        TradeRequest: {
          type: 'object',
          properties: {
            pair: { type: 'string', example: 'BTC/KRW' },
            side: { type: 'string', enum: ['buy', 'sell'] },
            type: { type: 'string', enum: ['market', 'limit'] },
            amount: { type: 'number' },
            price: { type: 'number' },
          },
          required: ['pair', 'side', 'type', 'amount'],
        },

        TradeResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            trade: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                pair: { type: 'string' },
                side: { type: 'string' },
                amount: { type: 'number' },
                price: { type: 'number' },
                total: { type: 'number' },
                status: { type: 'string' },
              },
            },
          },
        },

        // Observability
        ObservabilityResponse: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            responseTime: { type: 'number' },
            health: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                uptime: { type: 'number' },
                checks: { type: 'array', items: { type: 'object' } },
              },
            },
            cache: {
              type: 'object',
              properties: {
                hits: { type: 'integer' },
                misses: { type: 'integer' },
                hitRate: { type: 'number' },
              },
            },
            circuitBreakers: { type: 'array', items: { type: 'object' } },
          },
        },

        LogsResponse: {
          type: 'object',
          properties: {
            logs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  level: { type: 'string' },
                  service: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
            pagination: { type: 'object' },
          },
        },

        MetricsResponse: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            activeUsers: { type: 'integer' },
            errorRate: { type: 'number' },
            avgResponseTime: { type: 'number' },
            uptime: { type: 'number' },
          },
        },
      },

      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from authentication',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for server-to-server communication',
        },
      },

      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Invalid request parameters',
                code: 'BAD_REQUEST',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Authentication required',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Rate limit exceeded',
                code: 'RATE_LIMITED',
                details: { retryAfter: 60 },
              },
            },
          },
        },
      },
    },
  };
}

export default generateOpenAPISchema;
