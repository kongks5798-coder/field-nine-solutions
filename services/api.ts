/**
 * API 서비스 레이어
 * AWS Lambda 엔드포인트 호출용
 */

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || '';

/**
 * 쇼핑 추천 API (Mock 포함)
 */
export async function getShoppingRecommendation(query: string, userId?: string) {
  // API Gateway URL이 설정되어 있으면 실제 API 호출
  if (API_GATEWAY_URL) {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          query,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          recommendation: data.recommendation,
          dataSource: data.dataSource || [],
        };
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
    }
  }

  // Mock 응답 (API Gateway가 없을 때)
  return {
    success: true,
    recommendation: `이 옷 추천해요! 예상 가격 45,000원 (20% 세일 예정)`,
    dataSource: ['Mock 데이터'],
  };
}

/**
 * 데일리 일정 API (Mock 포함)
 */
export async function getDailySchedule(date: string, userId?: string) {
  if (API_GATEWAY_URL) {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          date,
          action: 'get',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          schedule: data.schedule,
          aiSuggestion: data.aiSuggestion,
          dataSource: data.dataSource || [],
        };
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
    }
  }

  // Mock 응답
  return {
    success: true,
    schedule: {
      '09:00': '회의',
      '14:00': '점심 약속',
      '18:00': '운동',
    },
    aiSuggestion: '오늘 일정이 적당히 배치되어 있습니다. 점심 약속 전에 충분한 시간이 있으니 미리 준비하세요.',
    dataSource: ['Mock 데이터'],
  };
}
