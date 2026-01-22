# Field Nine Energy SDK v2.0

## The Global Standard for Energy Verification, Trading & Compliance

> Every kWh traced. Every transaction compliant. Every swap instant.

---

## Quick Start

```bash
npm install @fieldnine/energy-sdk
```

```typescript
import { FieldNineSDK } from '@fieldnine/energy-sdk';

const sdk = new FieldNineSDK({
  apiKey: 'fn_epo_your_api_key',
  environment: 'production',
});

// Verify energy origin
const verification = await sdk.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4');

// Cross-border swap
const swap = await sdk.swap({
  source: 'YEONGDONG-001',
  target: 'AEMO-VIC-001',
  amount: 1000,
});

// Generate sovereign certification
const cert = await sdk.attest({
  nodeId: 'YEONGDONG-001',
  kwhProduced: 5000,
  sourceType: 'solar',
});
```

---

## Core Functions

### 1. verify() - Energy Provenance Authentication

Verify the authenticity and origin of energy using its EPO watermark.

```typescript
const result = await sdk.verify(watermarkId: string): Promise<VerifyResult>;
```

**Input:**
- `watermarkId`: EPO watermark ID (format: `EPO-{NodeId}-{Timestamp}-{Hash}`)

**Output:**
```typescript
interface VerifyResult {
  success: boolean;
  watermarkId: string;
  nodeId: string;
  sourceType: string;          // 'solar' | 'wind' | 'hydro' | etc.
  kwhVerified: number;
  timestamp: string;

  proof: {
    attestationHash: string;
    polygonTxHash: string;
    blockNumber: number;
    verificationProof: string;
  };

  compliance?: {               // If enableCompliance: true
    re100: { status: string; certificationId: string };
    cbam: { status: string; carbonAdjustment: number };
    esg: { rating: string; score: number };
  };

  royalty: {
    amount: number;
    currency: 'NXUSD';
    tier: string;
  };

  metadata: {
    region: string;
    certificationLevel: string;
    carbonOffset: number;
    gridOperator: string;
  };
}
```

**Example:**
```typescript
const result = await sdk.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4');

if (result.success) {
  console.log(`Verified ${result.kwhVerified} kWh from ${result.nodeId}`);
  console.log(`ESG Rating: ${result.compliance?.esg.rating}`);
  console.log(`Carbon Offset: ${result.metadata.carbonOffset} kg CO2`);
}
```

---

### 2. swap() - Cross-Border Energy Value Transfer

Execute instant cross-border energy swaps between markets.

```typescript
const result = await sdk.swap(input: SwapInput): Promise<SwapResult>;
```

**Input:**
```typescript
interface SwapInput {
  source: string;           // Source node ID (e.g., 'YEONGDONG-001')
  target: string;           // Target node ID (e.g., 'AEMO-VIC-001')
  amount: number;           // kWh to swap
  userAddress?: string;     // Optional wallet address
  useCase?: string;         // Optional description
  slippageTolerance?: number; // Max slippage (default 0.5%)
}
```

**Output:**
```typescript
interface SwapResult {
  success: boolean;
  swapId: string;

  source: {
    nodeId: string;
    market: string;
    kwhDeposited: number;
    localPrice: number;
  };

  target: {
    nodeId: string;
    market: string;
    kwhReceived: number;
    localPrice: number;
  };

  economics: {
    swapRate: number;
    nxusdValue: number;
    fees: number;
    priceImpact: string;
  };

  proof: {
    gridInjectionProof: string;
    mirrorPositionId: string;
    swapOrderId: string;
    polygonTxHash: string;
  };

  settlement: {
    estimatedTime: string;
    path: string[];
    status: 'pending' | 'confirmed' | 'settled';
  };

  sovereignCertification?: {
    certificationId: string;
    certificationHash: string;
    compliantFrameworks: string[];
  };
}
```

**Example:**
```typescript
// Seoul production → Sydney Tesla charging
const swap = await sdk.swap({
  source: 'YEONGDONG-001',
  target: 'AEMO-VIC-001',
  amount: 1000,
  useCase: 'Tesla Supercharger Payment',
});

console.log(`Swapped ${swap.source.kwhDeposited} kWh → ${swap.target.kwhReceived} kWh`);
console.log(`NXUSD Value: $${swap.economics.nxusdValue}`);
console.log(`Swap Rate: ${swap.economics.swapRate}`);
```

---

### 3. attest() - Sovereign Certification Generation

Attest energy production and generate sovereign certification with full compliance.

```typescript
const result = await sdk.attest(input: AttestInput): Promise<AttestResult>;
```

**Input:**
```typescript
interface AttestInput {
  nodeId: string;
  kwhProduced: number;
  sourceType: string;         // 'solar' | 'wind' | 'hydro' | 'biomass'
  countryCode?: string;       // ISO country code

  meterReadings?: {           // For HARD-BACKING validation
    before: number;
    after: number;
    gridOperator: string;
  };

  inverterReadings?: Array<{
    inverterId: string;
    voltage: number;
    current: number;
    frequency: number;
    powerFactor: number;
    temperature: number;
  }>;
}
```

**Output:**
```typescript
interface AttestResult {
  success: boolean;
  watermarkId: string;
  attestationId: string;

  energy: {
    nodeId: string;
    sourceType: string;
    kwhAttested: number;
    productionTimestamp: string;
  };

  gridInjection: {
    proofId: string;
    meterDelta: number;
    gridOperator: string;
    verified: boolean;
  };

  sovereignCertification: {
    certificationId: string;
    certificationHash: string;
    expiresAt: string;

    compliance: {
      re100: { status: string; certificationId: string };
      cbam: { status: string; carbonAdjustment: number };
      esg: { rating: string; score: number };
      ghgProtocol: { status: string; scope2Emissions: number };
      sbti: { validationStatus: string; targetType: string };
    };
  };

  permanentRecord: {
    ipfsHash: string;
    arweaveId: string;
    polygonTxHash: string;
    polygonBlockNumber: number;
  };

  royaltyEarning: {
    estimatedEarnings: number;
    perVerification: number;
    currency: 'NXUSD';
  };
}
```

**Example:**
```typescript
const cert = await sdk.attest({
  nodeId: 'YEONGDONG-001',
  kwhProduced: 5000,
  sourceType: 'solar',
  countryCode: 'KR',
  meterReadings: {
    before: 1000000,
    after: 1005000,
    gridOperator: 'KEPCO',
  },
});

console.log(`Certification: ${cert.sovereignCertification.certificationId}`);
console.log(`ESG Rating: ${cert.sovereignCertification.compliance.esg.rating}`);
console.log(`Estimated Earnings: $${cert.royaltyEarning.estimatedEarnings}/year`);
```

---

## Compliance Frameworks

The SDK automatically validates energy against global compliance frameworks:

| Framework | Description | Validation |
|-----------|-------------|------------|
| **RE100** | 100% renewable electricity commitment | Source type verification |
| **CBAM** | EU Carbon Border Adjustment Mechanism | Carbon intensity calculation |
| **ESG** | Environmental, Social, Governance | Comprehensive scoring (AAA-CCC) |
| **GHG Protocol** | Greenhouse Gas Accounting | Scope 1, 2, 3 emissions |
| **SBTi** | Science Based Targets initiative | 1.5°C alignment validation |

---

## Markets & Nodes

### Supported Markets

| Market | Region | Currency | Trading Hours |
|--------|--------|----------|---------------|
| JEPX | Japan/Korea | JPY | 09:00-15:00 JST |
| PJM | USA East | USD | 24/7 |
| AEMO | Australia | AUD | 24/7 |
| EPEX | Europe | EUR | 24/7 |

### Available Nodes

```typescript
const nodes = await sdk.listNodes({
  region: 'Asia',
  sourceType: 'solar',
  status: 'active',
});
```

---

## Configuration

```typescript
interface SDKConfig {
  apiKey: string;              // Required: API key (fn_epo_...)
  baseUrl?: string;            // API base URL
  environment?: 'production' | 'sandbox' | 'local';
  timeout?: number;            // Request timeout (ms)
  retryAttempts?: number;      // Retry count
  enableCompliance?: boolean;  // Enable compliance checks
  defaultCountry?: string;     // Default country code
  webhookUrl?: string;         // Webhook URL
  debug?: boolean;             // Debug logging
}
```

---

## Authentication

All API requests require authentication via API key:

```typescript
const sdk = new FieldNineSDK({
  apiKey: 'fn_epo_your_api_key',
});
```

### API Key Tiers

| Tier | Rate Limit | Royalty Rate | Features |
|------|------------|--------------|----------|
| Standard | 100/min | $0.001/verify | Basic |
| Premium | 500/min | $0.0008/verify | + Batch, Streaming |
| Enterprise | 2000/min | $0.0005/verify | + Custom integration |
| Sovereign | Unlimited | $0.0003/verify | + White-label |

---

## Error Handling

```typescript
try {
  const result = await sdk.verify(watermarkId);
} catch (error) {
  if (error.code === 'INVALID_WATERMARK') {
    console.error('Invalid watermark format');
  } else if (error.code === 'RATE_LIMITED') {
    console.error(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error.code === 'AUTHENTICATION_FAILED') {
    console.error('Invalid API key');
  }
}
```

---

## AI Agent Integration

The SDK provides a machine-readable contract interface for AI agents:

```typescript
// Get capability discovery document
const discovery = await fetch('/api/epo/machine-contract?action=discovery');

// Register AI agent
const registration = await sdk.registerAgent({
  agentId: 'my-ai-agent',
  agentType: 'autonomous',
});

// Execute agent request
const response = await sdk.processAgentRequest({
  agentId: 'my-ai-agent',
  intentType: 'verify',
  parameters: { watermarkId: '...' },
  constraints: { maxCost: 0.01 },
});
```

---

## Royalty Distribution

Every verification generates micro-royalties:

| Recipient | Share |
|-----------|-------|
| Node Operator | 70% |
| Protocol Treasury | 20% |
| Validators | 7% |
| Community Pool | 3% |

---

## Security

The SDK includes built-in protection against:

- Double-spending / replay attacks
- Fraudulent attestations
- Market manipulation
- Anomalous trading patterns
- API abuse / DDoS

All critical transactions are validated through the Quarantine Protection System.

---

## Support

- **Documentation**: https://docs.fieldnine.io
- **API Reference**: https://api.fieldnine.io/docs
- **GitHub**: https://github.com/fieldnine/energy-sdk
- **Discord**: https://discord.gg/fieldnine
- **Email**: api@fieldnine.io

---

## License

Apache 2.0

---

**Field Nine Solutions**
*The Global Standard for Energy Verification*
