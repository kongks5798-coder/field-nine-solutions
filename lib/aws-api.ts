/**
 * AWS API Gateway 클라이언트
 * Lambda 함수 호출을 위한 유틸리티
 */

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || '';

interface ShoppingRecommendationRequest {
  userId?: string;
  query?: string;
  preferences?: Record<string, any>;
}

interface DailyScheduleRequest {
  userId?: string;
  date: string;
  action: 'get' | 'create' | 'update' | 'delete';
}

/**
 * 쇼핑 추천 API 호출
 */
export async function getShoppingRecommendation(
  request: ShoppingRecommendationRequest
): Promise<{
  success: boolean;
  recommendation?: string;
  dataSource?: string[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('쇼핑 추천 API 오류:', error);
    return {
      success: false,
      error: error.message || 'API 호출에 실패했습니다.',
    };
  }
}

/**
 * 데일리 일정 API 호출
 */
export async function manageDailySchedule(
  request: DailyScheduleRequest
): Promise<{
  success: boolean;
  schedule?: any;
  aiSuggestion?: string;
  dataSource?: string[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('일정 관리 API 오류:', error);
    return {
      success: false,
      error: error.message || 'API 호출에 실패했습니다.',
    };
  }
}
