/**
 * 입력 검증 유틸리티
 * 폼 입력값 검증 및 보안 강화
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push("이메일을 입력해주세요.");
    return { isValid: false, errors };
  }

  if (email.length > 255) {
    errors.push("이메일은 255자 이하여야 합니다.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("올바른 이메일 형식이 아닙니다.");
  }

  // XSS 방지: 이메일에 스크립트 태그가 있는지 확인
  if (/<script|javascript:|onerror=/i.test(email)) {
    errors.push("잘못된 이메일 형식입니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 비밀번호 검증
 */
export function validatePassword(password: string, isSignUp: boolean = false): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("비밀번호를 입력해주세요.");
    return { isValid: false, errors };
  }

  if (isSignUp) {
    if (password.length < 8) {
      errors.push("비밀번호는 8자 이상이어야 합니다.");
    }

    if (password.length > 128) {
      errors.push("비밀번호는 128자 이하여야 합니다.");
    }

    // 복잡도 검증
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("비밀번호에 소문자가 포함되어야 합니다.");
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("비밀번호에 대문자가 포함되어야 합니다.");
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push("비밀번호에 숫자가 포함되어야 합니다.");
    }

    // 특수문자 검증 (선택적)
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push("비밀번호에 특수문자(@$!%*?&)가 포함되어야 합니다.");
    }
  } else {
    // 로그인 시에는 최소 길이만 확인
    if (password.length < 6) {
      errors.push("비밀번호는 6자 이상이어야 합니다.");
    }
  }

  // XSS 방지
  if (/<script|javascript:|onerror=/i.test(password)) {
    errors.push("잘못된 비밀번호 형식입니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 일반 텍스트 검증 (XSS 방지)
 */
export function validateText(text: string, maxLength: number = 1000): ValidationResult {
  const errors: string[] = [];

  if (!text) {
    return { isValid: true, errors: [] }; // 빈 값은 허용
  }

  if (text.length > maxLength) {
    errors.push(`텍스트는 ${maxLength}자 이하여야 합니다.`);
  }

  // XSS 방지
  if (/<script|javascript:|onerror=|onclick=|onload=/i.test(text)) {
    errors.push("잘못된 텍스트 형식입니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * URL 검증
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url) {
    errors.push("URL을 입력해주세요.");
    return { isValid: false, errors };
  }

  try {
    const urlObj = new URL(url);
    
    // 허용된 프로토콜만 허용
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      errors.push("HTTP 또는 HTTPS URL만 허용됩니다.");
    }
  } catch {
    errors.push("올바른 URL 형식이 아닙니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 숫자 검증
 */
export function validateNumber(value: string | number, min?: number, max?: number): ValidationResult {
  const errors: string[] = [];

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    errors.push("숫자를 입력해주세요.");
    return { isValid: false, errors };
  }

  if (min !== undefined && num < min) {
    errors.push(`값은 ${min} 이상이어야 합니다.`);
  }

  if (max !== undefined && num > max) {
    errors.push(`값은 ${max} 이하여야 합니다.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
