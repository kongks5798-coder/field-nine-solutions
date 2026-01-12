# Stripe 구독 & 결제 시스템 설정 가이드

## 📋 필수 사전 준비

### 1. Stripe 계정 설정
- Stripe 계정 생성: https://dashboard.stripe.com/register
- 테스트 모드 활성화 (개발 단계)

### 2. 제품 및 가격 생성

#### Stripe 대시보드에서 제품 생성:

1. **Basic 플랜**
   - Products → Add product
   - Name: "Field Nine AI - Basic"
   - Description: "월간 기본 추천 10회/일"
   - Pricing: Recurring, $4.99 USD, Monthly
   - Price ID 복사: `price_xxxx_basic`

2. **Pro 플랜**
   - Products → Add product
   - Name: "Field Nine AI - Pro"
   - Description: "무제한 추천 + 고급 기능"
   - Pricing: Recurring, $14.99 USD, Monthly
   - Price ID 복사: `price_xxxx_pro`

### 3. API 키 발급
- Developers → API keys
- **Secret key** 복사: `sk_test_...` (테스트 모드)
- **Publishable key** 복사: `pk_test_...` (프론트엔드용)

### 4. 웹훅 엔드포인트 설정
- Developers → Webhooks → Add endpoint
- Endpoint URL: `https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/webhook/stripe`
- Events to send:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
- **Signing secret** 복사: `whsec_...`

---

## 🚀 Lambda 함수 배포

### Step 1: create-subscription Lambda 배포

#### 1-1. Lambda 함수 생성
```bash
aws lambda create-function \
  --function-name field-nine-create-subscription \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://create-subscription.zip \
  --timeout 30 \
  --memory-size 512
```

#### 1-2. 환경변수 설정
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_BASIC=price_xxxx_basic
STRIPE_PRICE_PRO=price_xxxx_pro
USERS_TABLE_NAME=Users
```

#### 1-3. 의존성 설치 및 배포
```bash
cd aws/lambda/create-subscription
npm install stripe aws-sdk
zip -r create-subscription.zip index.js node_modules/

aws lambda update-function-code \
  --function-name field-nine-create-subscription \
  --zip-file fileb://create-subscription.zip
```

---

### Step 2: stripe-webhook Lambda 배포

#### 2-1. Lambda 함수 생성
```bash
aws lambda create-function \
  --function-name field-nine-stripe-webhook \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://stripe-webhook.zip \
  --timeout 30 \
  --memory-size 512
```

#### 2-2. 환경변수 설정
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_xxxx_basic
STRIPE_PRICE_PRO=price_xxxx_pro
USERS_TABLE_NAME=Users
```

#### 2-3. 의존성 설치 및 배포
```bash
cd aws/lambda/stripe-webhook
npm install stripe aws-sdk
zip -r stripe-webhook.zip index.js node_modules/

aws lambda update-function-code \
  --function-name field-nine-stripe-webhook \
  --zip-file fileb://stripe-webhook.zip
```

---

## 🔗 API Gateway 설정

### Step 1: 리소스 생성

```bash
# /create-subscription 리소스
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part create-subscription

# /webhook/stripe 리소스
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part webhook

aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id WEBHOOK_RESOURCE_ID \
  --path-part stripe
```

### Step 2: Lambda 통합 설정

```bash
# create-subscription Lambda 통합
aws apigateway put-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id CREATE_SUBSCRIPTION_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:ap-northeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-northeast-2:YOUR_ACCOUNT_ID:function:field-nine-create-subscription/invocations

# stripe-webhook Lambda 통합
aws apigateway put-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id STRIPE_WEBHOOK_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:ap-northeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-northeast-2:YOUR_ACCOUNT_ID:function:field-nine-stripe-webhook/invocations
```

### Step 3: 웹훅 엔드포인트 - Raw Body 설정

**중요**: Stripe 웹훅은 시그니처 검증을 위해 raw body가 필요합니다.

API Gateway 콘솔에서:
1. Integration Request → Mapping Templates
2. Content-Type: `application/json`
3. Template: `$input.body` (passthrough)

또는 AWS CLI:
```bash
aws apigateway put-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id STRIPE_WEBHOOK_RESOURCE_ID \
  --http-method POST \
  --request-templates '{"application/json": "$input.body"}'
```

---

## 🗄️ DynamoDB 테이블 업데이트

### Users 테이블에 속성 추가

기존 테이블에 다음 속성들이 자동으로 추가됩니다 (첫 업데이트 시):

- `subscriptionTier` (String): "basic" 또는 "pro"
- `subscriptionStatus` (String): "pending", "active", "past_due", "canceled"
- `stripeCustomerId` (String): Stripe 고객 ID
- `stripeSubscriptionId` (String): Stripe 구독 ID
- `subscriptionExpiresAt` (String): 구독 만료일 (ISO 8601)

**참고**: DynamoDB는 스키마가 없으므로, Lambda 함수에서 자동으로 속성이 생성됩니다.

---

## 🧪 테스트

### 1. create-subscription 테스트

```bash
curl -X POST https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/create-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "tier": "basic",
    "userId": "test-user-123"
  }'
```

**예상 응답:**
```json
{
  "success": true,
  "clientSecret": "pi_xxxx_secret_xxxx",
  "subscriptionId": "sub_xxxx",
  "customerId": "cus_xxxx",
  "tier": "basic"
}
```

### 2. Stripe 테스트 카드로 결제 테스트

프론트엔드에서 `clientSecret`을 사용하여 Stripe Elements로 결제:

```javascript
// 프론트엔드 예시
const stripe = Stripe('pk_test_...');
const { clientSecret } = await createSubscription({ email, tier, userId });

const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
    },
  },
});
```

**테스트 카드:**
- 성공: `4242 4242 4242 4242`
- 실패: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### 3. 웹훅 테스트

Stripe 대시보드에서:
1. Developers → Webhooks → Test webhook
2. 이벤트 선택: `checkout.session.completed`
3. Send test webhook

또는 Stripe CLI:
```bash
stripe listen --forward-to https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/webhook/stripe
stripe trigger checkout.session.completed
```

### 4. DynamoDB 상태 확인

```bash
aws dynamodb get-item \
  --table-name Users \
  --key '{"userId": {"S": "test-user-123"}}'
```

**예상 결과:**
```json
{
  "userId": "test-user-123",
  "subscriptionTier": "basic",
  "subscriptionStatus": "active",
  "stripeCustomerId": "cus_xxxx",
  "stripeSubscriptionId": "sub_xxxx",
  "subscriptionExpiresAt": "2026-02-11T00:00:00.000Z"
}
```

---

## 📝 환경변수 체크리스트

### create-subscription Lambda
- [ ] `STRIPE_SECRET_KEY` (sk_test_...)
- [ ] `STRIPE_PRICE_BASIC` (price_xxxx_basic)
- [ ] `STRIPE_PRICE_PRO` (price_xxxx_pro)
- [ ] `USERS_TABLE_NAME` (기본값: Users)

### stripe-webhook Lambda
- [ ] `STRIPE_SECRET_KEY` (sk_test_...)
- [ ] `STRIPE_WEBHOOK_SECRET` (whsec_...)
- [ ] `STRIPE_PRICE_BASIC` (price_xxxx_basic)
- [ ] `STRIPE_PRICE_PRO` (price_xxxx_pro)
- [ ] `USERS_TABLE_NAME` (기본값: Users)

### 프론트엔드 (Vercel)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_...)
- [ ] `NEXT_PUBLIC_API_GATEWAY_URL` (API Gateway 엔드포인트)

---

## 🎯 API 엔드포인트 URL

배포 완료 후 다음 URL을 사용:

```
POST https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/create-subscription
POST https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/webhook/stripe
```

---

## ⚠️ 주의사항

1. **웹훅 시그니처 검증**: 반드시 `STRIPE_WEBHOOK_SECRET` 설정
2. **Raw Body**: API Gateway에서 웹훅 엔드포인트는 raw body 전달 필요
3. **테스트 모드**: 개발 중에는 테스트 키 사용, 프로덕션에서는 라이브 키
4. **에러 핸들링**: 모든 Lambda에 try-catch 포함
5. **보안**: API 키는 환경변수에만 저장, 코드에 하드코딩 금지

---

## 🚀 프로덕션 전환

1. Stripe 라이브 모드 전환
2. 라이브 API 키로 환경변수 업데이트
3. 라이브 웹훅 엔드포인트 설정
4. 실제 카드 결제 테스트

---

**보스, Stripe 구독 & 결제 시스템 설정 가이드 준비 완료!**
