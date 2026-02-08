/**
 * Lambda 함수: stripe-webhook
 * Stripe 웹훅 처리 (구독 성공 시 DynamoDB 업데이트)
 * 
 * 환경변수 필수:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 * - USERS_TABLE_NAME (기본값: Users)
 * 
 * 주의: API Gateway에서 "Use Lambda Proxy integration" 비활성화
 *       또는 raw body를 전달하도록 설정 필요
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AWS = require('aws-sdk');

// DynamoDB 클라이언트
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Stripe 가격 ID 매핑 (tier 판별용)
const PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_xxxx_basic',
  pro: process.env.STRIPE_PRICE_PRO || 'price_xxxx_pro',
};

// 가격 ID로 tier 판별
function getTierFromPriceId(priceId) {
  if (priceId === PRICE_IDS.pro) return 'pro';
  if (priceId === PRICE_IDS.basic) return 'basic';
  return 'basic'; // 기본값
}

// 구독 정보 업데이트 (DynamoDB)
async function updateSubscriptionInDB(userId, subscriptionData) {
  if (!userId) {
    console.warn('userId가 없어 DB 업데이트를 건너뜁니다.');
    return;
  }

  try {
    const updateExpression = [
      'subscriptionTier = :tier',
      'subscriptionStatus = :status',
      'stripeSubscriptionId = :subscriptionId',
      'updatedAt = :updatedAt',
    ];

    const expressionAttributeValues = {
      ':tier': subscriptionData.tier,
      ':status': subscriptionData.status,
      ':subscriptionId': subscriptionData.subscriptionId,
      ':updatedAt': new Date().toISOString(),
    };

    // 추가 필드가 있으면 포함
    if (subscriptionData.customerId) {
      updateExpression.push('stripeCustomerId = :customerId');
      expressionAttributeValues[':customerId'] = subscriptionData.customerId;
    }

    if (subscriptionData.currentPeriodEnd) {
      updateExpression.push('subscriptionExpiresAt = :expiresAt');
      expressionAttributeValues[':expiresAt'] = new Date(
        subscriptionData.currentPeriodEnd * 1000
      ).toISOString();
    }

    await dynamodb
      .update({
        TableName: process.env.USERS_TABLE_NAME || 'Users',
        Key: { userId },
        UpdateExpression: `set ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
      .promise();

    console.log('DynamoDB 업데이트 성공:', userId);
  } catch (error) {
    console.error('DynamoDB 업데이트 오류:', error);
    throw error;
  }
}

exports.handler = async (event) => {
  console.log('Webhook Event:', JSON.stringify(event, null, 2));

  try {
    // Stripe 시그니처 검증
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

    if (!sig) {
      console.error('Stripe 시그니처가 없습니다.');
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Stripe 시그니처가 필요합니다.',
        }),
      };
    }

    // 웹훅 시크릿 확인
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes('xxxx')) {
      console.error('Stripe 웹훅 시크릿이 설정되지 않았습니다.');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: '웹훅 시크릿이 설정되지 않았습니다.',
        }),
      };
    }

    // 이벤트 본문 파싱 (API Gateway에서 raw body 전달 필요)
    let body = event.body;

    // 이미 파싱된 경우 다시 문자열로 변환
    if (typeof body === 'object') {
      body = JSON.stringify(body);
    }

    // Stripe 이벤트 검증 및 파싱
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      console.log('Stripe 이벤트 검증 성공:', stripeEvent.type);
    } catch (err) {
      console.error('Stripe 웹훅 검증 실패:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `웹훅 검증 실패: ${err.message}`,
        }),
      };
    }

    // 이벤트 타입별 처리
    const eventType = stripeEvent.type;
    const eventData = stripeEvent.data.object;

    console.log('처리 중인 이벤트:', eventType);

    switch (eventType) {
      case 'checkout.session.completed':
        // 체크아웃 세션 완료 (구독 시작)
        const session = eventData;
        const sessionUserId = session.metadata?.userId || session.client_reference_id;

        if (session.mode === 'subscription' && sessionUserId) {
          // 구독 정보 조회
          const subscriptionId = session.subscription;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price?.id;
            const tier = getTierFromPriceId(priceId);

            await updateSubscriptionInDB(sessionUserId, {
              tier,
              status: 'active',
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              currentPeriodEnd: subscription.current_period_end,
            });

            console.log('구독 활성화 완료:', sessionUserId, tier);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        // 인보이스 결제 성공 (구독 갱신)
        const invoice = eventData;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            const priceId = subscription.items.data[0]?.price?.id;
            const tier = getTierFromPriceId(priceId);

            await updateSubscriptionInDB(userId, {
              tier,
              status: 'active',
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              currentPeriodEnd: subscription.current_period_end,
            });

            console.log('구독 갱신 완료:', userId, tier);
          }
        }
        break;

      case 'invoice.payment_failed':
        // 결제 실패
        const failedInvoice = eventData;
        const failedSubscriptionId = failedInvoice.subscription;

        if (failedSubscriptionId) {
          const failedSubscription = await stripe.subscriptions.retrieve(
            failedSubscriptionId
          );
          const failedUserId = failedSubscription.metadata?.userId;

          if (failedUserId) {
            await updateSubscriptionInDB(failedUserId, {
              tier: getTierFromPriceId(failedSubscription.items.data[0]?.price?.id),
              status: 'past_due',
              subscriptionId: failedSubscription.id,
              customerId: failedSubscription.customer,
            });

            console.log('결제 실패 처리:', failedUserId);
          }
        }
        break;

      case 'customer.subscription.deleted':
        // 구독 취소
        const deletedSubscription = eventData;
        const deletedUserId = deletedSubscription.metadata?.userId;

        if (deletedUserId) {
          await updateSubscriptionInDB(deletedUserId, {
            tier: getTierFromPriceId(deletedSubscription.items.data[0]?.price?.id),
            status: 'canceled',
            subscriptionId: deletedSubscription.id,
            customerId: deletedSubscription.customer,
          });

          console.log('구독 취소 처리:', deletedUserId);
        }
        break;

      default:
        console.log('처리하지 않는 이벤트 타입:', eventType);
    }

    // 성공 응답
    return {
      statusCode: 200,
      body: JSON.stringify({
        received: true,
        eventType,
      }),
    };
  } catch (error) {
    console.error('웹훅 처리 오류:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: '웹훅 처리 중 오류가 발생했습니다.',
        message: error.message,
      }),
    };
  }
};
