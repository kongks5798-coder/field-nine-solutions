/**
 * 입력 검증 유틸리티
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 금액 검증
 */
export function validateAmount(amount: number): ValidationResult {
  const errors: string[] = [];

  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push('금액은 숫자여야 합니다.');
  } else if (amount <= 0) {
    errors.push('금액은 0보다 커야 합니다.');
  } else if (amount > 100000000) {
    errors.push('금액은 1억원을 초과할 수 없습니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 플랜 ID 검증
 */
export function validatePlanId(planId: string): ValidationResult {
  const validPlanIds = ['free', 'premium', 'team', 'business', 'enterprise'];
  const errors: string[] = [];

  if (!planId || typeof planId !== 'string') {
    errors.push('플랜 ID가 필요합니다.');
  } else if (!validPlanIds.includes(planId)) {
    errors.push(`유효하지 않은 플랜 ID입니다. (${validPlanIds.join(', ')})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 결제 주기 검증
 */
export function validateBillingCycle(billingCycle: string): ValidationResult {
  const errors: string[] = [];

  if (!billingCycle || typeof billingCycle !== 'string') {
    errors.push('결제 주기가 필요합니다.');
  } else if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
    errors.push('결제 주기는 "monthly" 또는 "yearly"여야 합니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * UUID 검증
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 날짜 범위 검증
 */
export function validateDateRange(startDate: Date, endDate: Date): ValidationResult {
  const errors: string[] = [];

  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    errors.push('시작 날짜가 유효하지 않습니다.');
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    errors.push('종료 날짜가 유효하지 않습니다.');
  }

  if (errors.length === 0 && startDate > endDate) {
    errors.push('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
