# Lambda 함수 배포 가이드

## 📋 필수 사전 준비

### 1. AWS 계정 설정
- AWS 계정 생성 및 로그인
- IAM 권한 확인 (Lambda, API Gateway, DynamoDB 접근 권한)

### 2. API 키 준비
- **OpenAI API 키**: https://platform.openai.com/api-keys
- **Claude API 키** (옵션): https://console.anthropic.com/
- **Google Calendar API 키** (옵션): https://console.cloud.google.com/

---

## 🚀 Lambda 함수 배포 (3개)

### Step 1: recommendShopping Lambda 배포

#### 1-1. Lambda 함수 생성
```bash
# AWS CLI 사용
aws lambda create-function \
  --function-name field-nine-recommend-shopping \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://recommend-shopping.zip \
  --timeout 30 \
  --memory-size 512
```

#### 1-2. 환경변수 설정
AWS 콘솔 → Lambda → `field-nine-recommend-shopping` → Configuration → Environment variables

```
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-... (옵션)
OPENAI_MODEL=gpt-4o-mini
USERS_TABLE_NAME=Users
```

#### 1-3. 코드 업로드
```bash
# 로컬에서 zip 파일 생성
cd aws/lambda/recommend-shopping
zip -r recommend-shopping.zip index.js package.json node_modules/

# AWS CLI로 업로드
aws lambda update-function-code \
  --function-name field-nine-recommend-shopping \
  --zip-file fileb://recommend-shopping.zip
```

---

### Step 2: dailySchedule Lambda 배포

#### 2-1. Lambda 함수 생성
```bash
aws lambda create-function \
  --function-name field-nine-daily-schedule \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://daily-schedule.zip \
  --timeout 30 \
  --memory-size 512
```

#### 2-2. 환경변수 설정
```
GOOGLE_CALENDAR_API_KEY=...
GOOGLE_CLIENT_ID=... (OAuth용)
GOOGLE_CLIENT_SECRET=... (OAuth용)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
USERS_TABLE_NAME=Users
```

---

### Step 3: predictSavings Lambda 배포

#### 3-1. Lambda 함수 생성
```bash
aws lambda create-function \
  --function-name field-nine-predict-savings \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://predict-savings.zip \
  --timeout 30 \
  --memory-size 512
```

#### 3-2. 환경변수 설정
```
RECOMMENDATIONS_TABLE_NAME=ProductRecommendations
USERS_TABLE_NAME=Users
```

---

## 🔗 API Gateway 연결

### Step 1: API Gateway 생성
```bash
aws apigateway create-rest-api \
  --name field-nine-ai-api \
  --description "Field Nine AI API"
```

### Step 2: 리소스 생성
```bash
# /recommend 리소스
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part recommend

# /schedule 리소스
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part schedule

# /predict-savings 리소스
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part predict-savings
```

### Step 3: Lambda 통합 설정
```bash
# recommendShopping Lambda 통합
aws apigateway put-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id RECOMMEND_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:ap-northeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-northeast-2:YOUR_ACCOUNT_ID:function:field-nine-recommend-shopping/invocations
```

### Step 4: CORS 설정
```bash
# OPTIONS 메서드 추가 (CORS preflight)
aws apigateway put-method \
  --rest-api-id YOUR_API_ID \
  --resource-id RECOMMEND_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE
```

### Step 5: 배포
```bash
aws apigateway create-deployment \
  --rest-api-id YOUR_API_ID \
  --stage-name prod
```

---

## 🧪 테스트

### 1. recommendShopping 테스트
```bash
curl -X POST https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "오늘 저녁 뭐 입을까? 예산 5만원",
    "userId": "test-user-123"
  }'
```

**예상 응답:**
```json
{
  "success": true,
  "recommendation": "이 셔츠 어때요? 38,000원에 세일 중! 따뜻하고 스타일 좋아요~ 예상 절약 12,000원",
  "priceInfo": {
    "currentPrice": 50000,
    "predictedDiscount": 20,
    "estimatedSavings": 12000,
    "daysUntilSale": 3
  },
  "dataSource": ["OpenAI GPT-4o-mini", "가격 예측 모델 (Mock)"]
}
```

### 2. dailySchedule 테스트
```bash
curl -X POST https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "action": "get",
    "date": "2026-01-11"
  }'
```

### 3. predictSavings 테스트
```bash
curl -X POST https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/predict-savings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "days": 7,
    "model": "xgboost"
  }'
```

---

## 🔐 IAM 역할 설정

### Lambda 실행 역할 생성
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/*"
    }
  ]
}
```

---

## 📝 환경변수 체크리스트

### recommendShopping
- [ ] `OPENAI_API_KEY`
- [ ] `CLAUDE_API_KEY` (옵션)
- [ ] `OPENAI_MODEL` (기본값: gpt-4o-mini)
- [ ] `USERS_TABLE_NAME` (기본값: Users)

### dailySchedule
- [ ] `GOOGLE_CALENDAR_API_KEY`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `OPENAI_API_KEY`
- [ ] `OPENAI_MODEL`
- [ ] `USERS_TABLE_NAME`

### predictSavings
- [ ] `RECOMMENDATIONS_TABLE_NAME` (기본값: ProductRecommendations)
- [ ] `USERS_TABLE_NAME`

---

## 🎯 API 엔드포인트 URL

배포 완료 후 다음 URL을 프론트엔드에 설정:

```env
NEXT_PUBLIC_API_GATEWAY_URL=https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod
```

---

## ⚠️ 주의사항

1. **API 키 보안**: 환경변수에만 저장, 코드에 하드코딩 금지
2. **CORS 설정**: 프로덕션에서는 특정 도메인만 허용
3. **Rate Limiting**: API Gateway에서 요청 제한 설정 권장
4. **에러 핸들링**: 모든 Lambda 함수에 try-catch 포함

---

**보스, Lambda 함수 배포 가이드 준비 완료!**
