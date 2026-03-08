// User-friendly error messages for AI and API errors
export const ERROR_MESSAGES: Record<string, string> = {
  // Network
  "Failed to fetch": "인터넷 연결을 확인해주세요",
  "NetworkError": "네트워크 오류가 발생했습니다",
  "AbortError": "요청이 취소되었습니다",
  "timeout": "요청 시간이 초과되었습니다. 다시 시도해주세요",

  // AI API
  "429": "AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
  "rate_limit_exceeded": "AI 요청 한도에 도달했습니다 (1분 후 재시도)",
  "TOKEN_LIMIT_EXCEEDED": "이번 달 토큰 한도를 초과했습니다. 플랜을 업그레이드하세요",
  "context_length_exceeded": "입력이 너무 깁니다. 요청을 간결하게 작성해주세요",
  "insufficient_quota": "API 크레딧이 부족합니다",

  // Auth
  "401": "로그인이 필요합니다",
  "403": "접근 권한이 없습니다",

  // Server
  "500": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
  "503": "서비스가 일시적으로 중단되었습니다",

  // Payment
  "PAYMENT_REQUIRED": "유료 플랜이 필요합니다",
};

export function getFriendlyError(error: unknown): string {
  const msg = (error instanceof Error ? error.message : String(error)) ?? "";

  // Check exact matches first
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return value;
  }

  // Trim and limit raw message
  const trimmed = msg.slice(0, 80);
  return trimmed || "알 수 없는 오류가 발생했습니다";
}
