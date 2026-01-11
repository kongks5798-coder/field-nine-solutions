/**
 * Lambda 함수: predictSavings
 * XGBoost mock으로 7일 절약 예측
 * 나중에 실제 Prophet/XGBoost 모델로 교체 예정
 * 
 * 환경변수:
 * - (향후) XGBOOST_MODEL_S3_BUCKET
 */

const AWS = require('aws-sdk');

// DynamoDB 클라이언트
const dynamodb = new AWS.DynamoDB.DocumentClient();

// XGBoost Mock 예측 함수
function predictSavingsWithMock(userId, days = 7) {
  // Mock: 사용자별 과거 데이터 기반 예측 시뮬레이션
  const baseSavings = Math.floor(Math.random() * 50000) + 20000; // 20,000-70,000원
  const dailyVariation = Math.floor(Math.random() * 10000) - 5000; // -5,000 ~ +5,000원

  // 7일 예측 데이터 생성
  const predictions = [];
  let totalSavings = 0;

  for (let i = 0; i < days; i++) {
    const daySavings = baseSavings + dailyVariation + Math.floor(Math.random() * 5000);
    totalSavings += daySavings;

    predictions.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predictedSavings: daySavings,
      confidence: Math.random() * 0.2 + 0.8, // 80-100% 신뢰도
    });
  }

  return {
    totalPredictedSavings: totalSavings,
    dailyPredictions: predictions,
    averageDailySavings: Math.floor(totalSavings / days),
    confidence: 0.85, // 전체 예측 신뢰도
    model: 'XGBoost Mock (v0.1)',
    note: '실제 Prophet/XGBoost 모델로 교체 예정',
  };
}

// 사용자 과거 데이터 조회 (DynamoDB)
async function getUserHistory(userId) {
  if (!userId) return null;

  try {
    const params = {
      TableName: process.env.RECOMMENDATIONS_TABLE_NAME || 'ProductRecommendations',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    };

    const result = await dynamodb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('DynamoDB 조회 오류:', error);
    return [];
  }
}

// Prophet Mock 예측 (향후 실제 Prophet 모델로 교체)
function predictWithProphet(historyData, days = 7) {
  // Mock: 시계열 예측 시뮬레이션
  const trend = historyData.length > 0 ? 1.05 : 1.0; // 5% 증가 추세
  const seasonality = Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 7)); // 주간 계절성

  const predictions = [];
  let totalSavings = 0;

  for (let i = 0; i < days; i++) {
    const baseValue = 30000;
    const predictedValue = Math.floor(baseValue * trend * (1 + seasonality * 0.1));
    totalSavings += predictedValue;

    predictions.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predictedSavings: predictedValue,
      trend: trend > 1 ? 'increasing' : 'stable',
      seasonality: seasonality > 0 ? 'high' : 'low',
    });
  }

  return {
    totalPredictedSavings: totalSavings,
    dailyPredictions: predictions,
    model: 'Prophet Mock (v0.1)',
    note: '실제 Prophet 모델로 교체 예정',
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
    const { userId, days = 7, model = 'xgboost' } = body;

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

    // 사용자 과거 데이터 조회
    const historyData = await getUserHistory(userId);

    let prediction;

    if (model === 'prophet') {
      // Prophet 모델 사용
      prediction = predictWithProphet(historyData, days);
    } else {
      // XGBoost 모델 사용 (기본)
      prediction = predictSavingsWithMock(userId, days);
    }

    // 데이터 소스 정보 추가
    prediction.dataSource = [
      'XGBoost Mock Model',
      'Prophet Mock Model',
      'DynamoDB 사용자 히스토리',
    ];
    prediction.timestamp = new Date().toISOString();
    prediction.userId = userId;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...prediction,
      }),
    };
  } catch (error) {
    console.error('Lambda 오류:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '절약 예측 중 오류가 발생했습니다.',
        message: error.message,
      }),
    };
  }
};
