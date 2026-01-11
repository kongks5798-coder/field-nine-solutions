/**
 * Lambda 함수: recommendShopping
 * 사용자 쿼리를 받아 OpenAI/Claude로 쇼핑 추천 생성
 * 
 * 환경변수 필수:
 * - OPENAI_API_KEY
 * - CLAUDE_API_KEY (옵션)
 */

const { OpenAI } = require('openai');
const AWS = require('aws-sdk');

// DynamoDB 클라이언트 (사용자 프로필 조회용)
const dynamodb = new AWS.DynamoDB.DocumentClient();

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Claude API 호출 함수 (옵션)
async function callClaudeAPI(query, userId) {
  if (!process.env.CLAUDE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `너는 친근한 한국 쇼핑 AI야. 예산 고려해서 실용적 추천해줘. 사용자 질문: ${query}`,
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.content[0].text;
    }
  } catch (error) {
    console.error('Claude API 오류:', error);
  }

  return null;
}

// 사용자 프로필 조회 (DynamoDB)
async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const params = {
      TableName: process.env.USERS_TABLE_NAME || 'Users',
      Key: { userId },
    };

    const result = await dynamodb.get(params).promise();
    return result.Item?.profile || null;
  } catch (error) {
    console.error('DynamoDB 조회 오류:', error);
    return null;
  }
}

// 가격 예측 Mock (나중에 실제 Prophet/XGBoost로 교체)
function predictPriceTrend(productName) {
  // Mock: 랜덤하게 10-30% 할인 예측
  const discountRate = Math.random() * 0.2 + 0.1; // 10-30%
  const basePrice = Math.floor(Math.random() * 100000) + 20000; // 20,000-120,000원
  const savings = Math.floor(basePrice * discountRate);

  return {
    currentPrice: basePrice,
    predictedDiscount: Math.floor(discountRate * 100),
    estimatedSavings: savings,
    daysUntilSale: Math.floor(Math.random() * 7) + 1, // 1-7일
  };
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

  // OPTIONS 요청 처리 (CORS preflight)
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
    const { query, userId } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'query 파라미터가 필요합니다.',
        }),
      };
    }

    // 사용자 프로필 조회
    const userProfile = await getUserProfile(userId);
    const budget = userProfile?.budget || null;
    const preferences = userProfile?.preferences || {};

    // 시스템 프롬프트 구성
    let systemPrompt = '너는 친근한 한국 쇼핑 AI 어시스턴트야. 사용자의 예산과 취향을 고려해서 실용적이고 개인화된 추천을 해줘.';
    
    if (budget) {
      systemPrompt += ` 사용자 예산: ${budget.toLocaleString('ko-KR')}원.`;
    }

    if (preferences.brands && preferences.brands.length > 0) {
      systemPrompt += ` 선호 브랜드: ${preferences.brands.join(', ')}.`;
    }

    if (preferences.categories && preferences.categories.length > 0) {
      systemPrompt += ` 관심 카테고리: ${preferences.categories.join(', ')}.`;
    }

    systemPrompt += ' 응답은 친근하고 자연스러운 한국어로 작성해줘. 가격 정보와 예상 절약 금액을 포함해줘.';

    // OpenAI API 호출
    const openaiResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiRecommendation = openaiResponse.choices[0].message.content;

    // 가격 예측 Mock 추가
    const pricePrediction = predictPriceTrend(query);

    // 최종 응답 구성
    const recommendation = {
      text: aiRecommendation,
      priceInfo: {
        currentPrice: pricePrediction.currentPrice,
        predictedDiscount: pricePrediction.predictedDiscount,
        estimatedSavings: pricePrediction.estimatedSavings,
        daysUntilSale: pricePrediction.daysUntilSale,
      },
      dataSource: ['OpenAI GPT-4o-mini', '가격 예측 모델 (Mock)'],
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recommendation: recommendation.text,
        priceInfo: recommendation.priceInfo,
        dataSource: recommendation.dataSource,
        fullResponse: recommendation,
      }),
    };
  } catch (error) {
    console.error('Lambda 오류:', error);

    // OpenAI API 키 오류 처리
    if (error.message?.includes('API key')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'OpenAI API 키가 설정되지 않았거나 유효하지 않습니다.',
          message: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '추천 생성 중 오류가 발생했습니다.',
        message: error.message,
      }),
    };
  }
};
