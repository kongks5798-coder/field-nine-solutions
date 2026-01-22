# FIELD NINE ENERGY PROOF-OF-ORIGIN (EPO) API SPECIFICATION

**Version**: 1.0.0
**Base URL**: `https://api.fieldnine.io/epo/v1`
**Status**: PRODUCTION READY
**Date**: 2026-01-22

---

## OVERVIEW

The Energy Proof-of-Origin (EPO) Protocol provides cryptographically verifiable provenance for every kWh of energy produced. Like SWIFT for international banking, EPO becomes the global standard for energy verification.

### Key Features

- **Real-time Attestation**: Energy is watermarked at the moment of production
- **Zero-Knowledge Proofs**: Protect commercial secrets while proving authenticity
- **Polygon Mainnet**: Immutable on-chain storage
- **Micro-Royalties**: $0.001 NXUSD per verification

---

## AUTHENTICATION

All API requests require an API key passed in the `Authorization` header:

```http
Authorization: Bearer fn_epo_your_api_key_here
```

### Obtaining an API Key

1. Register at [epo.fieldnine.io](https://epo.fieldnine.io)
2. Select your pricing tier
3. API key is generated immediately

### Pricing Tiers

| Tier | Rate/Verification | Monthly Limit | Monthly Fee |
|------|-------------------|---------------|-------------|
| Standard | $0.001 | 10,000 | Free |
| Premium | $0.0008 | 100,000 | $99 |
| Enterprise | $0.0005 | 1,000,000 | $999 |
| Sovereign | $0.0003 | Unlimited | $4,999 |

---

## ENDPOINTS

### 1. VERIFY WATERMARK

Verify the authenticity of an energy watermark. **Each call charges a royalty.**

```http
POST /api/epo/verify
```

#### Request Body

```json
{
  "watermarkId": "EPO-YEONGDONG-001-1706000000-A1B2C3D4"
}
```

#### Response (Success)

```json
{
  "valid": true,
  "watermarkId": "EPO-YEONGDONG-001-1706000000-A1B2C3D4",
  "nodeId": "YEONGDONG-001",
  "sourceType": "solar",
  "kwhAttested": 42.5,
  "attestationTime": "2026-01-22T10:30:00Z",
  "polygonTxHash": "0x1a2b3c4d5e6f...",
  "royaltyCharged": 0.001,
  "verificationProof": "0xproof...",
  "metadata": {
    "region": "Gangwon-do, South Korea",
    "certificationLevel": "SOVEREIGN_CERTIFIED",
    "carbonOffset": 20.19
  },
  "royaltyTransaction": {
    "transactionId": "RTX-1706000000-abc123",
    "amount": 0.001,
    "currency": "NXUSD"
  }
}
```

#### Batch Verification

```http
POST /api/epo/verify
```

```json
{
  "watermarkIds": [
    "EPO-YEONGDONG-001-1706000000-A1B2C3D4",
    "EPO-YEONGDONG-001-1706000001-B2C3D4E5",
    "EPO-JEJU-001-1706000002-C3D4E5F6"
  ]
}
```

#### Batch Response

```json
{
  "success": true,
  "batch": true,
  "results": [...],
  "totalValid": 3,
  "totalInvalid": 0,
  "totalRoyaltyCharged": 0.003,
  "batchId": "BATCH-1706000000"
}
```

---

### 2. CREATE ATTESTATION

Submit energy production data for watermarking. **Node Operator only.**

```http
POST /api/epo/attest
```

#### Request Body

```json
{
  "nodeId": "YEONGDONG-001",
  "kwhProduced": 42.5,
  "sourceType": "solar",
  "inverterReadings": [
    {
      "inverterId": "INV-001",
      "voltage": 385.2,
      "current": 128.5,
      "frequency": 60.02,
      "powerFactor": 0.99,
      "temperature": 38.5
    }
  ],
  "weatherConditions": {
    "irradiance": 920,
    "temperature": 28,
    "humidity": 52
  }
}
```

#### Response

```json
{
  "success": true,
  "watermarkId": "EPO-YEONGDONG-001-1706000000-A1B2C3D4",
  "nodeId": "YEONGDONG-001",
  "kwhAttested": 42.5,
  "proofHash": "0xmerkle_root...",
  "status": "pending",
  "estimatedConfirmation": "~15 seconds (next batch)",
  "zkProof": {
    "commitment": "0xcommitment...",
    "nullifier": "0xnullifier...",
    "publicInputs": ["YEONGDONG-001", "solar", "1706000000", "42"]
  },
  "polygon": {
    "network": "mainnet",
    "pendingAttestation": true
  }
}
```

---

### 3. ROYALTY MANAGEMENT

#### Get Balance

```http
GET /api/epo/royalty?action=balance&nodeId=YEONGDONG-001
```

```json
{
  "nodeId": "YEONGDONG-001",
  "pendingRoyalties": 125.50,
  "totalEarned": 12847.50,
  "totalVerifications": 12847500,
  "lastSettlement": "2026-01-21T00:00:00Z",
  "currency": "NXUSD",
  "distribution": {
    "nodeOperator": 70,
    "fieldNineProtocol": 20,
    "epoValidators": 7,
    "communityPool": 3
  }
}
```

#### Get Transactions

```http
GET /api/epo/royalty?action=transactions&nodeId=YEONGDONG-001&limit=50
```

```json
{
  "nodeId": "YEONGDONG-001",
  "transactions": [
    {
      "transactionId": "RTX-1706000000-abc123",
      "timestamp": "2026-01-22T10:30:00Z",
      "type": "verification",
      "amount": 0.001,
      "currency": "NXUSD",
      "status": "settled",
      "watermarkId": "EPO-YEONGDONG-001-1706000000-A1B2C3D4"
    }
  ],
  "total": 12847500
}
```

#### Settle Royalties

```http
POST /api/epo/royalty
```

```json
{
  "action": "settle",
  "nodeId": "YEONGDONG-001"
}
```

```json
{
  "success": true,
  "nodeId": "YEONGDONG-001",
  "settledAmount": 125.50,
  "currency": "NXUSD",
  "polygonTxHash": "0xsettlement_tx...",
  "settlementTime": "2026-01-22T12:00:00Z"
}
```

---

### 4. NODE MANAGEMENT

#### List Certified Nodes

```http
GET /api/epo/nodes?action=list&region=Korea&sourceType=solar
```

```json
{
  "nodes": [
    {
      "nodeId": "YEONGDONG-001",
      "name": "Yeongdong Energy Node #1",
      "region": "Gangwon-do, South Korea",
      "capacity": 50000,
      "sourceType": "solar",
      "certificationLevel": "SOVEREIGN_CERTIFIED",
      "status": "active"
    }
  ],
  "total": 3,
  "summary": {
    "totalCapacity": 100000,
    "byType": { "solar": 2, "wind": 1 },
    "byStatus": { "active": 3, "pending": 0 }
  }
}
```

#### Get Node Details

```http
GET /api/epo/nodes?action=detail&nodeId=YEONGDONG-001
```

```json
{
  "node": {
    "nodeId": "YEONGDONG-001",
    "name": "Yeongdong Energy Node #1",
    "region": "Gangwon-do, South Korea",
    "capacity": 50000,
    "sourceType": "solar",
    "certificationLevel": "SOVEREIGN_CERTIFIED",
    "coordinates": { "lat": 37.1845, "lng": 128.9180 },
    "operator": "Field Nine Solutions",
    "gridConnection": "KEPCO-154kV"
  },
  "stats": {
    "totalWatermarks": 2847500,
    "totalKwhAttested": 142375000,
    "totalRoyaltiesEarned": 12847.50,
    "totalVerifications": 12847500
  }
}
```

#### Sovereign Node Info

```http
GET /api/epo/nodes?action=sovereign
```

```json
{
  "certification": {
    "type": "SOVEREIGN_CERTIFIED",
    "description": "Global First EPO Sovereign Node",
    "issuedTo": "YEONGDONG-001",
    "privileges": [
      "Global first mover recognition",
      "Protocol governance voting",
      "Revenue sharing participation",
      "Priority support"
    ]
  },
  "liveStats": {
    "currentGeneration": 47500,
    "dailyGeneration": 285000,
    "monthlyGeneration": 8500000,
    "carbonOffset": 48450000
  }
}
```

---

## SDK INSTALLATION

### JavaScript/TypeScript

```bash
npm install @fieldnine/energy-sdk
```

```typescript
import { FieldNineEPO } from '@fieldnine/energy-sdk';

const epo = new FieldNineEPO({
  apiKey: 'fn_epo_your_api_key',
  environment: 'production'
});

// Verify a watermark
const result = await epo.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4');

// Batch verification
const batch = await epo.verifyBatch([
  'EPO-YEONGDONG-001-1706000000-A1B2C3D4',
  'EPO-JEJU-001-1706000001-B2C3D4E5'
]);

// Stream real-time verifications
const unsubscribe = epo.streamVerifications('YEONGDONG-001', (event) => {
  console.log(`New attestation: ${event.kwhAttested} kWh`);
});
```

### Python

```bash
pip install fieldnine-epo
```

```python
from fieldnine import EPOClient

epo = EPOClient(api_key='fn_epo_your_api_key')

# Verify
result = epo.verify('EPO-YEONGDONG-001-1706000000-A1B2C3D4')
print(f"Valid: {result.valid}, kWh: {result.kwh_attested}")
```

### cURL

```bash
curl -X POST https://api.fieldnine.io/epo/v1/verify \
  -H "Authorization: Bearer fn_epo_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"watermarkId": "EPO-YEONGDONG-001-1706000000-A1B2C3D4"}'
```

---

## WATERMARK ID FORMAT

```
EPO-{NodeId}-{Timestamp}-{Hash8}
```

| Component | Description | Example |
|-----------|-------------|---------|
| Prefix | Always "EPO" | EPO |
| NodeId | Certified node identifier | YEONGDONG-001 |
| Timestamp | Unix timestamp (seconds) | 1706000000 |
| Hash8 | First 8 chars of keccak256 | A1B2C3D4 |

Example: `EPO-YEONGDONG-001-1706000000-A1B2C3D4`

---

## WEBHOOKS

Receive real-time notifications for attestations and verifications.

### Register Webhook

```http
POST /api/epo/webhooks
```

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["attestation", "verification", "settlement"]
}
```

### Webhook Payload

```json
{
  "eventType": "verification",
  "timestamp": "2026-01-22T10:30:00Z",
  "data": {
    "watermarkId": "EPO-YEONGDONG-001-1706000000-A1B2C3D4",
    "consumerId": "tesla-supercharger",
    "royaltyAmount": 0.001
  },
  "signature": "sha256_hmac_signature"
}
```

---

## RATE LIMITS

| Tier | Requests/Second | Requests/Day |
|------|-----------------|--------------|
| Standard | 10 | 10,000 |
| Premium | 50 | 100,000 |
| Enterprise | 200 | 1,000,000 |
| Sovereign | Unlimited | Unlimited |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9850
X-RateLimit-Reset: 1706054400
```

---

## ERROR CODES

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Watermark or node not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

Error Response Format:

```json
{
  "error": "Not Found",
  "message": "Watermark EPO-INVALID-001 not found",
  "code": 404,
  "timestamp": "2026-01-22T10:30:00Z"
}
```

---

## SECURITY

### Zero-Knowledge Proofs

EPO uses Pedersen commitments and simplified SNARKs to prove energy production without revealing:
- Exact financial terms
- Equipment configurations
- Operational parameters

### Polygon Integration

- Network: Polygon Mainnet
- Contract: `0xFieldNineEPO...` (TBD)
- Batch attestations every 15 seconds
- Merkle proofs for efficient verification

---

## SUPPORT

- **Documentation**: https://docs.fieldnine.io/epo
- **API Status**: https://status.fieldnine.io
- **Email**: epo-support@fieldnine.io
- **Discord**: https://discord.gg/fieldnine

---

## CHANGELOG

### v1.0.0 (2026-01-22)
- Initial release
- Digital Watermark Engine
- Global Royalty System
- Yeongdong Node #1 Sovereign Certification

---

**Field Nine Solutions | Energy Proof-of-Origin Protocol**
*The Global Standard for Energy Verification*
