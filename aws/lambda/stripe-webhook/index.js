/**
 * AWS Lambda: Stripe 웹훅 핸들러
 * 엔드포인트: POST /webhook/stripe
 * 
 * 환경 변수:
 * - STRIPE_SECRET_KEY: Stripe Secret Key
 * - STRIPE_WEBHOOK_SECRET: Stripe Webhook Secret
 * - DYNAMODB_TABLE_NAME: DynamoDB 테이블 이름
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    const body = event.body;

    if (!sig) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing stripe-signature header' }),
      };
    }

    let evt;
    try {
      evt = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Stripe 웹훅 검증 실패:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
      };
    }

    // 이벤트 타입별 처리
    if (evt.type === 'checkout.session.completed') {
      const session = evt.data.object;
      const userId = session.client_reference_id || session.customer_email;

      if (!userId) {
        console.error('userId를 찾을 수 없습니다:', session);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing userId' }),
        };
      }

      // DynamoDB 업데이트: 사용자 구독 활성화
      try {
        await dynamodb
          .update({
            TableName: process.env.DYNAMODB_TABLE_NAME || 'Users',
            Key: { userId },
            UpdateExpression: 'SET subscription = :s, subscriptionId = :sid, subscriptionStatus = :status, updatedAt = :t',
            ExpressionAttributeValues: {
              ':s': session.subscription || 'active',
              ':sid': session.id,
              ':status': 'active',
              ':t': new Date().toISOString(),
            },
          })
          .promise();

        console.log('구독 활성화 완료:', userId);
      } catch (error) {
        console.error('DynamoDB 업데이트 오류:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to update subscription' }),
        };
      }
    } else if (evt.type === 'customer.subscription.deleted') {
      // 구독 취소 처리
      const subscription = evt.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        try {
          await dynamodb
            .update({
              TableName: process.env.DYNAMODB_TABLE_NAME || 'Users',
              Key: { userId },
              UpdateExpression: 'SET subscriptionStatus = :status, updatedAt = :t',
              ExpressionAttributeValues: {
                ':status': 'cancelled',
                ':t': new Date().toISOString(),
              },
            })
            .promise();

          console.log('구독 취소 완료:', userId);
        } catch (error) {
          console.error('DynamoDB 업데이트 오류:', error);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
