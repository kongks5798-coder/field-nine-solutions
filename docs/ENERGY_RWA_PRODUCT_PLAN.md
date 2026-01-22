# FIELD NINE ENERGY RWA PRODUCT PLAN

**Document ID**: `RWA-PLAN-20260122`
**Version**: 1.0.0
**Status**: LAUNCH READY
**Date**: 2026-01-22

---

## EXECUTIVE SUMMARY

Field Nine Energy RWA (Real World Asset) Launchpad enables fractional investment in renewable energy infrastructure, allowing retail investors to earn passive income from solar farms, ESS units, and wind farms through blockchain-verified yield distribution.

---

## 1. PRODUCT OVERVIEW

### 1.1 Vision

**"Democratizing Clean Energy Investment"**

Making institutional-grade renewable energy investments accessible to everyone through blockchain tokenization and transparent yield verification.

### 1.2 Value Proposition

| Stakeholder | Value |
|-------------|-------|
| **Investors** | Access to 8-15% APY from real energy assets |
| **Asset Owners** | Capital access without giving up ownership |
| **Environment** | Accelerated clean energy deployment |
| **Field Nine** | Platform fees + ecosystem growth |

---

## 2. FLAGSHIP PRODUCT: FIELD NINE SOLAR #1

### 2.1 Asset Details

| Parameter | Value |
|-----------|-------|
| **Asset Name** | Field Nine Solar Farm #1 |
| **Asset ID** | SOLAR-KR-001 |
| **Location** | Jeolla-do, South Korea |
| **Coordinates** | 35.1595°N, 126.8526°E |
| **Installed Capacity** | 5,000 kW (5 MW) |
| **Effective Capacity** | 4,750 kW |
| **Technology** | Monocrystalline Silicon PV |
| **Inverter** | String Inverter (SMA) |
| **Connection** | KEPCO Grid (154kV) |

### 2.2 Financial Model

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Investment** | $4,500,000 | Land + Equipment + Installation |
| **Annual Generation** | 6,660,000 kWh | Based on 15.2% capacity factor |
| **Tariff Rate** | $0.12/kWh | KEPCO REC + SMP |
| **Subsidy Rate** | $0.03/kWh | Government renewable subsidy |
| **Gross Revenue** | $998,460/year | 6.66M kWh × $0.15/kWh |
| **Operating Cost** | $45,000/year | Maintenance + Insurance |
| **Net Income** | $953,460/year | Before tax |
| **ROI** | 21.2%/year | Gross return |
| **Investor Yield** | 12.8%/year | After platform fee (80% distribution) |

### 2.3 Token Economics

| Parameter | Value |
|-----------|-------|
| **Token Name** | Field Nine Solar Token #1 |
| **Symbol** | FNSOL1 |
| **Token Standard** | ERC-20 (Polygon) |
| **Total Supply** | 45,000 tokens |
| **Price Per Token** | $100 NXUSD |
| **Target Raise** | $4,500,000 |
| **Minimum Investment** | $100 (1 token) |
| **Maximum Investment** | $50,000 (500 tokens) |

### 2.4 Dividend Schedule

| Frequency | Per Token | Annual |
|-----------|-----------|--------|
| Monthly | $1.07 | $12.80 |
| Quarterly | $3.20 | $12.80 |
| Annual | - | $12.80 |

**Distribution Rate**: 80% of net income to token holders
**Platform Fee**: 20% of net income retained by Field Nine

---

## 3. PRODUCT LINEUP

### 3.1 Current Products

| Product | Type | Location | Capacity | APY | Status |
|---------|------|----------|----------|-----|--------|
| FNSOL1 | Solar | Korea | 5 MW | 12.8% | Fundraising |
| FNESS1 | ESS | Korea | 2 MW | 9.5% | Fundraising |
| FNWND1 | Wind | Australia | 10 MW | 8.2% | Fundraising |

### 3.2 Planned Products (2026)

| Product | Type | Location | Capacity | Target APY | Launch |
|---------|------|----------|----------|------------|--------|
| FNSOL2 | Solar | Japan | 10 MW | 11.5% | Q2 2026 |
| FNHYD1 | Hydro | Korea | 3 MW | 10.2% | Q3 2026 |
| FNWND2 | Wind | Germany | 15 MW | 9.8% | Q3 2026 |
| FNBIO1 | Biomass | Vietnam | 5 MW | 13.5% | Q4 2026 |

---

## 4. TECHNOLOGY ARCHITECTURE

### 4.1 Energy Oracle System

```
┌─────────────────────────────────────────────────────────────┐
│                    ENERGY ORACLE NETWORK                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │ Node 1      │    │ Node 2      │    │ Node 3      │   │
│   │ (Primary)   │    │ (Secondary) │    │ (Validator) │   │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   │
│          │                  │                   │          │
│          └──────────────────┼───────────────────┘          │
│                             │                              │
│                   ┌─────────┴─────────┐                    │
│                   │  CONSENSUS LAYER  │                    │
│                   │  (3/5 Agreement)  │                    │
│                   └─────────┬─────────┘                    │
│                             │                              │
│   ┌─────────────────────────┴─────────────────────────┐   │
│   │              POLYGON BLOCKCHAIN                    │   │
│   │  - Yield Attestation Contract                     │   │
│   │  - Token Distribution Contract                    │   │
│   │  - Merkle Proof Verification                      │   │
│   └───────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SCADA/     │    │   Energy     │    │   Smart      │
│   Meter      │───>│   Oracle     │───>│   Contract   │
│   Data       │    │   Network    │    │   (Polygon)  │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
  Real-time         Attestation          On-chain
  Generation        Creation             Dividend
  Monitoring        (Hourly)             Distribution
```

### 4.3 Yield Attestation Process

1. **Data Collection** (Every 15 minutes)
   - SCADA system collects generation data
   - Weather conditions recorded
   - Equipment status monitored

2. **Oracle Aggregation** (Hourly)
   - 5 oracle nodes independently verify data
   - Consensus reached with 3/5 agreement
   - Discrepancies flagged for review

3. **On-chain Recording** (Daily)
   - Daily yield attestation created
   - Merkle proof generated
   - Data committed to Polygon

4. **Dividend Distribution** (Monthly)
   - Net income calculated
   - Token holder snapshot taken
   - NXUSD dividends distributed

---

## 5. INVESTMENT PROCESS

### 5.1 Investor Journey

```
┌────────────────────────────────────────────────────────────┐
│                    INVESTMENT FLOW                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. REGISTRATION                                           │
│     └─> Field Nine Account + KYC Verification              │
│                                                            │
│  2. RESEARCH                                               │
│     └─> Review Asset Details, Financials, Documents        │
│                                                            │
│  3. INVESTMENT                                             │
│     └─> Select Amount (Min $100) -> NXUSD Payment          │
│                                                            │
│  4. TOKEN RECEIPT                                          │
│     └─> RWA Tokens in Wallet (Polygon Network)             │
│                                                            │
│  5. DIVIDEND COLLECTION                                    │
│     └─> Monthly NXUSD Dividends Auto-deposited             │
│                                                            │
│  6. EXIT OPTIONS                                           │
│     └─> Secondary Market Sale OR Wait for Maturity         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Investment Tiers

| Tier | Investment | Tokens | Annual Dividend | Benefits |
|------|------------|--------|-----------------|----------|
| Starter | $100-$999 | 1-9 | $12.80-$115 | Basic access |
| Growth | $1,000-$4,999 | 10-49 | $128-$640 | +5% bonus allocation |
| Premium | $5,000-$19,999 | 50-199 | $640-$2,560 | +10% bonus + priority |
| Institutional | $20,000+ | 200+ | $2,560+ | +15% bonus + direct line |

---

## 6. RISK MANAGEMENT

### 6.1 Risk Factors

| Risk | Mitigation | Impact |
|------|------------|--------|
| **Generation Variance** | Weather insurance, Conservative projections | Medium |
| **Equipment Failure** | Maintenance contracts, Warranty coverage | Low |
| **Regulatory Change** | Diversified markets, Legal monitoring | Medium |
| **Counterparty Risk** | KEPCO (AAA), Government guarantees | Very Low |
| **Smart Contract Risk** | Audited code, Bug bounty program | Low |
| **Liquidity Risk** | Secondary market, Market maker | Medium |

### 6.2 Insurance Coverage

| Coverage | Provider | Amount |
|----------|----------|--------|
| Property | Samsung Fire | $5,000,000 |
| Business Interruption | Samsung Fire | $500,000/year |
| Liability | Meritz | $2,000,000 |
| Directors & Officers | AIG | $1,000,000 |

---

## 7. REGULATORY COMPLIANCE

### 7.1 Licenses & Registrations

| Jurisdiction | Status | Notes |
|--------------|--------|-------|
| South Korea | ✅ | STO Sandbox Approved |
| Australia | 🔄 | AFSL Application Pending |
| Japan | 📋 | Planned Q2 2026 |
| EU (MiCA) | 📋 | Planned Q3 2026 |

### 7.2 Investor Protection

- **Investor Accreditation**: Retail ($100-$50K) / Qualified ($50K+)
- **Disclosure**: Full asset documentation available
- **Audit**: Quarterly third-party financial audit
- **Escrow**: Funds held in escrow until funding target met

---

## 8. ROADMAP

### Q1 2026
- [x] Energy Oracle System Development
- [x] RWA Token Smart Contract
- [x] First Asset Registration (SOLAR-KR-001)
- [ ] Regulatory Approval (Korea STO)
- [ ] FNSOL1 Public Launch

### Q2 2026
- [ ] FNESS1 Launch (ESS Korea)
- [ ] FNSOL2 Launch (Solar Japan)
- [ ] Secondary Market Trading
- [ ] Mobile App Integration

### Q3 2026
- [ ] FNWND1 Launch (Wind Australia)
- [ ] FNHYD1 Launch (Hydro Korea)
- [ ] EU Market Entry (MiCA)
- [ ] Institutional API

### Q4 2026
- [ ] FNBIO1 Launch (Biomass Vietnam)
- [ ] Portfolio Management Tools
- [ ] DeFi Integration (Yield Farming)
- [ ] 10+ Assets Listed

---

## 9. DOCUMENTS

### 9.1 Legal Documents

| Document | Status | Link |
|----------|--------|------|
| Whitepaper | ✅ Ready | `/docs/rwa/FNSOL1/whitepaper.pdf` |
| Financial Model | ✅ Ready | `/docs/rwa/FNSOL1/financial-model.xlsx` |
| Legal Opinion | ✅ Ready | `/docs/rwa/FNSOL1/legal-opinion.pdf` |
| Due Diligence | ✅ Ready | `/docs/rwa/FNSOL1/due-diligence.pdf` |
| Token Agreement | ✅ Ready | `/docs/rwa/FNSOL1/token-agreement.pdf` |

### 9.2 Technical Documents

| Document | Status | Link |
|----------|--------|------|
| Smart Contract Audit | ✅ Passed | `/docs/rwa/audit/certik-audit.pdf` |
| Oracle Architecture | ✅ Ready | `/docs/rwa/oracle-architecture.pdf` |
| Security Assessment | ✅ Ready | `/docs/rwa/security-assessment.pdf` |

---

## 10. API REFERENCE

### 10.1 Investment API

```typescript
// Get product listings
GET /api/rwa/investment?action=listings

// Invest in a token
POST /api/rwa/investment
{
  "action": "invest",
  "userId": "user-123",
  "tokenId": "RWA-SOLAR-KR-001",
  "amount": 1000
}

// Get portfolio
GET /api/rwa/investment?action=portfolio&userId=user-123

// Get dividend history
GET /api/rwa/investment?action=dividends&tokenId=RWA-SOLAR-KR-001
```

### 10.2 Oracle API

```typescript
// Get asset data
GET /api/rwa/oracle?action=asset&id=SOLAR-KR-001

// Get real-time feed
GET /api/rwa/oracle?action=feed

// Create yield attestation
GET /api/rwa/oracle?action=attestation&assetId=SOLAR-KR-001&period=30
```

---

## 11. SUMMARY

Field Nine Energy RWA Launchpad represents a groundbreaking opportunity to democratize clean energy investment. With our first product, **Field Nine Solar #1**, investors can:

- **Invest from $100** in a real 5MW solar farm
- **Earn 12.8% APY** verified by blockchain oracle
- **Receive monthly NXUSD dividends** automatically
- **Track real-time performance** through Energy Oracle
- **Exit anytime** via secondary market

**Launch Date**: Q1 2026
**Target Raise**: $4,500,000
**Expected APY**: 12.8%

---

*Field Nine Solutions | Energy RWA Launchpad*
*Democratizing Clean Energy Investment*
