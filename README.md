# K-Universal

> **Production-grade passport e-KYC verification and Ghost Wallet system**  
> Built with Tesla/Apple-level standards

## 🚀 Features

- 🛂 **Passport OCR & e-KYC**: Real-time passport scanning with MRZ extraction
- 👻 **Ghost Wallet**: Non-custodial crypto wallet with biometric authentication
- 🗺️ **Geospatial Dashboard**: Google Maps integration for location-based services
- 🔐 **Zero-trust Security**: End-to-end encryption, secure enclave storage

## 🛠️ Tech Stack

- **Frontend**: Next.js 14/15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI/OCR**: Tesseract.js, OpenAI GPT-4 Vision
- **Blockchain**: Ethers.js, WalletConnect
- **Infrastructure**: Docker, Cloudflare Tunnel

## 📦 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your actual credentials
```

### 3. Setup Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Run the schema from `supabase/migrations/schema_k_universal_v1.sql`
4. Create storage buckets: `passport-images`, `kyc-documents`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t k-universal .

# Run container
docker run -p 3000:3000 k-universal
```

## 📁 Project Structure

```
k-universal/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main dashboard
│   ├── (kyc)/             # e-KYC flow
│   └── (wallet)/          # Ghost Wallet UI
├── components/            # React components
│   ├── ui/                # Shadcn primitives
│   ├── kyc/               # KYC components
│   └── wallet/            # Wallet components
├── lib/                   # Utilities & clients
│   ├── supabase/          # Database client
│   ├── ocr/               # Passport OCR engine
│   └── crypto/            # Wallet cryptography
└── supabase/              # Database migrations
```

## 🔐 Security

- **AES-256 encryption** for all sensitive data
- **Row Level Security (RLS)** on all database tables
- **Biometric authentication** via WebAuthn
- **7-year audit logs** for compliance (GDPR, KYC/AML)

## 📊 Database Schema

See `supabase/migrations/schema_k_universal_v1.sql` for full schema.

Key tables:
- `profiles` - User profiles with KYC status
- `passport_data` - Encrypted passport information
- `ghost_wallets` - Non-custodial wallet storage
- `wallet_transactions` - Transaction history
- `kyc_audit_logs` - Compliance audit trail

## 🎨 Design System

- **Primary Background**: `#F9F9F7` (warm white)
- **Accent Color**: `#0066FF` (trust blue)
- **Success**: `#00C853` (verified green)
- **Error**: `#FF3B30` (alert red)
- **Typography**: Inter font family
- **Spacing**: 8px grid system

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the team for collaboration opportunities.

---

**Built by Field Nine Solutions**  
CTO: Jarvis AI | 2026
