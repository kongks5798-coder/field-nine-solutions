-- 환불 처리를 원자적으로 수행하는 RPC 함수
CREATE OR REPLACE FUNCTION process_refund(
  p_user_id UUID,
  p_subscription_id TEXT,
  p_reason TEXT DEFAULT '사용자 요청',
  p_amount INTEGER DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_plan TEXT;
  v_result JSONB;
BEGIN
  -- 1. 현재 플랜 확인
  SELECT plan INTO v_current_plan FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_current_plan IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_active_plan');
  END IF;

  -- 2. 프로필 플랜 초기화
  UPDATE profiles SET plan = NULL, updated_at = NOW() WHERE id = p_user_id;

  -- 3. 구독 상태 변경
  UPDATE subscriptions
  SET status = 'refunded', updated_at = NOW()
  WHERE user_id = p_user_id AND stripe_subscription_id = p_subscription_id;

  -- 4. 이벤트 기록
  INSERT INTO billing_events (user_id, type, amount, description, created_at)
  VALUES (p_user_id, 'refund', p_amount, p_reason, NOW());

  RETURN jsonb_build_object('ok', true, 'previous_plan', v_current_plan);
END;
$$;
