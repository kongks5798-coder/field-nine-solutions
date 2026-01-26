-- ═══════════════════════════════════════════════════════════════════════════════
-- KAUS Settlements Schema - Production Grade
-- Phase 54: Zero Fake Data Implementation
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create settlements table
CREATE TABLE IF NOT EXISTS kaus_settlements (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL,
    kaus_amount DECIMAL(20, 8) NOT NULL,
    fiat_amount DECIMAL(20, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KRW',
    exchange_rate DECIMAL(20, 8) NOT NULL,
    payment_method TEXT NOT NULL,
    network_fee DECIMAL(20, 2) DEFAULT 0,
    processing_fee DECIMAL(20, 2) DEFAULT 0,
    total_fee DECIMAL(20, 2) DEFAULT 0,
    destination TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add locked_balance column to wallets if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'wallets' AND column_name = 'locked_balance'
    ) THEN
        ALTER TABLE wallets ADD COLUMN locked_balance DECIMAL(20, 8) DEFAULT 0;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kaus_settlements_user ON kaus_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_kaus_settlements_status ON kaus_settlements(status);
CREATE INDEX IF NOT EXISTS idx_kaus_settlements_created ON kaus_settlements(created_at DESC);

-- RLS
ALTER TABLE kaus_settlements ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role has full access to kaus_settlements"
    ON kaus_settlements FOR ALL
    USING (auth.role() = 'service_role');

-- Users can only view their own settlements
CREATE POLICY "Users can view own settlements"
    ON kaus_settlements FOR SELECT
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_kaus_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kaus_settlements_updated_at ON kaus_settlements;
CREATE TRIGGER kaus_settlements_updated_at
    BEFORE UPDATE ON kaus_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_kaus_settlements_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW kaus_settlement_summary AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_requests,
    SUM(kaus_amount) as total_kaus,
    SUM(fiat_amount) as total_fiat,
    currency,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) as processing,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
FROM kaus_settlements
GROUP BY DATE_TRUNC('day', created_at), currency
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Process Settlement Completion
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION complete_kaus_settlement(
    p_settlement_id TEXT,
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_settlement RECORD;
    v_wallet RECORD;
BEGIN
    -- Get settlement
    SELECT * INTO v_settlement
    FROM kaus_settlements
    WHERE id = p_settlement_id AND status = 'PROCESSING'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Settlement not found or not processing');
    END IF;

    -- Get wallet
    SELECT * INTO v_wallet
    FROM wallets
    WHERE id = v_settlement.wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;

    -- Deduct from balance and unlock
    UPDATE wallets
    SET
        balance = balance - v_settlement.kaus_amount,
        locked_balance = locked_balance - v_settlement.kaus_amount,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    -- Mark settlement complete
    UPDATE kaus_settlements
    SET
        status = 'COMPLETED',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_settlement_id;

    RETURN jsonb_build_object(
        'success', true,
        'settlement_id', p_settlement_id,
        'kaus_amount', v_settlement.kaus_amount,
        'fiat_amount', v_settlement.fiat_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Cancel Settlement (with rollback)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION cancel_kaus_settlement(
    p_settlement_id TEXT,
    p_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS JSONB AS $$
DECLARE
    v_settlement RECORD;
BEGIN
    -- Get settlement
    SELECT * INTO v_settlement
    FROM kaus_settlements
    WHERE id = p_settlement_id AND status = 'PROCESSING'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Settlement not found or not processing');
    END IF;

    -- Unlock funds (rollback)
    UPDATE wallets
    SET
        locked_balance = locked_balance - v_settlement.kaus_amount,
        updated_at = NOW()
    WHERE id = v_settlement.wallet_id;

    -- Mark settlement cancelled
    UPDATE kaus_settlements
    SET
        status = 'CANCELLED',
        cancelled_at = NOW(),
        cancelled_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_settlement_id;

    RETURN jsonb_build_object(
        'success', true,
        'settlement_id', p_settlement_id,
        'refunded_kaus', v_settlement.kaus_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
