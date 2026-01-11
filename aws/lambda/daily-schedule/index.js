/**
 * AWS Lambda: 데일리 일정 관리 API
 * 엔드포인트: POST /schedule
 * 
 * 환경 변수:
 * - OPENAI_API_KEY: OpenAI API 키
 * - GOOGLE_CALENDAR_API_KEY: Google Calendar API 키 (선택사항)
 * - DYNAMODB_TABLE_NAME: DynamoDB 테이블 이름
 */

const { OpenAI } = require('openai');
const AWS = require('aws-sdk');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // CORS 헤더
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Content-Type': 'application/json',
    };

    // OPTIONS 요청 처리
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { userId, date, action } = body; // action: 'get', 'create', 'update', 'delete'

    // 사용자 일정 조회 (DynamoDB)
    let schedule = null;
    if (userId && date) {
      try {
        const scheduleResult = await dynamodb
          .get({
            TableName: process.env.DYNAMODB_TABLE_NAME || 'Users',
            Key: { userId },
          })
          .promise();
        
        const userData = scheduleResult.Item;
        schedule = userData?.schedules?.[date] || null;
      } catch (error) {
        console.error('DynamoDB 조회 오류:', error);
      }
    }

    // OpenAI로 일정 최적화 제안
    let aiSuggestion = null;
    if (action === 'get' && schedule) {
      const suggestionPrompt = `오늘 일정:
${JSON.stringify(schedule, null, 2)}

일정을 최적화하고 우선순위를 제안해주세요. 한국어로 간단하게 설명해주세요.`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '당신은 효율적인 일정 관리 어시스턴트입니다.',
            },
            {
              role: 'user',
              content: suggestionPrompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        });

        aiSuggestion = response.choices[0]?.message?.content || null;
      } catch (error) {
        console.error('OpenAI 오류:', error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        schedule,
        aiSuggestion,
        dataSource: ['DynamoDB', 'OpenAI GPT-4o-mini'],
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Lambda 오류:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || '서버 오류가 발생했습니다.',
      }),
    };
  }
};
