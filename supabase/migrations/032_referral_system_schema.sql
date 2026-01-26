-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 54: GLOBAL VIRAL REFERRAL SYSTEM - DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Production Grade Referral System:
-- - Unique invite codes per user (FN + 8 chars)
-- - 2% KAUS reward on VRD purchases & staking
-- - Multi-tier bonus system
-- - Anti-fraud protection
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: referral_codes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_earnings ON referral_codes(total_earnings DESC);

-- RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to referral_codes"
    ON referral_codes FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own referral codes"
    ON referral_codes FOR SELECT
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: referral_rewards
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'VRD_PURCHASE', 'KAUS_STAKE', 'KAUS_PURCHASE', 'SIGNUP_BONUS'
    amount DECIMAL(20, 8) NOT NULL,
    source_amount DECIMAL(20, 2),
    source_currency VARCHAR(10) DEFAULT 'KRW',
    order_id TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    error_message TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referee ON referral_rewards(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_type ON referral_rewards(type);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_created ON referral_rewards(created_at DESC);

-- RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to referral_rewards"
    ON referral_rewards FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own rewards (as referrer)"
    ON referral_rewards FOR SELECT
    USING (auth.uid() = referrer_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD COLUMNS TO profiles (if not exists)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    -- Add referred_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add referral_code_used column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'referral_code_used'
    ) THEN
        ALTER TABLE profiles ADD COLUMN referral_code_used VARCHAR(20);
    END IF;

    -- Add referred_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'referred_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN referred_at TIMESTAMPTZ;
    END IF;

    -- Add sovereign_number column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'sovereign_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN sovereign_number SERIAL;
    END IF;
END $$;

-- Index for referred_by
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: credit_kaus_balance
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION credit_kaus_balance(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type TEXT,
    p_description TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_new_balance DECIMAL;
BEGIN
    -- Get user's wallet
    SELECT * INTO v_wallet
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Create wallet if not exists
        INSERT INTO wallets (user_id, balance, locked_balance, created_at, updated_at)
        VALUES (p_user_id, p_amount, 0, NOW(), NOW())
        RETURNING * INTO v_wallet;

        v_new_balance := p_amount;
    ELSE
        -- Update existing wallet
        v_new_balance := COALESCE(v_wallet.balance, 0) + p_amount;

        UPDATE wallets
        SET balance = v_new_balance, updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    -- Record transaction
    INSERT INTO wallet_transactions (
        wallet_id,
        user_id,
        type,
        amount,
        balance_after,
        description,
        created_at
    ) VALUES (
        v_wallet.id,
        p_user_id,
        p_type,
        p_amount,
        v_new_balance,
        p_description,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'credited_amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: increment_referral_stats
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_referral_stats(
    p_code TEXT,
    p_reward_amount DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    UPDATE referral_codes
    SET
        total_referrals = total_referrals + 1,
        total_earnings = total_earnings + p_reward_amount,
        updated_at = NOW()
    WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: wallet_transactions (if not exists)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    balance_after DECIMAL(20, 8) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to wallet_transactions"
    ON wallet_transactions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own transactions"
    ON wallet_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS: Referral Analytics
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW referral_leaderboard AS
SELECT
    rc.code,
    rc.user_id,
    rc.total_referrals,
    rc.total_earnings,
    rc.created_at,
    p.full_name,
    p.sovereign_number,
    CASE
        WHEN rc.total_referrals >= 500 THEN 'DIAMOND'
        WHEN rc.total_referrals >= 100 THEN 'PLATINUM'
        WHEN rc.total_referrals >= 50 THEN 'GOLD'
        WHEN rc.total_referrals >= 10 THEN 'SILVER'
        ELSE 'BRONZE'
    END as tier,
    RANK() OVER (ORDER BY rc.total_earnings DESC) as rank
FROM referral_codes rc
LEFT JOIN profiles p ON p.user_id = rc.user_id
WHERE rc.is_active = TRUE
ORDER BY rc.total_earnings DESC;

CREATE OR REPLACE VIEW referral_daily_stats AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_rewards,
    SUM(amount) as total_amount,
    COUNT(DISTINCT referrer_id) as unique_referrers,
    COUNT(DISTINCT referee_id) as unique_referees,
    type
FROM referral_rewards
WHERE status = 'paid'
GROUP BY DATE_TRUNC('day', created_at), type
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS: Auto-update timestamps
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_referral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_codes_updated_at ON referral_codes;
CREATE TRIGGER referral_codes_updated_at
    BEFORE UPDATE ON referral_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_updated_at();

DROP TRIGGER IF EXISTS referral_rewards_updated_at ON referral_rewards;
CREATE TRIGGER referral_rewards_updated_at
    BEFORE UPDATE ON referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT SELECT ON referral_leaderboard TO authenticated;
GRANT SELECT ON referral_daily_stats TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ PHASE 54: Referral System Schema Created Successfully';
    RAISE NOTICE '📊 Tables: referral_codes, referral_rewards, wallet_transactions';
    RAISE NOTICE '📈 Views: referral_leaderboard, referral_daily_stats';
    RAISE NOTICE '⚡ Functions: credit_kaus_balance, increment_referral_stats';
END $$;
