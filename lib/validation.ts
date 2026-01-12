/**
 * Input Validation - 입력 데이터 검증
 * 
 * 비즈니스 목적:
 * - 보안 취약점 방지 (SQL Injection, XSS 등)
 * - 데이터 무결성 보장
 * - 사용자 경험 향상 (명확한 에러 메시지)
 */

export interface AnalyzeRequest {
  hashtag: string;
  platform?: string;
  max_posts?: number;
}

export function validateHashtag(hashtag: string): { valid: boolean; error?: string } {
  if (!hashtag || typeof hashtag !== 'string') {
    return { valid: false, error: '해시태그가 필요합니다.' };
  }

  // 해시태그 정규화 (# 제거 후 검증)
  const normalized = hashtag.trim().replace(/^#/, '');
  
  if (normalized.length === 0) {
    return { valid: false, error: '해시태그가 비어있습니다.' };
  }

  if (normalized.length > 50) {
    return { valid: false, error: '해시태그는 50자 이하여야 합니다.' };
  }

  // 허용된 문자만 사용 (영문, 숫자, 언더스코어)
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
    return { valid: false, error: '해시태그는 영문, 숫자, 언더스코어만 사용 가능합니다.' };
  }

  return { valid: true };
}

export function validatePlatform(platform: string): { valid: boolean; error?: string } {
  const allowedPlatforms = ['instagram', 'tiktok'];
  
  if (!platform || !allowedPlatforms.includes(platform.toLowerCase())) {
    return { valid: false, error: `플랫폼은 ${allowedPlatforms.join(', ')} 중 하나여야 합니다.` };
  }

  return { valid: true };
}

export function validateMaxPosts(maxPosts: number): { valid: boolean; error?: string } {
  if (typeof maxPosts !== 'number' || isNaN(maxPosts)) {
    return { valid: false, error: 'max_posts는 숫자여야 합니다.' };
  }

  if (maxPosts < 1 || maxPosts > 500) {
    return { valid: false, error: 'max_posts는 1-500 사이여야 합니다.' };
  }

  return { valid: true };
}

export function validateAnalyzeRequest(body: any): { valid: boolean; error?: string; data?: AnalyzeRequest } {
  if (!body.hashtag) {
    return { valid: false, error: '해시태그가 필요합니다.' };
  }

  const hashtagValidation = validateHashtag(body.hashtag);
  if (!hashtagValidation.valid) {
    return hashtagValidation;
  }

  const platform = body.platform || 'instagram';
  const platformValidation = validatePlatform(platform);
  if (!platformValidation.valid) {
    return platformValidation;
  }

  const maxPosts = body.max_posts || 100;
  const maxPostsValidation = validateMaxPosts(maxPosts);
  if (!maxPostsValidation.valid) {
    return maxPostsValidation;
  }

  return {
    valid: true,
    data: {
      hashtag: body.hashtag.trim().replace(/^#/, ''),
      platform: platform.toLowerCase(),
      max_posts: maxPosts,
    },
  };
}
