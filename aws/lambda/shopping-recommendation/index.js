/**
 * AWS Lambda: 쇼핑 추천 API
 * 엔드포인트: POST /recommend
 * 
 * 환경 변수:
 * - OPENAI_API_KEY: OpenAI API 키
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

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // 요청 본문 파싱
    const body = JSON.parse(event.body || '{}');
    const { userId, query, preferences } = body;

    // 사용자 프로필 조회 (DynamoDB)
    let userProfile = null;
    if (userId) {
      try {
        const profileResult = await dynamodb
          .get({
            TableName: process.env.DYNAMODB_TABLE_NAME || 'Users',
            Key: { userId },
          })
          .promise();
        userProfile = profileResult.Item;
      } catch (error) {
        console.error('DynamoDB 조회 오류:', error);
      }
    }

    // OpenAI 추천 생성
    const recommendationPrompt = `사용자 프로필:
${userProfile ? JSON.stringify(userProfile.preferences || {}) : '없음'}

요청: ${query || '쇼핑 추천'}

한국어로 친근하고 간단하게 추천 상품을 설명해주세요. (최대 3개, 각각 2문장 이내)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 친근한 AI 쇼핑 어시스턴트입니다. 사용자에게 맞춤 상품을 추천합니다.',
        },
        {
          role: 'user',
          content: recommendationPrompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const recommendation = response.choices[0]?.message?.content || '추천을 생성할 수 없습니다.';

    // 추천 결과 저장 (선택사항)
    if (userId) {
      try {
        await dynamodb
          .update({
            TableName: process.env.DYNAMODB_TABLE_NAME || 'Users',
            Key: { userId },
            UpdateExpression: 'SET lastRecommendation = :r, updatedAt = :t',
            ExpressionAttributeValues: {
              ':r': recommendation,
              ':t': new Date().toISOString(),
            },
          })
          .promise();
      } catch (error) {
        console.error('DynamoDB 업데이트 오류:', error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recommendation,
        dataSource: ['OpenAI GPT-4o-mini', 'DynamoDB User Profile'],
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
