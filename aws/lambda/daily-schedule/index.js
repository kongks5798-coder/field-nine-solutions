/**
 * Lambda 함수: dailySchedule
 * Google Calendar API 연동해서 일정 정리/추천
 * 
 * 환경변수 필수:
 * - GOOGLE_CALENDAR_API_KEY
 * - GOOGLE_CLIENT_ID (OAuth용)
 * - GOOGLE_CLIENT_SECRET (OAuth용)
 */

const AWS = require('aws-sdk');

// DynamoDB 클라이언트
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Google Calendar API 호출 함수
async function getGoogleCalendarEvents(userId, date) {
  // 사용자 토큰 조회 (DynamoDB)
  const userToken = await getUserToken(userId);
  
  if (!userToken) {
    return {
      error: 'Google Calendar 연동이 필요합니다.',
      needsAuth: true,
    };
  }

  try {
    // Google Calendar API 호출
    const calendarDate = date || new Date().toISOString().split('T')[0];
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${calendarDate}T00:00:00Z&timeMax=${calendarDate}T23:59:59Z&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${userToken.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        events: data.items || [],
        date: calendarDate,
      };
    } else if (response.status === 401) {
      // 토큰 만료 - 재인증 필요
      return {
        error: 'Google Calendar 토큰이 만료되었습니다.',
        needsAuth: true,
      };
    }
  } catch (error) {
    console.error('Google Calendar API 오류:', error);
    return {
      error: '일정 조회 중 오류가 발생했습니다.',
      message: error.message,
    };
  }

  return { events: [], date };
}

// AI 일정 추천 생성 (OpenAI)
async function generateScheduleRecommendation(events, query) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      recommendation: '일정이 적당히 배치되어 있습니다. 충분한 휴식 시간을 가지세요.',
      aiSuggestion: 'OpenAI API 키가 설정되지 않아 기본 추천을 제공합니다.',
    };
  }

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const eventsSummary = events.map((e) => {
      const start = e.start?.dateTime || e.start?.date;
      return `- ${start}: ${e.summary || '일정'}`;
    }).join('\n');

    const systemPrompt = `너는 친근한 일정 관리 AI 어시스턴트야. 사용자의 일정을 분석하고 실용적인 조언을 해줘. 한국어로 자연스럽게 응답해줘.`;

    const userPrompt = `오늘 일정:\n${eventsSummary}\n\n사용자 요청: ${query || '일정을 정리해줘'}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return {
      recommendation: response.choices[0].message.content,
      aiSuggestion: 'AI가 분석한 일정 추천입니다.',
    };
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return {
      recommendation: '일정이 적당히 배치되어 있습니다.',
      aiSuggestion: 'AI 추천 생성 중 오류가 발생했습니다.',
    };
  }
}

// 사용자 토큰 조회 (DynamoDB)
async function getUserToken(userId) {
  if (!userId) return null;

  try {
    const params = {
      TableName: process.env.USERS_TABLE_NAME || 'Users',
      Key: { userId },
    };

    const result = await dynamodb.get(params).promise();
    return result.Item?.googleCalendarToken || null;
  } catch (error) {
    console.error('DynamoDB 조회 오류:', error);
    return null;
  }
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // CORS 헤더
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // 요청 본문 파싱
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { userId, date, action = 'get', query } = body;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'userId 파라미터가 필요합니다.',
        }),
      };
    }

    switch (action) {
      case 'get':
        // 일정 조회
        const calendarData = await getGoogleCalendarEvents(userId, date);

        if (calendarData.error && calendarData.needsAuth) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              success: false,
              error: calendarData.error,
              needsAuth: true,
            }),
          };
        }

        // AI 추천 생성
        const aiRecommendation = await generateScheduleRecommendation(
          calendarData.events || [],
          query
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            schedule: calendarData.events || [],
            date: calendarData.date || date,
            recommendation: aiRecommendation.recommendation,
            aiSuggestion: aiRecommendation.aiSuggestion,
            dataSource: ['Google Calendar API', 'OpenAI GPT-4o-mini'],
          }),
        };

      case 'create':
        // 일정 생성 (구현 예정)
        return {
          statusCode: 501,
          headers,
          body: JSON.stringify({
            success: false,
            error: '일정 생성 기능은 아직 구현되지 않았습니다.',
          }),
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: `지원하지 않는 action: ${action}`,
          }),
        };
    }
  } catch (error) {
    console.error('Lambda 오류:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '일정 처리 중 오류가 발생했습니다.',
        message: error.message,
      }),
    };
  }
};
