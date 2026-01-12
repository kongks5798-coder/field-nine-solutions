/**
 * Lambda 함수: create-subscription
 * Stripe 구독 생성 (프론트엔드에서 호출)
 * 
 * 환경변수 필수:
 * - STRIPE_SECRET_KEY
 * - USERS_TABLE_NAME (기본값: Users)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AWS = require('aws-sdk');

// DynamoDB 클라이언트
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Stripe 가격 ID 매핑
const PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_xxxx_basic',
  pro: process.env.STRIPE_PRICE_PRO || 'price_xxxx_pro',
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // CORS 헤더
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const { email, tier, userId } = body;

    // 필수 파라미터 검증
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'email 파라미터가 필요합니다.',
        }),
      };
    }

    if (!tier || !['basic', 'pro'].includes(tier)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'tier는 "basic" 또는 "pro"여야 합니다.',
        }),
      };
    }

    const priceId = PRICE_IDS[tier];

    if (!priceId || priceId.includes('xxxx')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Stripe 가격 ID가 설정되지 않았습니다. tier: ${tier}`,
        }),
      };
    }

    // Stripe 고객 생성 또는 조회
    let customer;
    try {
      // 기존 고객 조회 시도
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('기존 고객 사용:', customer.id);
      } else {
        // 새 고객 생성
        customer = await stripe.customers.create({
          email,
          metadata: {
            userId: userId || '',
          },
        });
        console.log('새 고객 생성:', customer.id);
      }
    } catch (error) {
      console.error('Stripe 고객 생성/조회 오류:', error);
      throw new Error(`고객 생성 실패: ${error.message}`);
    }

    // 구독 생성
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId || '',
          tier,
        },
      });

      console.log('구독 생성 성공:', subscription.id);

      // DynamoDB에 구독 정보 저장 (pending 상태)
      if (userId) {
        try {
          await dynamodb
            .update({
              TableName: process.env.USERS_TABLE_NAME || 'Users',
              Key: { userId },
              UpdateExpression:
                'set subscriptionTier = :tier, subscriptionStatus = :status, stripeCustomerId = :customerId, stripeSubscriptionId = :subscriptionId, updatedAt = :updatedAt',
              ExpressionAttributeValues: {
                ':tier': tier,
                ':status': 'pending',
                ':customerId': customer.id,
                ':subscriptionId': subscription.id,
                ':updatedAt': new Date().toISOString(),
              },
            })
            .promise();
        } catch (dbError) {
          console.error('DynamoDB 업데이트 오류:', dbError);
          // DB 오류는 무시하고 계속 진행 (웹훅에서 처리)
        }
      }

      // 클라이언트 시크릿 반환
      const clientSecret =
        subscription.latest_invoice.payment_intent?.client_secret || null;

      if (!clientSecret) {
        throw new Error('Payment Intent client_secret을 가져올 수 없습니다.');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          clientSecret,
          subscriptionId: subscription.id,
          customerId: customer.id,
          tier,
        }),
      };
    } catch (error) {
      console.error('Stripe 구독 생성 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('Lambda 오류:', error);

    // Stripe API 오류 처리
    if (error.type === 'StripeCardError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '카드 결제에 실패했습니다.',
          message: error.message,
        }),
      };
    }

    if (error.message?.includes('API key')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Stripe API 키가 설정되지 않았거나 유효하지 않습니다.',
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '구독 생성 중 오류가 발생했습니다.',
        message: error.message,
      }),
    };
  }
};
