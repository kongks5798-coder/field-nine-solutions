-- ============================================================
-- Migration 096: user_tokens 원자적 차감 RPC
-- ============================================================
-- Race Condition 방지: read-modify-write 대신 단일 원자적 UPDATE
-- 서비스 역할(service_role)에서만 호출 가능

CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id UUID, p_delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- delta는 반드시 음수여야 함
  IF p_delta >= 0 THEN
    RAISE EXCEPTION 'delta must be negative, got %', p_delta;
  END IF;

  -- 원자적 upsert + clamp to 0
  INSERT INTO user_tokens (user_id, balance, updated_at)
    VALUES (p_user_id, GREATEST(0, 50000 + p_delta), NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance     = GREATEST(0, user_tokens.balance + p_delta),
        updated_at  = NOW()
  RETURNING balance INTO v_balance;

  RETURN v_balance;
END;
$$;

-- 함수 설명
COMMENT ON FUNCTION public.deduct_tokens IS
  'user_tokens 잔액을 원자적으로 차감. delta는 음수 정수. 최솟값 0으로 clamp.';
