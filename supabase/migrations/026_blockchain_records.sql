-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 57: BLOCKCHAIN RECORDS SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Tables for storing blockchain transaction records, wallet connections,
-- and on-chain activity tracking
--
-- Execute in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CONNECTED WALLETS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores user wallet connections with verification status

CREATE TABLE IF NOT EXISTS connected_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Wallet information
  wallet_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  connector_type VARCHAR(50) NOT NULL, -- 'MetaMask', 'WalletConnect', 'Coinbase'

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  signature_hash TEXT, -- Signature used for verification

  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_connected_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, wallet_address, chain_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_connected_wallets_user_id ON connected_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_wallets_address ON connected_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_connected_wallets_chain ON connected_wallets(chain_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. BLOCKCHAIN TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores all blockchain transactions related to KAUS operations

CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Transaction identifiers
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL,
  block_number BIGINT,

  -- Transaction details
  tx_type VARCHAR(50) NOT NULL, -- 'SETTLEMENT', 'STAKE', 'UNSTAKE', 'BRIDGE', 'TRANSFER'
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,

  -- Token info
  token_address VARCHAR(42),
  token_symbol VARCHAR(20),
  amount DECIMAL(38, 18) NOT NULL,
  amount_usd DECIMAL(15, 2),

  -- Gas info
  gas_used BIGINT,
  gas_price_gwei DECIMAL(15, 9),
  gas_cost_eth DECIMAL(30, 18),
  gas_cost_usd DECIMAL(15, 2),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'FAILED'
  confirmations INTEGER DEFAULT 0,
  error_message TEXT,

  -- Timing
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,

  -- Related records
  settlement_id VARCHAR(50), -- Link to kaus_settlements

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_user_id ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_type ON blockchain_transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_chain ON blockchain_transactions(chain_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_from ON blockchain_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_submitted ON blockchain_transactions(submitted_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. STAKING POSITIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Tracks user staking positions

CREATE TABLE IF NOT EXISTS staking_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES connected_wallets(id) ON DELETE SET NULL,

  -- Position details
  chain_id INTEGER NOT NULL,
  vault_address VARCHAR(42) NOT NULL,

  -- Amounts
  staked_amount DECIMAL(38, 18) NOT NULL DEFAULT 0,
  rewards_earned DECIMAL(38, 18) NOT NULL DEFAULT 0,
  rewards_claimed DECIMAL(38, 18) NOT NULL DEFAULT 0,

  -- APY info
  current_apy DECIMAL(8, 4), -- e.g., 12.5000%

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'UNSTAKING', 'CLOSED'

  -- Timing
  staked_at TIMESTAMPTZ DEFAULT NOW(),
  last_reward_at TIMESTAMPTZ,
  unlock_at TIMESTAMPTZ, -- For time-locked staking

  -- Transaction links
  stake_tx_hash VARCHAR(66),
  unstake_tx_hash VARCHAR(66),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_status ON staking_positions(status);
CREATE INDEX IF NOT EXISTS idx_staking_positions_chain ON staking_positions(chain_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. NFT HOLDINGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Tracks Field Nine NFTs (achievements, badges, etc.)

CREATE TABLE IF NOT EXISTS nft_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES connected_wallets(id) ON DELETE SET NULL,

  -- NFT identifiers
  contract_address VARCHAR(42) NOT NULL,
  token_id VARCHAR(100) NOT NULL,
  chain_id INTEGER NOT NULL,

  -- NFT type
  nft_type VARCHAR(50) NOT NULL, -- 'ACHIEVEMENT', 'MEMBERSHIP', 'BADGE', 'COLLECTIBLE'

  -- Metadata
  name VARCHAR(255),
  description TEXT,
  image_url TEXT,
  attributes JSONB DEFAULT '[]',

  -- Acquisition info
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  acquisition_tx_hash VARCHAR(66),
  acquisition_type VARCHAR(30), -- 'MINT', 'AIRDROP', 'PURCHASE', 'TRANSFER'

  -- Status
  is_burned BOOLEAN DEFAULT FALSE,
  burned_at TIMESTAMPTZ,
  burn_tx_hash VARCHAR(66),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(contract_address, token_id, chain_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nft_holdings_user_id ON nft_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_holdings_contract ON nft_holdings(contract_address);
CREATE INDEX IF NOT EXISTS idx_nft_holdings_type ON nft_holdings(nft_type);
CREATE INDEX IF NOT EXISTS idx_nft_holdings_chain ON nft_holdings(chain_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. BRIDGE TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Tracks cross-chain bridge transactions

CREATE TABLE IF NOT EXISTS bridge_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source chain
  source_chain_id INTEGER NOT NULL,
  source_tx_hash VARCHAR(66) NOT NULL,
  source_address VARCHAR(42) NOT NULL,

  -- Destination chain
  dest_chain_id INTEGER NOT NULL,
  dest_tx_hash VARCHAR(66),
  dest_address VARCHAR(42) NOT NULL,

  -- Amount
  token_address VARCHAR(42) NOT NULL,
  token_symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(38, 18) NOT NULL,
  amount_received DECIMAL(38, 18),
  bridge_fee DECIMAL(38, 18),

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'INITIATED', -- 'INITIATED', 'PENDING', 'COMPLETED', 'FAILED'

  -- Timing
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Bridge provider
  bridge_provider VARCHAR(50), -- 'LayerZero', 'Wormhole', 'Native'
  bridge_message_id TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bridge_tx_user_id ON bridge_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_tx_status ON bridge_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bridge_tx_source ON bridge_transactions(source_chain_id);
CREATE INDEX IF NOT EXISTS idx_bridge_tx_dest ON bridge_transactions(dest_chain_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. TVL SNAPSHOTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Historical TVL data for charts and analytics

CREATE TABLE IF NOT EXISTS tvl_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamp (one snapshot per hour)
  snapshot_at TIMESTAMPTZ NOT NULL,

  -- Chain
  chain_id INTEGER NOT NULL,

  -- TVL breakdown
  total_tvl_usd DECIMAL(20, 2) NOT NULL,
  staking_vault_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
  liquidity_pool_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
  treasury_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,

  -- Token prices at snapshot time
  eth_price_usd DECIMAL(15, 2),
  kaus_price_usd DECIMAL(15, 6),

  -- Metadata
  source VARCHAR(30) DEFAULT 'ALCHEMY',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(snapshot_at, chain_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tvl_snapshots_time ON tvl_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_tvl_snapshots_chain ON tvl_snapshots(chain_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE connected_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tvl_snapshots ENABLE ROW LEVEL SECURITY;

-- Connected Wallets: Users can only see their own wallets
CREATE POLICY "Users can view own wallets"
  ON connected_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
  ON connected_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON connected_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets"
  ON connected_wallets FOR DELETE
  USING (auth.uid() = user_id);

-- Blockchain Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON blockchain_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
  ON blockchain_transactions FOR INSERT
  WITH CHECK (true);

-- Staking Positions: Users can view their own positions
CREATE POLICY "Users can view own staking positions"
  ON staking_positions FOR SELECT
  USING (auth.uid() = user_id);

-- NFT Holdings: Users can view their own NFTs
CREATE POLICY "Users can view own NFTs"
  ON nft_holdings FOR SELECT
  USING (auth.uid() = user_id);

-- Bridge Transactions: Users can view their own bridge transactions
CREATE POLICY "Users can view own bridge transactions"
  ON bridge_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- TVL Snapshots: Public read access
CREATE POLICY "Anyone can view TVL snapshots"
  ON tvl_snapshots FOR SELECT
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_blockchain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_connected_wallets_updated
  BEFORE UPDATE ON connected_wallets
  FOR EACH ROW EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER trigger_blockchain_transactions_updated
  BEFORE UPDATE ON blockchain_transactions
  FOR EACH ROW EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER trigger_staking_positions_updated
  BEFORE UPDATE ON staking_positions
  FOR EACH ROW EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER trigger_nft_holdings_updated
  BEFORE UPDATE ON nft_holdings
  FOR EACH ROW EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER trigger_bridge_transactions_updated
  BEFORE UPDATE ON bridge_transactions
  FOR EACH ROW EXECUTE FUNCTION update_blockchain_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE 'PHASE 57: Blockchain Records Schema - Successfully Created!';
  RAISE NOTICE 'Tables: connected_wallets, blockchain_transactions, staking_positions, nft_holdings, bridge_transactions, tvl_snapshots';
END $$;
