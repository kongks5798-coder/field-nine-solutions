# AWS 서버리스 아키텍처 완벽 설정 가이드

## 🎯 전체 아키텍처

```
┌─────────────────┐
│  Next.js PWA    │ (AWS Amplify 배포)
│  (프론트엔드)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │ (RESTful 엔드포인트)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Lambda  │ │Lambda  │ (쇼핑 추천, 일정 관리)
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌─────────────────┐
│   DynamoDB      │ (사용자 데이터)
└─────────────────┘
```

## 📋 단계별 설정

### 1. DynamoDB 테이블 생성

AWS 콘솔에서:
1. DynamoDB > 테이블 생성
2. 테이블 이름: `Users`
3. 파티션 키: `userId` (String)
4. GSI 추가: `email-index` (email)
5. 용량 모드: 온디맨드 (또는 프로비저닝 5/5)

### 2. Lambda 함수 배포

#### 쇼핑 추천 함수
```bash
cd aws/lambda/shopping-recommendation
npm install openai aws-sdk
zip -r function.zip index.js node_modules/
```

AWS CLI:
```bash
aws lambda create-function \
  --function-name shopping-recommendation \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --environment Variables="{OPENAI_API_KEY=sk-xxx,DYNAMODB_TABLE_NAME=Users}" \
  --region ap-northeast-2
```

#### 데일리 일정 함수
동일한 방식으로 `daily-schedule` 함수 생성

#### Stripe 웹훅 함수
```bash
cd aws/lambda/stripe-webhook
npm install stripe aws-sdk
zip -r function.zip index.js node_modules/
```

### 3. API Gateway 설정

1. **REST API 생성**
   - API 이름: `ai-shopping-assistant`
   - 엔드포인트 타입: Regional

2. **리소스 생성**
   - `/recommend` (POST)
   - `/schedule` (POST)
   - `/webhook/stripe` (POST)

3. **Lambda 통합**
   - 각 리소스에 해당 Lambda 함수 연결
   - 통합 타입: Lambda Function
   - Lambda 프록시 통합: 활성화

4. **CORS 설정**
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Methods: `POST, OPTIONS`
   - Access-Control-Allow-Headers: `Content-Type, Authorization`

5. **API 배포**
   - 스테이지: `prod`
   - 배포 후 엔드포인트 URL 복사

### 4. AWS Cognito 설정

1. **사용자 풀 생성**
   - 이름: `field-nine-users`
   - 로그인 옵션: 이메일
   - 비밀번호 정책: 기본

2. **앱 클라이언트 생성**
   - 클라이언트 이름: `field-nine-web`
   - 인증 흐름: ALLOW_USER_PASSWORD_AUTH, ALLOW_REFRESH_TOKEN_AUTH

3. **도메인 설정** (선택사항)
   - Cognito 호스팅 UI 도메인 생성

### 5. 환경 변수 설정

#### Lambda 환경 변수
각 Lambda 함수에 다음 환경 변수 추가:
- `OPENAI_API_KEY`: OpenAI API 키
- `DYNAMODB_TABLE_NAME`: `Users`
- `STRIPE_SECRET_KEY`: Stripe Secret Key (웹훅 함수만)
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook Secret (웹훅 함수만)

#### Next.js 환경 변수 (.env.local)
```env
NEXT_PUBLIC_API_GATEWAY_URL=https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
AWS_REGION=ap-northeast-2
```

### 6. AWS Amplify 배포

1. **Amplify 콘솔**
   - 새 앱 > GitHub에서 호스팅
   - 저장소 선택
   - 브랜치: `main`

2. **빌드 설정**
   - 빌드 설정 파일: `aws/amplify.yml` 사용
   - 환경 변수 추가 (위의 Next.js 환경 변수)

3. **자동 배포**
   - Git push 시 자동 배포 활성화

### 7. PWA 아이콘 생성

```bash
# 192x192, 512x512 PNG 아이콘 생성 후
# public/icon-192x192.png
# public/icon-512x512.png
```

## 🧪 테스트

### API 테스트
```bash
# 쇼핑 추천
curl -X POST https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/prod/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "query": "운동화 추천",
    "preferences": {
      "budget": 200000,
      "brands": ["Nike", "Adidas"]
    }
  }'

# 일정 관리
curl -X POST https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/prod/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "date": "2026-01-11",
    "action": "get"
  }'
```

### PWA 테스트
1. Chrome DevTools > Application > Service Workers
2. "Update on reload" 활성화
3. 페이지 새로고침
4. Service Worker 등록 확인

## 💰 비용 예상

### 월 1,000명 유저 기준
- **Lambda**: 100만 요청 = $0.20
- **DynamoDB**: 100만 읽기/쓰기 = $0.25
- **API Gateway**: 100만 요청 = $3.50
- **Amplify**: 무료 티어 (월 1000 빌드 분)
- **Cognito**: 무료 티어 (월 50,000 MAU)

**총 예상 비용: 월 $4-5**

### 월 10,000명 유저 기준
- **Lambda**: 1,000만 요청 = $2.00
- **DynamoDB**: 1,000만 읽기/쓰기 = $2.50
- **API Gateway**: 1,000만 요청 = $35.00
- **Amplify**: 무료 티어
- **Cognito**: 무료 티어

**총 예상 비용: 월 $40-45**

## 🔒 보안 체크리스트

- [ ] API Gateway에 WAF 규칙 추가
- [ ] Lambda 함수에 VPC 설정 (필요시)
- [ ] DynamoDB 암호화 활성화
- [ ] Cognito MFA 활성화
- [ ] 환경 변수 암호화 (AWS Secrets Manager)
- [ ] CORS 정책 제한 (프로덕션 도메인만)

## 🚀 배포 완료 후

1. **모니터링 설정**
   - CloudWatch 대시보드 생성
   - Lambda 에러 알림 설정
   - API Gateway 로그 활성화

2. **성능 최적화**
   - Lambda 프로비저닝된 동시성 설정
   - DynamoDB 캐싱 (DAX) 고려
   - API Gateway 캐싱 활성화

3. **마케팅 준비**
   - X/Instagram 광고 캠페인
   - 베타 유저 100명 모집
   - 피드백 수집 시스템

**보스, AWS 서버리스 인프라 연결까지 완료되었습니다!**
