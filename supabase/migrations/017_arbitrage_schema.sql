-- 차익거래 엔진 데이터베이스 스키마
-- Field Nine Arbitrage Engine Database Schema

-- 1. 차익거래 기회 로그 테이블
CREATE TABLE IF NOT EXISTS public.arbitrage_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- 예: "BTC/USDT (Binance) -> BTC/KRW (Upbit)"
    profit_usd DECIMAL(20, 2) NOT NULL,
    profit_percent DECIMAL(10, 4) NOT NULL,
    risk_score DECIMAL(3, 2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    fee_optimized BOOLEAN DEFAULT false,
    execution_time_ms DECIMAL(10, 2),
    binance_price DECIMAL(20, 8),
    upbit_price_usd DECIMAL(20, 8),
    price_diff DECIMAL(20, 8),
    total_fees DECIMAL(20, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    execution_status TEXT DEFAULT 'detected' CHECK (execution_status IN ('detected', 'executed', 'failed', 'cancelled'))
);

-- 2. 차익거래 실행 기록 테이블
CREATE TABLE IF NOT EXISTS public.arbitrage_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.arbitrage_opportunities(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buy_order_id TEXT, -- Binance 주문 ID
    sell_order_id TEXT, -- Upbit 주문 ID
    actual_profit DECIMAL(20, 2),
    execution_time_ms DECIMAL(10, 2),
    status TEXT NOT NULL CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. 오더북 스냅샷 테이블 (성능 분석용)
CREATE TABLE IF NOT EXISTS public.orderbook_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange TEXT NOT NULL CHECK (exchange IN ('binance', 'upbit')),
    symbol TEXT NOT NULL,
    bids JSONB NOT NULL, -- [(price, quantity), ...]
    asks JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    latency_ms DECIMAL(10, 2)
);

-- 4. 리스크 평가 로그 테이블
CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.arbitrage_opportunities(id) ON DELETE CASCADE,
    risk_score DECIMAL(3, 2) NOT NULL,
    should_execute BOOLEAN NOT NULL,
    hedging_strategy JSONB, -- DeepSeek-V3 응답 저장
    confidence DECIMAL(3, 2),
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_user_id ON public.arbitrage_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_created_at ON public.arbitrage_opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_status ON public.arbitrage_opportunities(execution_status);
CREATE INDEX IF NOT EXISTS idx_arbitrage_executions_user_id ON public.arbitrage_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_executions_status ON public.arbitrage_executions(status);
CREATE INDEX IF NOT EXISTS idx_orderbook_snapshots_exchange_timestamp ON public.orderbook_snapshots(exchange, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_opportunity_id ON public.risk_assessments(opportunity_id);

-- 6. RLS (Row Level Security) 정책
ALTER TABLE public.arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view their own arbitrage opportunities"
    ON public.arbitrage_opportunities
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own executions"
    ON public.arbitrage_executions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own risk assessments"
    ON public.risk_assessments
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.arbitrage_opportunities WHERE id = risk_assessments.opportunity_id));

-- 오더북 스냅샷은 모든 인증된 사용자가 조회 가능 (읽기 전용)
ALTER TABLE public.orderbook_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orderbook snapshots"
    ON public.orderbook_snapshots
    FOR SELECT
    TO authenticated
    USING (true);

-- 7. 통계 뷰 생성
CREATE OR REPLACE VIEW public.arbitrage_stats AS
SELECT 
    COUNT(*) as total_opportunities,
    COUNT(*) FILTER (WHERE execution_status = 'executed') as executed_count,
    SUM(profit_usd) FILTER (WHERE execution_status = 'executed') as total_profit_usd,
    AVG(profit_percent) FILTER (WHERE execution_status = 'executed') as avg_profit_percent,
    AVG(risk_score) as avg_risk_score,
    MAX(created_at) as last_opportunity_at
FROM public.arbitrage_opportunities;

-- 8. 함수: 차익거래 기회 저장
CREATE OR REPLACE FUNCTION public.save_arbitrage_opportunity(
    p_user_id UUID,
    p_path TEXT,
    p_profit_usd DECIMAL,
    p_profit_percent DECIMAL,
    p_risk_score DECIMAL,
    p_fee_optimized BOOLEAN,
    p_execution_time_ms DECIMAL,
    p_binance_price DECIMAL,
    p_upbit_price_usd DECIMAL,
    p_price_diff DECIMAL,
    p_total_fees DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_opportunity_id UUID;
BEGIN
    INSERT INTO public.arbitrage_opportunities (
        user_id, path, profit_usd, profit_percent, risk_score,
        fee_optimized, execution_time_ms, binance_price, upbit_price_usd,
        price_diff, total_fees
    ) VALUES (
        p_user_id, p_path, p_profit_usd, p_profit_percent, p_risk_score,
        p_fee_optimized, p_execution_time_ms, p_binance_price, p_upbit_price_usd,
        p_price_diff, p_total_fees
    )
    RETURNING id INTO v_opportunity_id;
    
    RETURN v_opportunity_id;
END;
$$;

-- 9. 함수: 실행 기록 저장
CREATE OR REPLACE FUNCTION public.save_arbitrage_execution(
    p_opportunity_id UUID,
    p_user_id UUID,
    p_buy_order_id TEXT,
    p_sell_order_id TEXT,
    p_actual_profit DECIMAL,
    p_execution_time_ms DECIMAL,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_execution_id UUID;
BEGIN
    INSERT INTO public.arbitrage_executions (
        opportunity_id, user_id, buy_order_id, sell_order_id,
        actual_profit, execution_time_ms, status, error_message
    ) VALUES (
        p_opportunity_id, p_user_id, p_buy_order_id, p_sell_order_id,
        p_actual_profit, p_execution_time_ms, p_status, p_error_message
    )
    RETURNING id INTO v_execution_id;
    
    -- 기회 상태 업데이트
    UPDATE public.arbitrage_opportunities
    SET execution_status = p_status,
        executed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE executed_at END
    WHERE id = p_opportunity_id;
    
    RETURN v_execution_id;
END;
$$;

-- 10. 주석 추가
COMMENT ON TABLE public.arbitrage_opportunities IS '차익거래 기회 탐지 로그';
COMMENT ON TABLE public.arbitrage_executions IS '차익거래 실행 기록';
COMMENT ON TABLE public.orderbook_snapshots IS '오더북 스냅샷 (성능 분석용)';
COMMENT ON TABLE public.risk_assessments IS '리스크 평가 로그 (DeepSeek-V3)';
